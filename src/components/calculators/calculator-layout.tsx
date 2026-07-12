"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Calculator, ChevronLeft, ChevronRight, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CalcDef {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  formula: string;
  tips: string[];
}

export const CALCULATORS: CalcDef[] = [
  { id: "monte-carlo", name: "Monte Carlo", icon: "🎲", category: "Advanced", description: "Run thousands of simulations to forecast your trading outcomes and probability distributions.", formula: "Simulates N trades using random outcomes based on win rate and risk/reward", tips: ["Use at least 1000 simulations for reliable results", "Higher simulation counts give more accurate distributions", "Compare different risk levels to find optimal strategy"] },
  { id: "position-size", name: "Position Size", icon: "📐", category: "Risk Management", description: "Calculate the optimal position size based on your risk tolerance and account size.", formula: "Lot Size = Risk Amount / (Stop Loss Pips × Pip Value)", tips: ["Never risk more than 2% per trade", "Always account for spread", "Consider correlation between positions"] },
  { id: "risk-reward", name: "Risk / Reward", icon: "⚖️", category: "Risk Management", description: "Determine the risk-to-reward ratio for any trade setup.", formula: "Risk = (Entry − Stop) ÷ Pip Size\nReward = (Target − Entry) ÷ Pip Size\nRatio = Reward ÷ Risk", tips: ["Aim for minimum 1:2 risk reward", "Higher ratios allow lower win rates to be profitable", "Factor in realistic exit targets"] },
  { id: "profit", name: "Profit Calculator", icon: "💰", category: "Analysis", description: "Calculate potential profit or loss for any trade.", formula: "Profit = Pips × Pip Value × Lot Size", tips: ["Include spread and commission in calculations", "Factor in slippage for realistic estimates", "Use this to set realistic profit targets"] },
  { id: "pip-value", name: "Pip Value", icon: "📊", category: "Analysis", description: "Determine the dollar value of a single pip movement.", formula: "Pip Value = Lot Size × Contract Size × Pip Size", tips: ["Pip value changes with exchange rates", "Critical for accurate risk calculations", "Different pairs have different pip values"] },
  { id: "margin", name: "Margin Calculator", icon: "🏦", category: "Risk Management", description: "Calculate margin requirements for your trades.", formula: "Margin = (Lot Size × Contract Size × Price) ÷ Leverage", tips: ["Monitor margin usage to avoid liquidation", "Higher leverage = lower margin but higher risk", "Keep margin usage below 50%"] },
  { id: "drawdown", name: "Drawdown Calculator", icon: "📉", category: "Analysis", description: "Measure your maximum drawdown and recovery requirements.", formula: "Drawdown = (Peak − Current) ÷ Peak × 100\nRecovery = Drawdown ÷ Current × 100", tips: ["Smaller drawdowns are easier to recover from", "A 50% loss requires 100% gain to recover", "Track drawdown continuously"] },
  { id: "expectancy", name: "Expectancy Calculator", icon: "🎯", category: "Analysis", description: "Calculate your expected profit or loss per trade.", formula: "Expectancy = (Win% × Avg Win) − (Loss% × Avg Loss)", tips: ["Positive expectancy means a profitable system", "Higher expectancy = more robust strategy", "Factor in commissions and fees"] },
  { id: "win-rate", name: "Win Rate Calculator", icon: "🏆", category: "Analysis", description: "Calculate your win rate and loss rate from trading results.", formula: "Win Rate = Winning Trades ÷ Total Trades × 100", tips: ["Win rate alone doesn't determine profitability", "Must be combined with risk/reward ratio", "Track over meaningful sample sizes (50+ trades)"] },
  { id: "risk-of-ruin", name: "Risk of Ruin", icon: "⚠️", category: "Risk Management", description: "Estimate the probability of losing your entire account.", formula: "Uses Kelly criterion and statistical modeling", tips: ["Lower risk per trade dramatically reduces risk of ruin", "Even profitable systems can have ruin risk", "Keep risk per trade under 2%"] },
  { id: "kelly", name: "Kelly Criterion", icon: "🃏", category: "Risk Management", description: "Determine the mathematically optimal position size.", formula: "Kelly % = Win% − ((1 − Win%) ÷ Reward:Risk)", tips: ["Never use full Kelly — use half or quarter Kelly", "Reduces variance while maintaining edge", "More aggressive = more volatile returns"] },
  { id: "atr", name: "ATR Position Size", icon: "📏", category: "Risk Management", description: "Use Average True Range for volatility-based position sizing.", formula: "Stop Loss = ATR × Multiplier\nLot Size = Risk Amount ÷ (Stop Pips × Pip Value)", tips: ["Higher ATR = wider stop = smaller position", "Adapts to market volatility automatically", "More robust than fixed pip stops"] },
  { id: "portfolio", name: "Portfolio Risk", icon: "🌐", category: "Advanced", description: "Analyze risk across multiple open positions simultaneously.", formula: "Total Risk = Σ(Position Risk) × (1 + Correlation Factor)", tips: ["Highly correlated positions increase total risk", "Diversify across uncorrelated pairs", "Monitor total portfolio exposure continuously"] },
];

interface CalculatorLayoutProps {
  activeId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
}

export function CalculatorLayout({ activeId, onSelect, children }: CalculatorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [mobileSidebar, setMobileSidebar] = React.useState(false);
  const activeCalc = CALCULATORS.find((c) => c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="hidden md:block">
        <CalcSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          activeId={activeId}
          onSelect={onSelect}
        />
      </div>

      {mobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileSidebar(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <CalcSidebar open={false} onToggle={() => setMobileSidebar(false)} activeId={activeId} onSelect={(id) => { onSelect(id); setMobileSidebar(false); }} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2 sm:px-4">
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileSidebar(true)}>
            <Calculator className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-none">
            {CALCULATORS.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  activeId === c.id
                    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <span className="mr-1">{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setHelpOpen(!helpOpen)}>
            {helpOpen ? <X className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>

          {helpOpen && activeCalc && (
            <aside className="hidden lg:block w-80 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto p-4">
              <HelpPanel calc={activeCalc} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function CalcSidebar({ open, onToggle, activeId, onSelect }: { open: boolean; onToggle: () => void; activeId: string; onSelect: (id: string) => void }) {
  const categories = [...new Set(CALCULATORS.map((c) => c.category))];

  return (
    <aside className={cn(
      "flex h-full flex-col border-r border-zinc-800 bg-zinc-900/80 transition-all duration-200",
      open ? "w-60" : "w-12"
    )}>
      <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-3">
        {open && <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Calculators</span>}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
          {open ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-3">
        {categories.map((cat) => (
          <div key={cat}>
            {open && <p className="px-2 py-1 text-[10px] font-semibold uppercase text-zinc-600">{cat}</p>}
            {CALCULATORS.filter((c) => c.category === cat).map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  activeId === c.id
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <span className="text-sm">{c.icon}</span>
                {open && <span className="truncate text-xs">{c.name}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function HelpPanel({ calc }: { calc: CalcDef }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <span>{calc.icon}</span> {calc.name}
        </h3>
        <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{calc.description}</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{calc.formula}</pre>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-2">Pro Tips</p>
        <ul className="space-y-1.5">
          {calc.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
              <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-blue-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ResultCard({ title, value, description, icon, color = "blue" }: { title: string; value: string; description?: string; icon?: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/20 bg-blue-500/5",
    green: "border-emerald-500/20 bg-emerald-500/5",
    red: "border-red-500/20 bg-red-500/5",
    yellow: "border-yellow-500/20 bg-yellow-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
  };

  return (
    <div className={cn("rounded-xl border p-4 transition-all", colorMap[color] || colorMap.blue)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-400">{title}</p>
        {icon && <span className="text-zinc-500">{icon}</span>}
      </div>
      <p className="mt-1 text-xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {description && <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>}
    </div>
  );
}

export function CalcInput({ label, value, onChange, type = "number", placeholder, suffix, min, max, step }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; suffix?: string; min?: number; max?: number; step?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 py-2 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{suffix}</span>}
      </div>
    </div>
  );
}

export function CalcSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-800/50 py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
