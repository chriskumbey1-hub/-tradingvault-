"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Filter,
  Loader2,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  GitMerge,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface ImportedTrade {
  id: string;
  connection_id: string;
  broker_trade_id: string;
  symbol: string;
  market_type: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  entry_time: string | null;
  exit_time: string | null;
  lot_size: number;
  profit_loss: number;
  commission: number;
  swap: number;
  fees: number;
  status: string;
  merged: boolean;
  merged_trade_id: string | null;
  created_at: string;
}

interface BrokerConnection {
  id: string;
  account_name: string;
  broker_name: string;
  provider: string;
}

export default function ImportedTradesPage() {
  const [trades, setTrades] = React.useState<ImportedTrade[]>([]);
  const [connections, setConnections] = React.useState<BrokerConnection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedConnection, setSelectedConnection] = React.useState<string>("all");
  const [selectedTrades, setSelectedTrades] = React.useState<Set<string>>(new Set());
  const [merging, setMerging] = React.useState(false);
  const [strategy, setStrategy] = React.useState("");

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();

    const [tradesRes, connRes] = await Promise.all([
      supabase
        .from("imported_trades")
        .select("*")
        .order("entry_time", { ascending: false })
        .limit(500),
      supabase
        .from("broker_connections")
        .select("id, account_name, broker_name, provider")
        .order("created_at", { ascending: false }),
    ]);

    if (tradesRes.data) setTrades(tradesRes.data);
    if (connRes.data) setConnections(connRes.data);
    setLoading(false);
  };

  const filteredTrades = selectedConnection === "all"
    ? trades
    : trades.filter((t) => t.connection_id === selectedConnection);

  const unmergedTrades = filteredTrades.filter((t) => !t.merged);
  const mergedTrades = filteredTrades.filter((t) => t.merged);

  const totalPnl = filteredTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const winCount = filteredTrades.filter((t) => t.profit_loss > 0).length;
  const winRate = filteredTrades.length > 0 ? (winCount / filteredTrades.length) * 100 : 0;

  const toggleTrade = (id: string) => {
    setSelectedTrades((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTrades(new Set(unmergedTrades.map((t) => t.id)));
  };

  const deselectAll = () => {
    setSelectedTrades(new Set());
  };

  const handleMerge = async (mergeAll = false) => {
    setMerging(true);
    try {
      const res = await fetch("/api/imported-trades/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeIds: mergeAll ? undefined : Array.from(selectedTrades),
          connectionId: mergeAll && selectedConnection !== "all" ? selectedConnection : undefined,
          strategy: strategy || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Merged ${data.merged} trades into journal`);
        setSelectedTrades(new Set());
        fetchData();
      } else {
        toast.error(data.error || "Merge failed");
      }
    } catch {
      toast.error("Merge failed");
    } finally {
      setMerging(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/accounts">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-zinc-100">Imported Trades</h1>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Trades synced from brokers. Merge them into your journal.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-500" />
            <select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200"
            >
              <option value="all">All Connections</option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.account_name} ({c.broker_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Total Imported</p>
              <p className="text-lg font-semibold text-zinc-100">{filteredTrades.length}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Unmerged</p>
              <p className="text-lg font-semibold text-amber-400">{unmergedTrades.length}</p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Total P&L</p>
              <p className={`text-lg font-semibold ${totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-500">Win Rate</p>
              <p className="text-lg font-semibold text-zinc-100">{winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Merge Controls */}
        {unmergedTrades.length > 0 && (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All ({unmergedTrades.length})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      Deselect
                    </Button>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {selectedTrades.size} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Strategy (optional)"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 w-48"
                  />
                  <Button
                    size="sm"
                    disabled={selectedTrades.size === 0 || merging}
                    onClick={() => handleMerge(false)}
                  >
                    {merging ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GitMerge className="mr-2 h-4 w-4" />
                    )}
                    Merge Selected ({selectedTrades.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={merging}
                    onClick={() => handleMerge(true)}
                  >
                    Merge All Unmerged
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trades Table */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">
              {mergedTrades.length > 0 ? "All Imported Trades" : "Imported Trades"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full bg-zinc-800" />
                ))}
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-10 w-10 text-zinc-600 mb-3" />
                <p className="text-sm text-zinc-400">No imported trades yet</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Connect a broker and sync to import trades
                </p>
                <Link href="/connect-broker">
                  <Button variant="outline" size="sm" className="mt-4">
                    Connect Broker
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {!mergedTrades.length && <TableHead className="w-8"></TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="hidden md:table-cell">Entry</TableHead>
                    <TableHead className="hidden md:table-cell">Exit</TableHead>
                    <TableHead>Lot Size</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Merged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      {!trade.merged && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTrades.has(trade.id)}
                            onChange={() => toggleTrade(trade.id)}
                            className="rounded border-zinc-600 bg-zinc-800"
                          />
                        </TableCell>
                      )}
                      <TableCell className="text-zinc-300 text-sm">
                        {trade.entry_time
                          ? new Date(trade.entry_time).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-100 text-sm">
                        {trade.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge variant={trade.direction === "long" ? "default" : "secondary"} className="text-xs">
                          {trade.direction === "long" ? (
                            <TrendingUp className="mr-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="mr-1 h-3 w-3" />
                          )}
                          {trade.direction.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-zinc-300 text-sm">
                        {trade.entry_price}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-zinc-300 text-sm">
                        {trade.exit_price ?? "—"}
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm">
                        {trade.lot_size}
                      </TableCell>
                      <TableCell className={trade.profit_loss >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {trade.profit_loss >= 0 ? "+" : ""}${trade.profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            trade.status === "win"
                              ? "default"
                              : trade.status === "loss"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {trade.merged ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                            <Check className="mr-1 h-3 w-3" /> Merged
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-zinc-600 text-zinc-500 text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
