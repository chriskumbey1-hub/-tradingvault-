"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Target, Clock, Trash2, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    goal_type: "monthly_pnl",
    target_value: "",
    current_value: "0",
    unit: "$",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  const supabase = createClient();

  const fetchGoals = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setGoals(data);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      goal_type: "monthly_pnl",
      target_value: "",
      current_value: "0",
      unit: "$",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
  };

  const handleCreate = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: formData.title,
      description: formData.description || null,
      goal_type: formData.goal_type,
      target_value: parseFloat(formData.target_value),
      current_value: parseFloat(formData.current_value) || 0,
      unit: formData.unit,
      start_date: formData.start_date,
      end_date: formData.end_date,
    });

    if (!error) {
      setShowCreate(false);
      resetForm();
      fetchGoals();
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!editingGoal) return;
    setSaving(true);

    const { error } = await supabase
      .from("goals")
      .update({
        title: formData.title,
        description: formData.description || null,
        goal_type: formData.goal_type,
        target_value: parseFloat(formData.target_value),
        current_value: parseFloat(formData.current_value) || 0,
        unit: formData.unit,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: parseFloat(formData.current_value) >= parseFloat(formData.target_value) ? "completed" : "active",
      })
      .eq("id", editingGoal.id);

    if (!error) {
      setEditingGoal(null);
      resetForm();
      fetchGoals();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    await supabase.from("goals").delete().eq("id", id);
    fetchGoals();
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || "",
      goal_type: goal.goal_type,
      target_value: goal.target_value.toString(),
      current_value: goal.current_value.toString(),
      unit: goal.unit,
      start_date: goal.start_date,
      end_date: goal.end_date,
    });
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const goalTypeLabels: Record<string, string> = {
    monthly_pnl: "Monthly P&L",
    win_rate: "Win Rate",
    trade_count: "Trade Count",
    custom: "Custom",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Goals</h1>
            <p className="text-sm text-zinc-400">Track your trading goals and progress</p>
          </div>
          <Button className="gap-2" onClick={() => { resetForm(); setShowCreate(true); }}>
            <Plus className="h-4 w-4" />
            New Goal
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
                    <div className="h-2 w-full rounded bg-zinc-800" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-zinc-700" />
              <p className="mt-4 text-lg font-medium text-zinc-400">No goals yet</p>
              <p className="text-sm text-zinc-500">Create your first goal to start tracking progress</p>
              <Button className="mt-4 gap-2" onClick={() => { resetForm(); setShowCreate(true); }}>
                <Plus className="h-4 w-4" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-100">Active Goals</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.map((goal, i) => {
                    const progress = goal.target_value > 0
                      ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                      : 0;
                    const daysLeft = Math.max(0, Math.ceil(
                      (new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    ));

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card className="border-zinc-800 bg-zinc-900/50">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-zinc-100">{goal.title}</h3>
                                <p className="text-xs text-zinc-500">{goalTypeLabels[goal.goal_type]}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(goal)}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(goal.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {goal.description && (
                              <p className="mt-2 text-sm text-zinc-400">{goal.description}</p>
                            )}
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">
                                  {goal.unit}{goal.current_value.toLocaleString()} / {goal.unit}{goal.target_value.toLocaleString()}
                                </span>
                                <span className="font-medium text-blue-400">{progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                              <Clock className="h-3 w-3" />
                              {daysLeft} days remaining
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedGoals.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-100">Completed Goals</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completedGoals.map((goal) => (
                    <Card key={goal.id} className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <h3 className="font-semibold text-zinc-100">{goal.title}</h3>
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">
                          {goal.unit}{goal.current_value.toLocaleString()} / {goal.unit}{goal.target_value.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showCreate || !!editingGoal} onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditingGoal(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit Goal" : "Create Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Make $5,000 this month"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Goal Type</Label>
                <Select value={formData.goal_type} onValueChange={(v) => setFormData({ ...formData, goal_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly_pnl">Monthly P&L</SelectItem>
                    <SelectItem value="win_rate">Win Rate</SelectItem>
                    <SelectItem value="trade_count">Trade Count</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Unit</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="$"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Target Value</Label>
                <Input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Current Value</Label>
                <Input
                  type="number"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingGoal(null); }}>
              Cancel
            </Button>
            <Button onClick={editingGoal ? handleUpdate : handleCreate} disabled={saving || !formData.title}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingGoal ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
