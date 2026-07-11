"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Activity,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

interface Trade {
  id: string;
  symbol: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit: number;
  lot_size: number;
  risk_amount: number;
  profit_loss: number;
  commission: number;
  fees: number;
  strategy: string;
  status: string;
  trade_date: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [trades, setTrades] = React.useState<Trade[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTrades = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: true });
      setTrades(data || []);
      setLoading(false);
    };
    fetchTrades();
  }, []);

  const metrics = React.useMemo(() => {
    if (trades.length === 0) return null;

    const totalTrades = trades.length;
    const wins = trades.filter((t) => (t.profit_loss || 0) > 0);
    const losses = trades.filter((t) => (t.profit_loss || 0) < 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

    const grossProfit = wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const grossLoss = Math.abs(
      losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0)
    );
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const totalPnl = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const expectancy = totalTrades > 0 ? totalPnl / totalTrades : 0;

    const rrTrades = trades.filter(
      (t) => t.stop_loss && t.take_profit && t.entry_price
    );
    const avgRR =
      rrTrades.length > 0
        ? rrTrades.reduce((sum, t) => {
            const risk = Math.abs(t.entry_price - t.stop_loss);
            const reward = Math.abs(t.take_profit - t.entry_price);
            return sum + (risk > 0 ? reward / risk : 0);
          }, 0) / rrTrades.length
        : 0;

    return {
      totalTrades,
      winRate,
      profitFactor,
      expectancy,
      avgRR,
      wins: wins.length,
      losses: losses.length,
    };
  }, [trades]);

  const strategyPerformance = React.useMemo(() => {
    const grouped: Record<
      string,
      { trades: number; wins: number; pnl: number; rrSum: number; rrCount: number }
    > = {};

    trades.forEach((t) => {
      const name = t.strategy || "Untyped";
      if (!grouped[name]) {
        grouped[name] = { trades: 0, wins: 0, pnl: 0, rrSum: 0, rrCount: 0 };
      }
      grouped[name].trades++;
      if ((t.profit_loss || 0) > 0) grouped[name].wins++;
      grouped[name].pnl += t.profit_loss || 0;
      if (t.stop_loss && t.take_profit && t.entry_price) {
        const risk = Math.abs(t.entry_price - t.stop_loss);
        const reward = Math.abs(t.take_profit - t.entry_price);
        if (risk > 0) {
          grouped[name].rrSum += reward / risk;
          grouped[name].rrCount++;
        }
      }
    });

    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        trades: data.trades,
        winRate: data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0,
        pnl: Math.round(data.pnl),
        avgRR: data.rrCount > 0 ? Math.round((data.rrSum / data.rrCount) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.trades - a.trades);
  }, [trades]);

  const performanceByDay = React.useMemo(() => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const grouped: Record<number, { trades: number; wins: number; pnl: number }> = {};

    trades.forEach((t) => {
      const d = new Date(t.trade_date);
      const dayIdx = d.getDay();
      if (!grouped[dayIdx]) grouped[dayIdx] = { trades: 0, wins: 0, pnl: 0 };
      grouped[dayIdx].trades++;
      if ((t.profit_loss || 0) > 0) grouped[dayIdx].wins++;
      grouped[dayIdx].pnl += t.profit_loss || 0;
    });

    return [1, 2, 3, 4, 5].map((idx) => ({
      day: dayNames[idx],
      trades: grouped[idx]?.trades || 0,
      winRate:
        grouped[idx] && grouped[idx].trades > 0
          ? Math.round((grouped[idx].wins / grouped[idx].trades) * 100)
          : 0,
      pnl: grouped[idx] ? Math.round(grouped[idx].pnl) : 0,
    }));
  }, [trades]);

  const performanceByDate = React.useMemo(() => {
    const grouped: Record<string, { trades: number; wins: number; pnl: number }> = {};

    trades.forEach((t) => {
      const dateStr = t.trade_date;
      if (!grouped[dateStr]) grouped[dateStr] = { trades: 0, wins: 0, pnl: 0 };
      grouped[dateStr].trades++;
      if ((t.profit_loss || 0) > 0) grouped[dateStr].wins++;
      grouped[dateStr].pnl += t.profit_loss || 0;
    });

    const sorted = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15);

    return sorted.map(([date, data]) => ({
      date,
      trades: data.trades,
      winRate: data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0,
      pnl: Math.round(data.pnl),
    }));
  }, [trades]);

  const cumulativePnl = React.useMemo(() => {
    if (trades.length === 0) return [];
    let cumulative = 0;
    return trades.map((t) => {
      cumulative += t.profit_loss || 0;
      return cumulative;
    });
  }, [trades]);

  const maxPnl = React.useMemo(() => {
    if (cumulativePnl.length === 0) return 1;
    return Math.max(...cumulativePnl.map(Math.abs), 1);
  }, [cumulativePnl]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-400">
            Deep dive into your trading performance
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg bg-zinc-800" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-80 rounded-lg bg-zinc-800" />
              <Skeleton className="h-80 rounded-lg bg-zinc-800" />
            </div>
            <Skeleton className="h-64 rounded-lg bg-zinc-800" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64 rounded-lg bg-zinc-800" />
              <Skeleton className="h-64 rounded-lg bg-zinc-800" />
            </div>
          </div>
        ) : trades.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-lg font-medium text-zinc-400">No trades yet</p>
              <p className="text-sm text-zinc-500">
                Add some trades to see your analytics
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <StatsCard
                  title="Total Trades"
                  value={String(metrics!.totalTrades)}
                  icon={<Activity className="h-4 w-4" />}
                  variant="info"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <StatsCard
                  title="Win Rate"
                  value={`${Math.round(metrics!.winRate)}%`}
                  icon={<Target className="h-4 w-4" />}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <StatsCard
                  title="Profit Factor"
                  value={metrics!.profitFactor === Infinity ? "∞" : metrics!.profitFactor.toFixed(1)}
                  icon={<BarChart3 className="h-4 w-4" />}
                  variant={metrics!.profitFactor >= 1 ? "success" : "danger"}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <StatsCard
                  title="Expectancy"
                  value={`$${metrics!.expectancy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  icon={<DollarSign className="h-4 w-4" />}
                  variant={metrics!.expectancy >= 0 ? "success" : "danger"}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <StatsCard
                  title="Average RR"
                  value={`1:${metrics!.avgRR}`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </motion.div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">
                      Cumulative P&L Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cumulativePnl.length === 0 ? (
                      <p className="py-4 text-center text-sm text-zinc-500">No data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={cumulativePnl.map((val, i) => ({ name: `T${i + 1}`, value: val }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#f4f4f5" }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Cumulative P&L"]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {cumulativePnl.map((val, i) => (
                              <Cell key={i} fill={val >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.7} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">
                      Win/Loss Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-64 items-center justify-center">
                      <div className="relative h-48 w-48">
                        <svg className="h-full w-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="20"
                            strokeDasharray={`${metrics!.winRate * 2.51} ${100 * 2.51}`}
                            strokeDashoffset="0"
                            transform="rotate(-90 50 50)"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="20"
                            strokeDasharray={`${(100 - metrics!.winRate) * 2.51} ${100 * 2.51}`}
                            strokeDashoffset={`-${metrics!.winRate * 2.51}`}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-zinc-100">
                            {Math.round(metrics!.winRate)}%
                          </span>
                          <span className="text-sm text-zinc-400">Win Rate</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-zinc-400">Wins ({metrics!.wins})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-sm text-zinc-400">Losses ({metrics!.losses})</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100">
                    Strategy Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {strategyPerformance.length === 0 ? (
                    <p className="py-4 text-center text-sm text-zinc-500">No strategies found</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Strategy</TableHead>
                          <TableHead>Trades</TableHead>
                          <TableHead>Win Rate</TableHead>
                          <TableHead>Total P&L</TableHead>
                          <TableHead>Avg RR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategyPerformance.map((strategy) => (
                          <TableRow key={strategy.name}>
                            <TableCell className="font-medium text-zinc-100">
                              {strategy.name}
                            </TableCell>
                            <TableCell className="text-zinc-300">
                              {strategy.trades}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-16 rounded-full bg-zinc-800">
                                  <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${strategy.winRate}%` }}
                                  />
                                </div>
                                <span className="text-sm text-zinc-300">
                                  {strategy.winRate}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell
                              className={
                                strategy.pnl >= 0
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }
                            >
                              {strategy.pnl >= 0 ? "+" : ""}${strategy.pnl.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-zinc-300">
                              1:{strategy.avgRR}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid gap-4 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">
                      Performance by Day
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceByDay.map((day) => (
                        <div key={day.day} className="flex items-center gap-4">
                          <div className="w-24 text-sm text-zinc-400">
                            {day.day}
                          </div>
                          <div className="flex-1">
                            <div className="h-4 w-full rounded-full bg-zinc-800">
                              <div
                                className={`h-full rounded-full ${
                                  day.pnl >= 0 ? "bg-emerald-500" : "bg-red-500"
                                }`}
                                style={{ width: `${day.winRate}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-20 text-right text-sm text-zinc-300">
                            {day.winRate}%
                          </div>
                          <div
                            className={`w-20 text-right text-sm font-medium ${
                              day.pnl >= 0 ? "text-emerald-500" : "text-red-500"
                            }`}
                          >
                            {day.pnl >= 0 ? "+" : ""}${day.pnl.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">
                      Performance by Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performanceByDate.length === 0 ? (
                      <p className="py-4 text-center text-sm text-zinc-500">No data available</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={performanceByDate.map((e) => ({ name: new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: e.pnl }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
                          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", color: "#f4f4f5" }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "P&L"]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {performanceByDate.map((entry, i) => (
                              <Cell key={i} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.7} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
