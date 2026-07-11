"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { TradingAccount } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: TradingAccount | null;
  onDelete: (id: string, deleteTrades: boolean) => void;
  deleting: boolean;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  account,
  onDelete,
  deleting,
}: DeleteConfirmModalProps) {
  const [deleteTrades, setDeleteTrades] = React.useState(false);

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-2">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <DialogTitle className="text-center text-zinc-100">Delete Account</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Are you sure you want to delete <span className="font-medium text-zinc-300">{account.account_name}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="px-1 py-2">
          <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors">
            <input
              type="checkbox"
              checked={deleteTrades}
              onChange={(e) => setDeleteTrades(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500/50"
            />
            <div>
              <p className="text-sm text-zinc-300">Also delete all imported trades</p>
              <p className="text-xs text-zinc-500">
                Keep unchecked to preserve your journal data
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(account.id, deleteTrades)}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
