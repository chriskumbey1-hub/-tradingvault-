"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ConnectionStage } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConnectionProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: ConnectionStage[];
  currentStage: number;
  error: string | null;
  success: boolean;
}

const STAGE_LABELS = [
  "Connecting to broker...",
  "Validating credentials...",
  "Retrieving account information...",
  "Downloading historical trades...",
  "Importing account history...",
  "Starting live synchronization...",
  "Finalizing setup...",
];

export function ConnectionProgressModal({
  open,
  onOpenChange,
  stages,
  currentStage,
  error,
  success,
}: ConnectionProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={success || error ? onOpenChange : undefined}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900 p-0" onPointerDownOutside={(e) => {
        if (!success && !error) e.preventDefault();
      }}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg text-zinc-100">
            {error ? "Connection Failed" : success ? "Connected!" : "Connecting Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-3">
          {stages.map((stage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                {stage.status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : stage.status === "active" ? (
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                ) : stage.status === "error" ? (
                  <XCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                )}
              </div>
              <span
                className={`text-sm ${
                  stage.status === "done"
                    ? "text-zinc-400"
                    : stage.status === "active"
                    ? "text-zinc-100 font-medium"
                    : stage.status === "error"
                    ? "text-red-400"
                    : "text-zinc-600"
                }`}
              >
                {stage.label}
              </span>
            </motion.div>
          ))}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3"
            >
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center"
            >
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm text-emerald-400 font-medium">
                Account connected successfully!
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Your trades will begin syncing shortly
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
