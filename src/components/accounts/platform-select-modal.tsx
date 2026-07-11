"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Wifi, WifiOff, Search } from "lucide-react";
import { PLATFORMS } from "@/lib/platforms";
import { PlatformType } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlatformSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platform: PlatformType) => void;
}

const platformIcons: Record<string, string> = {
  mt5: "M5",
  mt4: "M4",
  binance: "BN",
  bybit: "BY",
  coinbase: "CB",
  kraken: "KR",
  ctrader: "CT",
  matchtrader: "MT",
  dxtrade: "DX",
  tradelocker: "TL",
  ibkr: "IB",
  manual: "MN",
  exness: "EX",
};

export function PlatformSelectModal({ open, onOpenChange, onSelect }: PlatformSelectModalProps) {
  const [search, setSearch] = React.useState("");
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const filtered = PLATFORMS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const forex = filtered.filter((p) => p.category === "forex");
  const crypto = filtered.filter((p) => p.category === "crypto");
  const multi = filtered.filter((p) => p.category === "multi");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-zinc-800 bg-zinc-900 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl text-zinc-100">
            Select Trading Platform
          </DialogTitle>
          <p className="text-sm text-zinc-400 mt-1">
            Choose the platform you want to connect
          </p>
        </DialogHeader>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              placeholder="Search platforms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 py-2.5 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 pt-4 space-y-6 scrollbar-thin">
          {forex.length > 0 && (
            <PlatformSection
              title="Forex & CFD Platforms"
              platforms={forex}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={(id) => {
                onOpenChange(false);
                onSelect(id);
              }}
            />
          )}
          {crypto.length > 0 && (
            <PlatformSection
              title="Crypto Exchanges"
              platforms={crypto}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={(id) => {
                onOpenChange(false);
                onSelect(id);
              }}
            />
          )}
          {multi.length > 0 && (
            <PlatformSection
              title="Multi-Asset & Manual"
              platforms={multi}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={(id) => {
                onOpenChange(false);
                onSelect(id);
              }}
            />
          )}
          {filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-400">No platforms found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PlatformSection({
  title,
  platforms,
  hoveredId,
  onHover,
  onSelect,
}: {
  title: string;
  platforms: typeof PLATFORMS;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: PlatformType) => void;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <AnimatePresence>
          {platforms.map((platform, index) => (
            <motion.button
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelect(platform.id)}
              onMouseEnter={() => onHover(platform.id)}
              onMouseLeave={() => onHover(null)}
              className={`group flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-200 ${
                hoveredId === platform.id
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-800/50"
              }`}
            >
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: platform.logoColor + "20", color: platform.logoColor }}
              >
                {platformIcons[platform.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-100 truncate">
                    {platform.name}
                  </span>
                  {platform.hasApi && (
                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                      API
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{platform.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
