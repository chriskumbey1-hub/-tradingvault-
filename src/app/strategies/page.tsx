"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Target, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface Strategy {
  id: string;
  strategy_name: string;
  description: string;
  user_id: string;
  created_at: string;
}

interface StrategyStats {
  trades: number;
  wins: number;
  pnl: number;
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = React.useState<Strategy[]>([]);
  const [strategyStats, setStrategyStats] = React.useState<
    Record<string, StrategyStats>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editStrategy, setEditStrategy] = React.useState<Strategy | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ strategy_name: "", description: "" });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: strats } = await supabase
      .from("strategies")
      .select("*")
      .order("created_at", { ascending: false });
    setStrategies(strats || []);

    const { data: trades } = await supabase
      .from("trades")
      .select("strategy, profit_loss");

    const stats: Record<string, StrategyStats> = {};
    (trades || []).forEach((t: { strategy: string; profit_loss: number }) => {
      const name = t.strategy || "Untyped";
      if (!stats[name]) stats[name] = { trades: 0, wins: 0, pnl: 0 };
      stats[name].trades++;
      if ((t.profit_loss || 0) > 0) stats[name].wins++;
      stats[name].pnl += t.profit_loss || 0;
    });

    setStrategyStats(stats);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const openAddDialog = () => {
    setEditStrategy(null);
    setForm({ strategy_name: "", description: "" });
    setOpen(true);
  };

  const openEditDialog = (strategy: Strategy) => {
    setEditStrategy(strategy);
    setForm({
      strategy_name: strategy.strategy_name,
      description: strategy.description || "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.strategy_name) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    if (editStrategy) {
      await supabase
        .from("strategies")
        .update({ strategy_name: form.strategy_name, description: form.description })
        .eq("id", editStrategy.id);
    } else {
      await supabase.from("strategies").insert({
        user_id: user.id,
        strategy_name: form.strategy_name,
        description: form.description,
      });
    }

    setSubmitting(false);
    setOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("strategies").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Strategies</h1>
            <p className="text-sm text-zinc-400">
              Track and analyze your trading strategies
            </p>
          </div>
          <Button className="gap-2" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add Strategy
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-lg bg-zinc-800" />
            ))}
          </div>
        ) : strategies.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Target className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-lg font-medium text-zinc-400">No strategies yet</p>
              <p className="mb-4 text-sm text-zinc-500">
                Add a strategy to start tracking its performance
              </p>
              <Button className="gap-2" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                Add Strategy
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {strategies.map((strategy, index) => {
              const stats = strategyStats[strategy.strategy_name] || { trades: 0, wins: 0, pnl: 0 };
              const winRate = stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : 0;
              return (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10">
                          <Target className="h-5 w-5 text-purple-500" />
                        </div>
                        <CardTitle className="text-base text-zinc-100">
                          {strategy.strategy_name}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(strategy)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => setDeleteId(strategy.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {strategy.description && (
                        <p className="text-sm text-zinc-400">{strategy.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-zinc-100">
                            {stats.trades}
                          </p>
                          <p className="text-xs text-zinc-500">Trades</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-zinc-100">
                            {winRate}%
                          </p>
                          <p className="text-xs text-zinc-500">Win Rate</p>
                        </div>
                        <div className="text-center">
                          <p
                            className={`text-2xl font-bold ${
                              stats.pnl >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                          >
                            {stats.pnl >= 0 ? "+" : ""}${Math.round(stats.pnl).toLocaleString()}
                          </p>
                          <p className="text-xs text-zinc-500">P&L</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                {editStrategy ? "Edit Trading Strategy" : "Add Trading Strategy"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {editStrategy
                  ? "Update your strategy details."
                  : "Define a new strategy to track its performance."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Strategy Name</Label>
                <Input
                  placeholder="ICT, Breakout, Scalping"
                  value={form.strategy_name}
                  onChange={(e) => setForm({ ...form, strategy_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Description</Label>
                <Textarea
                  placeholder="Describe your strategy rules and setup..."
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : editStrategy ? "Save Changes" : "Add Strategy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Delete Strategy</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete this strategy? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
