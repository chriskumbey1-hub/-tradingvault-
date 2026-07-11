"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Wallet, TrendingUp, TrendingDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface Account {
  id: string;
  name: string;
  broker: string;
  account_type: string;
  balance: number;
  currency: string;
  user_id: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editAccount, setEditAccount] = React.useState<Account | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    broker: "",
    account_type: "live",
    balance: "",
    currency: "USD",
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchAccounts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("trading_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setAccounts(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchAccounts();
  }, []);

  const openAddDialog = () => {
    setEditAccount(null);
    setForm({ name: "", broker: "", account_type: "live", balance: "", currency: "USD" });
    setOpen(true);
  };

  const openEditDialog = (account: Account) => {
    setEditAccount(account);
    setForm({
      name: account.name,
      broker: account.broker,
      account_type: account.account_type,
      balance: String(account.balance),
      currency: account.currency,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.broker) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    if (editAccount) {
      await supabase
        .from("trading_accounts")
        .update({
          name: form.name,
          broker: form.broker,
          account_type: form.account_type,
          balance: Number(form.balance) || 0,
          currency: form.currency,
        })
        .eq("id", editAccount.id);
    } else {
      await supabase.from("trading_accounts").insert({
        user_id: user.id,
        name: form.name,
        broker: form.broker,
        account_type: form.account_type,
        balance: Number(form.balance) || 0,
        currency: form.currency,
      });
    }

    setSubmitting(false);
    setOpen(false);
    fetchAccounts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const supabase = createClient();
    await supabase.from("trading_accounts").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchAccounts();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">
              Trading Accounts
            </h1>
            <p className="text-sm text-zinc-400">
              Manage your trading accounts
            </p>
          </div>
          <Button className="gap-2" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg bg-zinc-800" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-lg font-medium text-zinc-400">No accounts yet</p>
              <p className="mb-4 text-sm text-zinc-500">
                Add a trading account to get started
              </p>
              <Button className="gap-2" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
                        <Wallet className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-zinc-100">
                          {account.name}
                        </CardTitle>
                        <p className="text-sm text-zinc-400">{account.broker}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => setDeleteId(account.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Type</span>
                      <Badge variant="secondary">{account.account_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                      <span className="text-sm text-zinc-400">Balance</span>
                      <span className="text-sm font-medium text-zinc-100">
                        {account.currency} {account.balance.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">
                {editAccount ? "Edit Trading Account" : "Add Trading Account"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {editAccount
                  ? "Update your trading account details."
                  : "Connect a new trading account to track your performance."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Account Name</Label>
                <Input
                  placeholder="My Trading Account"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Broker</Label>
                <Input
                  placeholder="IC Markets, Binance, etc."
                  value={form.broker}
                  onChange={(e) => setForm({ ...form, broker: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Account Type</Label>
                <Select
                  value={form.account_type}
                  onValueChange={(v) => setForm({ ...form, account_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="prop">Prop Firm</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Initial Balance</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Saving..." : editAccount ? "Save Changes" : "Add Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="border-zinc-800 bg-zinc-900">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Delete Account</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Are you sure you want to delete this account? This action cannot be undone.
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
