"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Upload,
  TrendingUp,
  TrendingDown,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  lot_size: number;
  profit_loss: number | null;
  strategy: string | null;
  status: string;
  trade_date: string;
  notes: string | null;
}

function TableSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  );
}

export default function JournalPage() {
  const router = useRouter();
  const [trades, setTrades] = React.useState<Trade[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [directionFilter, setDirectionFilter] = React.useState("all");

  React.useEffect(() => {
    async function fetchTrades() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false });

      if (!error && data) {
        setTrades(data);
      }
      setLoading(false);
    }

    fetchTrades();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trade deleted");
    } else {
      toast.error("Failed to delete trade");
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (trade.strategy && trade.strategy.toLowerCase().includes(search.toLowerCase())) ||
      (trade.notes && trade.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || trade.status === statusFilter;
    const matchesDirection =
      directionFilter === "all" || trade.direction === directionFilter;
    return matchesSearch && matchesStatus && matchesDirection;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Trading Journal</h1>
            <p className="text-sm text-zinc-400">
              View and manage all your trades
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/journal/import">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </Link>
            <Link href="/journal/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Trade
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search by symbol, strategy, or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="win">Wins</SelectItem>
                  <SelectItem value="loss">Losses</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={directionFilter}
                onValueChange={setDirectionFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="p-0">
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Direction</TableHead>
                        <TableHead className="hidden md:table-cell">Entry</TableHead>
                        <TableHead className="hidden md:table-cell">Exit</TableHead>
                        <TableHead>P&L</TableHead>
                        <TableHead className="hidden lg:table-cell">Strategy</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell className="hidden sm:table-cell text-zinc-300">
                            {new Date(trade.trade_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium text-zinc-100">
                            {trade.symbol}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                trade.direction === "long"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {trade.direction === "long" ? (
                                <TrendingUp className="mr-1 h-3 w-3" />
                              ) : (
                                <TrendingDown className="mr-1 h-3 w-3" />
                              )}
                              {trade.direction.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-zinc-300">
                            {trade.entry_price}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-zinc-300">
                            {trade.exit_price ?? "—"}
                          </TableCell>
                          <TableCell
                            className={
                              (trade.profit_loss || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                            }
                          >
                            {(trade.profit_loss || 0) >= 0 ? "+" : ""}
                            ${(trade.profit_loss || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-zinc-300">
                            {trade.strategy ?? "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant={
                                trade.status === "win"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {trade.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Trade actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/journal/${trade.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/journal/${trade.id}/edit`)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => handleDelete(trade.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredTrades.length === 0 && (
                    <div className="py-12 text-center text-zinc-500">
                      No trades found matching your filters.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
