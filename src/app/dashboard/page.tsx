"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

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
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-sm font-medium text-zinc-100">
        ${payload[0].value?.toLocaleString()}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function fetchTrades() {
      const supabase = createClient();
      
      // Check onboarding status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();
        
        if (prefs && !prefs.onboarding_completed) {
          setShowOnboarding(true);
        }
      }

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

  const totalTrades = trades.length;
  const totalProfit = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const winCount = trades.filter((t) => t.status === "win").length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const grossProfit = trades.filter((t) => (t.profit_loss || 0) > 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const grossLoss = Math.abs(trades.filter((t) => (t.profit_loss || 0) < 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const recentTrades = trades.slice(0, 10);

  const equityCurveData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
    let cumulative = 0;
    return sorted.map((t, i) => {
      cumulative += t.profit_loss || 0;
      return { name: `Trade ${i + 1}`, value: cumulative };
    });
  }, [trades]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};
    trades.forEach((t) => {
      const month = t.trade_date.substring(0, 7);
      grouped[month] = (grouped[month] || 0) + (t.profit_loss || 0);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, pnl]) => ({
        name: new Date(month + "-01").toLocaleDateString("en-US", { month: "short" }),
        value: Math.round(pnl),
      }));
  }, [trades]);

  return (
    <DashboardLayout>
      {showOnboarding && <OnboardingFlow onComplete={() => setShowOnboarding(false)} />}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-400">Welcome back! Here&apos;s your trading overview.</p>
        </div>

        {loading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <StatsCard title="Total Trades" value={totalTrades.toString()} icon={<Activity className="h-4 w-4" />} variant="info" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatsCard
                title="Total Profit"
                value={`${totalProfit >= 0 ? "+" : ""}$${totalProfit.toLocaleString()}`}
                icon={<DollarSign className="h-4 w-4" />}
                variant={totalProfit >= 0 ? "success" : "danger"}
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatsCard title="Win Rate" value={`${winRate.toFixed(1)}%`} icon={<Target className="h-4 w-4" />} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <StatsCard title="Profit Factor" value={profitFactor === Infinity ? "∞" : profitFactor.toFixed(2)} icon={<BarChart3 className="h-4 w-4" />} />
            </motion.div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                {equityCurveData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-zinc-500">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={equityCurveData}>
                      <defs>
                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#equityGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center text-sm text-zinc-500">No data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {monthlyData.map((entry, i) => (
                          <rect key={i} fill={entry.value >= 0 ? "#10b981" : "#ef4444"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-6 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : recentTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-zinc-500">No trades yet</p>
                  <Link href="/journal/new">
                    <Button className="mt-4 gap-2">Add Your First Trade</Button>
                  </Link>
                </div>
              ) : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="hidden sm:table-cell text-zinc-300">{new Date(trade.trade_date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-zinc-100">{trade.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={trade.direction === "long" ? "default" : "secondary"}>
                            {trade.direction === "long" ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                            {trade.direction.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-zinc-300">{trade.entry_price}</TableCell>
                        <TableCell className="hidden md:table-cell text-zinc-300">{trade.exit_price ?? "—"}</TableCell>
                        <TableCell className={(trade.profit_loss || 0) >= 0 ? "text-emerald-500" : "text-red-500"}>
                          {(trade.profit_loss || 0) >= 0 ? "+" : ""}${(trade.profit_loss || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-zinc-300">{trade.strategy ?? "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={trade.status === "win" ? "default" : "destructive"}>{trade.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
