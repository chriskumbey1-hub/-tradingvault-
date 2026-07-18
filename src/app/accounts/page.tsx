"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Package,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Unlink,
  ArrowUpDown,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  Search,
  Filter,

} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlatformSelectModal } from "@/components/accounts/platform-select-modal";
import { ConnectionFormModal } from "@/components/accounts/connection-form-modal";
import { ConnectionProgressModal } from "@/components/accounts/connection-progress-modal";
import { EditAccountModal } from "@/components/accounts/edit-account-modal";
import { DeleteConfirmModal } from "@/components/accounts/delete-confirm-modal";
import { PLATFORMS } from "@/lib/platforms";
import { TradingAccount, PlatformType, ConnectionStage } from "@/types";

const STAGE_LABELS = [
  "Connecting to broker...",
  "Validating credentials...",
  "Retrieving account information...",
  "Downloading historical trades...",
  "Importing account history...",
  "Starting live synchronization...",
  "Finalizing setup...",
];

export default function AccountsPage() {
  const [accounts, setAccounts] = React.useState<TradingAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [sortField, setSortField] = React.useState<keyof TradingAccount>("created_at");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const [platformModalOpen, setPlatformModalOpen] = React.useState(false);
  const [connectionFormOpen, setConnectionFormOpen] = React.useState(false);
  const [selectedPlatform, setSelectedPlatform] = React.useState<PlatformType | null>(null);
  const [connecting, setConnecting] = React.useState(false);

  const [progressOpen, setProgressOpen] = React.useState(false);
  const [progressStages, setProgressStages] = React.useState<ConnectionStage[]>([]);
  const [progressCurrent, setProgressCurrent] = React.useState(0);
  const [progressError, setProgressError] = React.useState<string | null>(null);
  const [progressSuccess, setProgressSuccess] = React.useState(false);

  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<TradingAccount | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deletingAccount, setDeletingAccount] = React.useState<TradingAccount | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [syncingAll, setSyncingAll] = React.useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = React.useMemo(() => {
    let result = [...accounts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.account_name.toLowerCase().includes(q) ||
          a.broker_name.toLowerCase().includes(q) ||
          a.platform.toLowerCase().includes(q) ||
          a.login_id.includes(q)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((a) => a.connection_status === filterStatus);
    }

    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (sortDir === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [accounts, searchQuery, filterStatus, sortField, sortDir]);

  const handlePlatformSelect = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    setConnectionFormOpen(true);
  };

  const handleConnect = async (data: {
    platform: PlatformType;
    accountName: string;
    credentials: Record<string, string>;
    accountType: string;
  }) => {
    setConnecting(true);
    setConnectionFormOpen(false);

    const stages: ConnectionStage[] = STAGE_LABELS.map((label) => ({
      label,
      status: "pending" as const,
    }));
    setProgressStages(stages);
    setProgressCurrent(0);
    setProgressError(null);
    setProgressSuccess(false);
    setProgressOpen(true);

    for (let i = 0; i < stages.length; i++) {
      setProgressStages((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === i ? "active" : idx < i ? "done" : "pending",
        }))
      );
      setProgressCurrent(i);
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));
    }

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: data.platform,
          accountName: data.accountName,
          credentials: data.credentials,
          accountType: data.accountType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Connection failed");
      }

      setProgressStages((prev) =>
        prev.map((s) => ({ ...s, status: "done" }))
      );
      setProgressSuccess(true);
      toast.success("Account connected successfully!");
      fetchAccounts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setProgressStages((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === progressCurrent ? "error" : s.status,
        }))
      );
      setProgressError(msg);
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      if (res.ok) {
        toast.success("Account synced");
        fetchAccounts();
      } else {
        toast.error("Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    const connected = accounts.filter((a) => a.connection_status === "connected");
    await Promise.all(connected.map((a) => handleSync(a.id)));
    setSyncingAll(false);
    toast.success("All accounts synced");
  };

  const handleReconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconnect" }),
      });
      if (res.ok) {
        toast.success("Account reconnected");
        fetchAccounts();
      } else {
        toast.error("Reconnect failed");
      }
    } catch {
      toast.error("Reconnect failed");
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      if (res.ok) {
        toast.success("Account disconnected");
        fetchAccounts();
      } else {
        toast.error("Disconnect failed");
      }
    } catch {
      toast.error("Disconnect failed");
    }
  };

  const handleEditSave = async (id: string, data: { account_name: string; server_name: string }) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", data }),
      });
      if (res.ok) {
        toast.success("Account updated");
        setEditModalOpen(false);
        fetchAccounts();
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, deleteTrades: boolean) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${id}?deleteTrades=${deleteTrades}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Account deleted");
        setDeleteModalOpen(false);
        fetchAccounts();
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 gap-1">
            <Wifi className="h-3 w-3" />
            Connected
          </Badge>
        );
      case "syncing":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20 gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case "disconnected":
        return (
          <Badge className="bg-zinc-500/10 text-zinc-400 ring-1 ring-inset ring-zinc-500/20 gap-1">
            <WifiOff className="h-3 w-3" />
            Disconnected
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20 gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    const p = PLATFORMS.find((pl) => pl.id === platform);
    if (!p) return <Badge variant="secondary">{platform}</Badge>;
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-zinc-300">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: p.logoColor }}
        />
        {p.name}
      </span>
    );
  };

  const formatCurrency = (val: number, currency?: string) => {
    return `${currency || "USD"} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "Never";
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Trading Accounts</h1>
            <p className="text-sm text-zinc-400">
              Manage and sync your broker accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleSyncAll}
              disabled={syncingAll || accounts.filter((a) => a.connection_status === "connected").length === 0}
            >
              {syncingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync All
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setPlatformModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Account
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => window.location.href = "/imported-trades"}
            >
              <Package className="h-4 w-4" />
              Imported Trades
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filterStatus === "all" ? "All Status" : filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("connected")}>Connected</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("disconnected")}>Disconnected</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("error")}>Error</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg bg-zinc-800" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
                <Link2 className="h-8 w-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-1">
                No accounts connected
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">
                Connect your trading account to automatically import trades, track performance, and analyze your strategy in real time.
              </p>
              <Button className="gap-2" onClick={() => setPlatformModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Connect Your First Account
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium">
                      <button
                        onClick={() => {
                          setSortField("account_name");
                          setSortDir(sortField === "account_name" && sortDir === "desc" ? "asc" : "desc");
                        }}
                        className="flex items-center gap-1 hover:text-zinc-300"
                      >
                        Account
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden md:table-cell">Platform</TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden lg:table-cell">Server</TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden lg:table-cell">Type</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-right">
                      <button
                        onClick={() => {
                          setSortField("current_balance");
                          setSortDir(sortField === "current_balance" && sortDir === "desc" ? "asc" : "desc");
                        }}
                        className="flex items-center gap-1 hover:text-zinc-300 ml-auto"
                      >
                        Balance
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium text-right hidden md:table-cell">Equity</TableHead>
                    <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                    <TableHead className="text-zinc-400 font-medium hidden xl:table-cell">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Sync
                      </span>
                    </TableHead>
                    <TableHead className="text-zinc-400 font-medium text-right w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account, index) => (
                    <motion.tr
                      key={account.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-zinc-800/50 group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                            {account.platform?.toUpperCase().slice(0, 2) || "MN"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-100 truncate">
                              {account.account_name}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                              {account.login_id || account.broker_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getPlatformBadge(account.platform)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-zinc-400 truncate block max-w-[140px]">
                          {account.server_name || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge
                          variant="secondary"
                          className={
                            account.account_type === "live"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : account.account_type === "demo"
                              ? "bg-blue-500/10 text-blue-400"
                              : account.account_type === "prop"
                              ? "bg-purple-500/10 text-purple-400"
                              : ""
                          }
                        >
                          {account.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium text-zinc-100">
                          {formatCurrency(account.current_balance, account.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <span className={`text-sm ${
                          account.equity >= account.current_balance ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {formatCurrency(account.equity || account.current_balance, account.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(account.connection_status)}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <span className="text-xs text-zinc-500">
                          {formatTime(account.last_sync)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Account actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleSync(account.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Sync Now
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingAccount(account);
                                setEditModalOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            {account.connection_status === "connected" ? (
                              <DropdownMenuItem onClick={() => handleReconnect(account.id)}>
                                <Wifi className="mr-2 h-4 w-4" />
                                Reconnect
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleDisconnect(account.id)}>
                                <Unlink className="mr-2 h-4 w-4" />
                                Disconnect
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
                              onClick={() => {
                                setDeletingAccount(account);
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAccounts.length === 0 && searchQuery && (
              <div className="py-12 text-center">
                <p className="text-zinc-400">No accounts match your search</p>
              </div>
            )}
          </motion.div>
        )}

        <PlatformSelectModal
          open={platformModalOpen}
          onOpenChange={setPlatformModalOpen}
          onSelect={handlePlatformSelect}
        />

        <ConnectionFormModal
          open={connectionFormOpen}
          platform={selectedPlatform}
          onOpenChange={setConnectionFormOpen}
          onConnect={handleConnect}
          connecting={connecting}
        />

        <ConnectionProgressModal
          open={progressOpen}
          onOpenChange={setProgressOpen}
          stages={progressStages}
          currentStage={progressCurrent}
          error={progressError}
          success={progressSuccess}
        />

        <EditAccountModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          account={editingAccount}
          onSave={handleEditSave}
          saving={savingEdit}
        />

        <DeleteConfirmModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          account={deletingAccount}
          onDelete={handleDelete}
          deleting={deleting}
        />
      </div>
    </DashboardLayout>
  );
}
