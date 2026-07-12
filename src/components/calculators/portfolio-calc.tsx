"use client";

import * as React from "react";
import { CalcInput, ResultCard, CalcSelect } from "./calculator-layout";
import { calculatePortfolioRisk, PortfolioPosition } from "@/lib/calculators/portfolio";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export function PortfolioCalc() {
  const [balance, setBalance] = React.useState("10000");
  const [positions, setPositions] = React.useState<PortfolioPosition[]>([
    { id: "1", pair: "EUR/USD", lotSize: 1, riskPercent: 2, correlation: 0 },
    { id: "2", pair: "GBP/USD", lotSize: 0.5, riskPercent: 1.5, correlation: 0.8 },
  ]);

  const addPosition = () => {
    setPositions([...positions, {
      id: Date.now().toString(),
      pair: "USD/JPY",
      lotSize: 0.5,
      riskPercent: 1,
      correlation: 0,
    }]);
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  const updatePosition = (id: string, field: keyof PortfolioPosition, value: string | number) => {
    setPositions(positions.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const result = React.useMemo(
    () => calculatePortfolioRisk(positions, Number(balance)),
    [positions, balance]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Portfolio Risk Calculator</h2>
          <p className="text-sm text-zinc-400">Analyze risk across multiple open positions</p>
        </div>
        <Button size="sm" variant="outline" onClick={addPosition} className="gap-1">
          <Plus className="h-3 w-3" /> Add Position
        </Button>
      </div>

      <CalcInput label="Account Balance" value={balance} onChange={setBalance} suffix="USD" />

      <div className="space-y-3">
        {positions.map((pos, i) => (
          <div key={pos.id} className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400">Position {i + 1}</span>
              {positions.length > 1 && (
                <button onClick={() => removePosition(pos.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <CalcSelect label="Pair" value={pos.pair} onChange={(v) => updatePosition(pos.id, "pair", v)} options={[
                { value: "EUR/USD", label: "EUR/USD" }, { value: "GBP/USD", label: "GBP/USD" },
                { value: "USD/JPY", label: "USD/JPY" }, { value: "AUD/USD", label: "AUD/USD" },
                { value: "USD/CAD", label: "USD/CAD" }, { value: "NZD/USD", label: "NZD/USD" },
                { value: "XAU/USD", label: "XAU/USD" }, { value: "BTC/USD", label: "BTC/USD" },
              ]} />
              <CalcInput label="Lot Size" value={pos.lotSize.toString()} onChange={(v) => updatePosition(pos.id, "lotSize", Number(v))} min={0.01} step={0.01} />
              <CalcInput label="Risk %" value={pos.riskPercent.toString()} onChange={(v) => updatePosition(pos.id, "riskPercent", Number(v))} min={0.01} step={0.1} />
              <CalcInput label="Correlation" value={pos.correlation.toString()} onChange={(v) => updatePosition(pos.id, "correlation", Number(v))} min={-1} max={1} step={0.1} />
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <ResultCard title="Total Portfolio Risk" value={`$${result.totalRisk.toLocaleString()}`} description="Adjusted for correlation" color="red" />
            <ResultCard title="Combined Exposure" value={`$${result.combinedExposure.toLocaleString()}`} description="Total notional value" color="blue" />
            <ResultCard title="Risk Breakdown" value={`${result.riskBreakdown.length} positions`} description="Active positions" color="yellow" />
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
            <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-2">Position Breakdown</p>
            <div className="space-y-1.5">
              {result.riskBreakdown.map((rb, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300">{rb.pair}</span>
                  <span className="text-zinc-400">${rb.risk.toLocaleString()} ({rb.percent}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Total Risk = Σ(Position Risk) × (1 + Correlation Factor)</pre>
      </div>
    </div>
  );
}
