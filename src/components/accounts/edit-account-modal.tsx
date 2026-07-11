"use client";

import * as React from "react";
import { TradingAccount } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: TradingAccount | null;
  onSave: (id: string, data: { account_name: string; server_name: string }) => void;
  saving: boolean;
}

export function EditAccountModal({
  open,
  onOpenChange,
  account,
  onSave,
  saving,
}: EditAccountModalProps) {
  const [name, setName] = React.useState("");
  const [server, setServer] = React.useState("");

  React.useEffect(() => {
    if (account) {
      setName(account.account_name);
      setServer(account.server_name);
    }
  }, [account]);

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Edit Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Account Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Account name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Server</Label>
            <Input
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="Broker server"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(account.id, { account_name: name, server_name: server })}
            disabled={saving || !name.trim()}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
