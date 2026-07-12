"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, FlaskConical, Trash2, Edit2, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface Backtest {
  id: string;
  strategy_name: string;
  symbol: string;
  market_type: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  final_balance: number | null;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number | null;
  profit_factor: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  avg_rr: number | null;
  notes: string | null;
  equity_curve: number[];
  created_at: string;
}

export default function BacktestsPage() {
  const [backtests, setBacktests] = React.useState<Backtest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Backtest | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    strategy_name: "",
    symbol: "",
    market_type: "forex",
    timeframe: "1H",
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    initial_balance: "10000",
    final_balance: "",
    total_trades: "0",
    winning_trades: "0",
    losing_trades: "0",
    win_rate: "",
    profit_factor: "",
    max_drawdown: "",
    sharpe_ratio: "",
    avg_rr: "",
    notes: "",
  });

  const supabase = createClient();

  const fetchBacktests = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("backtests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setBacktests(data);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    fetchBacktests();
  }, [fetchBacktests]);

  const resetForm = () => {
    setFormData({
      strategy_name: "",
      symbol: "",
      market_type: "forex",
      timeframe: "1H",
      start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      initial_balance: "10000",
      final_balance: "",
      total_trades: "0",
      winning_trades: "0",
      losing_trades: "0",
      win_rate: "",
      profit_factor: "",
      max_drawdown: "",
      sharpe_ratio: "",
      avg_rr: "",
      notes: "",
    });
  };

  const autoCalculate = () => {
    const total = parseInt(formData.total_trades) || 0;
    const wins = parseInt(formData.winning_trades) || 0;
    const losses = parseInt(formData.losing_trades) || 0;
    const initial = parseFloat(formData.initial_balance) || 10000;
    const final = parseFloat(formData.final_balance) || initial;

    const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "";
    const profitFactor = losses > 0 && wins > 0 ? (wins / losses).toFixed(2) : "";

    setFormData({
      ...formData,
      win_rate: winRate,
      profit_factor: profitFactor,
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const initial = parseFloat(formData.initial_balance) || 10000;
    const final = parseFloat(formData.final_balance) || initial;

    const { error } = await supabase.from("backtests").insert({
      user_id: user.id,
      strategy_name: formData.strategy_name,
      symbol: formData.symbol,
      market_type: formData.market_type,
      timeframe: formData.timeframe,
      start_date: formData.start_date,
      end_date: formData.end_date,
      initial_balance: initial,
      final_balance: final,
      total_trades: parseInt(formData.total_trades) || 0,
      winning_trades: parseInt(formData.winning_trades) || 0,
      losing_trades: parseInt(formData.losing_trades) || 0,
      win_rate: parseFloat(formData.win_rate) || null,
      profit_factor: parseFloat(formData.profit_factor) || null,
      max_drawdown: parseFloat(formData.max_drawdown) || null,
      sharpe_ratio: parseFloat(formData.sharpe_ratio) || null,
      avg_rr: parseFloat(formData.avg_rr) || null,
      notes: formData.notes || null,
      equity_curve: [],
    });

    if (!error) {
      setShowCreate(false);
      resetForm();
      fetchBacktests();
      toast.success("Backtest created");
    } else {
      toast.error("Failed to create backtest");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this backtest?")) return;
    const { error } = await supabase.from("backtests").delete().eq("id", id);
    if (!error) {
      fetchBacktests();
      toast.success("Backtest deleted");
    } else {
      toast.error("Failed to delete backtest");
    }
  };

  const openEdit = (bt: Backtest) => {
    setEditing(bt);
    setFormData({
      strategy_name: bt.strategy_name,
      symbol: bt.symbol,
      market_type: bt.market_type,
      timeframe: bt.timeframe,
      start_date: bt.start_date,
      end_date: bt.end_date,
      initial_balance: bt.initial_balance.toString(),
      final_balance: bt.final_balance?.toString() || "",
      total_trades: bt.total_trades.toString(),
      winning_trades: bt.winning_trades.toString(),
      losing_trades: bt.losing_trades.toString(),
      win_rate: bt.win_rate?.toString() || "",
      profit_factor: bt.profit_factor?.toString() || "",
      max_drawdown: bt.max_drawdown?.toString() || "",
      sharpe_ratio: bt.sharpe_ratio?.toString() || "",
      avg_rr: bt.avg_rr?.toString() || "",
      notes: bt.notes || "",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Strategy Backtesting</h1>
            <p className="text-sm text-zinc-400">Test and analyze your trading strategies</p>
          </div>
          <Button className="gap-2" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="h-4 w-4" />
            New Backtest
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-zinc-800 bg-zinc-900/50 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 w-32 rounded bg-zinc-800" />
                    <div className="h-3 w-48 rounded bg-zinc-800" />
                    <div className="h-20 w-full rounded bg-zinc-800" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : backtests.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-zinc-700" />
              <p className="mt-4 text-lg font-medium text-zinc-400">No backtests yet</p>
              <p className="text-sm text-zinc-500">Create your first backtest to analyze a strategy</p>
              <Button className="mt-4 gap-2" onClick={() => { resetForm(); setShowCreate(true); }}>
                <Plus className="h-4 w-4" />
                Create Backtest
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {backtests.map((bt, i) => {
              const pnl = bt.final_balance !== null ? bt.final_balance - bt.initial_balance : 0;
              const pnlPct = bt.initial_balance > 0 ? (pnl / bt.initial_balance) * 100 : 0;
              const isProfit = pnl >= 0;

              return (
                <motion.div
                  key={bt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-zinc-100">{bt.strategy_name}</h3>
                          <p className="text-xs text-zinc-500">{bt.symbol} • {bt.timeframe}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bt)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(bt.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-zinc-500">Total Trades</p>
                          <p className="text-sm font-medium text-zinc-100">{bt.total_trades}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Win Rate</p>
                          <p className="text-sm font-medium text-zinc-100">{bt.win_rate?.toFixed(1) || "—"}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Profit Factor</p>
                          <p className="text-sm font-medium text-zinc-100">{bt.profit_factor?.toFixed(2) || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Max Drawdown</p>
                          <p className="text-sm font-medium text-red-400">{bt.max_drawdown?.toFixed(1) || "—"}%</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-800/50 p-3">
                        <div className="flex items-center gap-2">
                          {isProfit ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                            {isProfit ? "+" : ""}{pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500">
                          ${bt.initial_balance.toLocaleString()} → ${bt.final_balance?.toLocaleString() || "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showCreate || !!editing} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Backtest" : "New Backtest"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Strategy Name</Label>
                <Input value={formData.strategy_name} onChange={(e) => setFormData({ ...formData, strategy_name: e.target.value })} placeholder="ICT Breaker Block" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Symbol</Label>
                <Input value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} placeholder="EUR/USD" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Market</Label>
                <Select value={formData.market_type} onValueChange={(v) => setFormData({ ...formData, market_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forex">Forex</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="commodities">Commodities</SelectItem>
                    <SelectItem value="indices">Indices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Timeframe</Label>
                <Select value={formData.timeframe} onValueChange={(v) => setFormData({ ...formData, timeframe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1M">1M</SelectItem>
                    <SelectItem value="5M">5M</SelectItem>
                    <SelectItem value="15M">15M</SelectItem>
                    <SelectItem value="1H">1H</SelectItem>
                    <SelectItem value="4H">4H</SelectItem>
                    <SelectItem value="1D">1D</SelectItem>
                    <SelectItem value="1W">1W</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Initial Balance</Label>
                <Input type="number" value={formData.initial_balance} onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">End Date</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Total Trades</Label>
                <Input type="number" value={formData.total_trades} onChange={(e) => setFormData({ ...formData, total_trades: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Winning Trades</Label>
                <Input type="number" value={formData.winning_trades} onChange={(e) => setFormData({ ...formData, winning_trades: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Losing Trades</Label>
                <Input type="number" value={formData.losing_trades} onChange={(e) => setFormData({ ...formData, losing_trades: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Final Balance</Label>
                <Input type="number" value={formData.final_balance} onChange={(e) => setFormData({ ...formData, final_balance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Max Drawdown %</Label>
                <Input type="number" value={formData.max_drawdown} onChange={(e) => setFormData({ ...formData, max_drawdown: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Sharpe Ratio</Label>
                <Input type="number" step="0.01" value={formData.sharpe_ratio} onChange={(e) => setFormData({ ...formData, sharpe_ratio: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={autoCalculate}>
                Auto-calculate Win Rate & PF
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Win Rate %</Label>
                <Input type="number" step="0.1" value={formData.win_rate} onChange={(e) => setFormData({ ...formData, win_rate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Profit Factor</Label>
                <Input type="number" step="0.01" value={formData.profit_factor} onChange={(e) => setFormData({ ...formData, profit_factor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Avg R:R</Label>
                <Input type="number" step="0.01" value={formData.avg_rr} onChange={(e) => setFormData({ ...formData, avg_rr: e.target.value })} placeholder="2.0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Strategy rules, observations, market conditions..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={editing ? async () => {
              setSaving(true);
              const { error } = await supabase.from("backtests").update({
                strategy_name: formData.strategy_name,
                symbol: formData.symbol,
                market_type: formData.market_type,
                timeframe: formData.timeframe,
                start_date: formData.start_date,
                end_date: formData.end_date,
                initial_balance: parseFloat(formData.initial_balance) || 10000,
                final_balance: parseFloat(formData.final_balance) || null,
                total_trades: parseInt(formData.total_trades) || 0,
                winning_trades: parseInt(formData.winning_trades) || 0,
                losing_trades: parseInt(formData.losing_trades) || 0,
                win_rate: parseFloat(formData.win_rate) || null,
                profit_factor: parseFloat(formData.profit_factor) || null,
                max_drawdown: parseFloat(formData.max_drawdown) || null,
                sharpe_ratio: parseFloat(formData.sharpe_ratio) || null,
                avg_rr: parseFloat(formData.avg_rr) || null,
                notes: formData.notes || null,
              }).eq("id", editing.id);
              if (!error) {
                setEditing(null);
                fetchBacktests();
                toast.success("Backtest updated");
              } else {
                toast.error("Failed to update backtest");
              }
              setSaving(false);
            } : handleCreate} disabled={saving || !formData.strategy_name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
