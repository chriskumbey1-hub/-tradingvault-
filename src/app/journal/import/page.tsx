"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DB_FIELDS = [
  { key: "symbol", label: "Symbol", required: true },
  { key: "direction", label: "Direction", required: true },
  { key: "trade_date", label: "Trade Date", required: true },
  { key: "market_type", label: "Market Type", required: false },
  { key: "entry_price", label: "Entry Price", required: false },
  { key: "exit_price", label: "Exit Price", required: false },
  { key: "stop_loss", label: "Stop Loss", required: false },
  { key: "take_profit", label: "Take Profit", required: false },
  { key: "lot_size", label: "Lot Size", required: false },
  { key: "risk_amount", label: "Risk Amount", required: false },
  { key: "profit_loss", label: "Profit/Loss", required: false },
  { key: "commission", label: "Commission", required: false },
  { key: "fees", label: "Fees", required: false },
  { key: "strategy", label: "Strategy", required: false },
  { key: "setup", label: "Setup", required: false },
  { key: "emotion", label: "Emotion", required: false },
  { key: "confidence_level", label: "Confidence Level", required: false },
  { key: "notes", label: "Notes", required: false },
  { key: "status", label: "Status", required: false },
];

function autoMap(columns: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  DB_FIELDS.forEach((field) => {
    const match = columns.find(
      (col) =>
        col.toLowerCase().replace(/[\s_-]/g, "") ===
        field.key.toLowerCase().replace(/[\s_-]/g, "")
    );
    if (match) mapping[field.key] = match;
  });
  return mapping;
}

export default function ImportCSVPage() {
  const [csvText, setCsvText] = React.useState("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ success: number; errors: number } | null>(null);
  const [error, setError] = React.useState("");

  const parseCSV = (text: string) => {
    const lines: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < text.length && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "\n" && !inQuotes) {
        lines.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) lines.push(current);

    if (lines.length < 2) {
      setError("CSV must have at least a header row and one data row.");
      return;
    }

    const splitRow = (line: string): string[] => {
      const cells: string[] = [];
      let cell = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && i + 1 < line.length && line[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQ = !inQ;
          }
        } else if (ch === "," && !inQ) {
          cells.push(cell.trim());
          cell = "";
        } else {
          cell += ch;
        }
      }
      cells.push(cell.trim());
      return cells;
    };

    const hdrs = splitRow(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
    const data = lines.slice(1).map((line) =>
      splitRow(line).map((cell) => cell.replace(/^"|"$/g, ""))
    );
    setHeaders(hdrs);
    setRows(data);
    setMapping(autoMap(hdrs));
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setImporting(false);
      return;
    }

    let success = 0;
    let errors = 0;

    const validTrades: Record<string, unknown>[] = [];

    for (const row of rows) {
      const trade: Record<string, unknown> = { user_id: user.id };
      let valid = true;

      DB_FIELDS.forEach((field) => {
        const csvCol = mapping[field.key];
        if (!csvCol) return;
        const colIdx = headers.indexOf(csvCol);
        if (colIdx === -1) return;
        const val = row[colIdx]?.trim();
        if (!val) return;

        if (["entry_price", "exit_price", "stop_loss", "take_profit", "lot_size", "risk_amount", "profit_loss", "commission", "fees"].includes(field.key)) {
          trade[field.key] = parseFloat(val) || 0;
        } else if (field.key === "confidence_level") {
          trade[field.key] = parseInt(val) || null;
        } else {
          trade[field.key] = val;
        }
      });

      if (!trade.symbol || !trade.direction || !trade.trade_date) {
        errors++;
        continue;
      }

      if (!trade.status) trade.status = "breakeven";
      if (!trade.commission) trade.commission = 0;
      if (!trade.fees) trade.fees = 0;

      validTrades.push(trade);
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < validTrades.length; i += BATCH_SIZE) {
      const batch = validTrades.slice(i, i + BATCH_SIZE);
      const { error: insertError } = await supabase.from("trades").insert(batch);
      if (insertError) errors += batch.length;
      else success += batch.length;
    }

    setResult({ success, errors });
    setImporting(false);
  };

  const previewRows = rows.slice(0, 10);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/journal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Import Trades from CSV</h1>
            <p className="text-sm text-zinc-400">Upload a CSV file to bulk import your trades</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Import Complete</p>
                <p className="text-sm text-zinc-400">
                  {result.success} imported, {result.errors} errors
                </p>
              </div>
            </div>
          </div>
        )}

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 transition-colors hover:border-zinc-600">
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-zinc-500" />
                <p className="mt-2 text-sm text-zinc-400">
                  <label className="cursor-pointer text-blue-400 hover:underline">
                    Click to upload
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                  </label>
                  {" "}or drag and drop
                </p>
                <p className="mt-1 text-xs text-zinc-500">CSV files only</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {headers.length > 0 && (
          <>
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">Column Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {DB_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="w-32 text-sm text-zinc-400 truncate">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                      </span>
                      <Select
                        value={mapping[field.key] || ""}
                        onValueChange={(val) =>
                          setMapping((prev) => ({ ...prev, [field.key]: val }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">
                  Preview ({rows.length} rows total, showing first {previewRows.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.slice(0, 8).map((h) => (
                        <TableHead key={h} className="text-xs">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {row.slice(0, 8).map((cell, j) => (
                          <TableCell key={j} className="text-xs text-zinc-300">{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button variant="outline" asChild>
                <Link href="/journal">Cancel</Link>
              </Button>
              <Button onClick={handleImport} disabled={importing} className="gap-2">
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import {rows.length} Trades
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
