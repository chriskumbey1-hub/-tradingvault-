"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateKelly } from "@/lib/calculators/kelly";

export function KellyCalc() {
  const [winRate, setWinRate] = React.useState("55");
  const [rr, setRr] = React.useState("2");

  const result = React.useMemo(
    () => calculateKelly(Number(winRate), Number(rr)),
    [winRate, rr]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Kelly Criterion Calculator</h2>
        <p className="text-sm text-zinc-400">Determine the mathematically optimal position size</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Win Rate" value={winRate} onChange={setWinRate} suffix="%" min={1} max={99} step={0.1} />
        <CalcInput label="Reward:Risk Ratio" value={rr} onChange={setRr} min={0.1} step={0.1} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard title="Kelly Percentage" value={`${result.kellyPercentage}%`} description="Optimal risk per trade" color="blue" />
          <ResultCard title="Suggested Risk" value={`${result.suggestedRisk}%`} description="Half Kelly (recommended)" color="green" />
          <ResultCard title="Aggressive Risk" value={`${result.aggressiveRisk}%`} description="75% Kelly" color="yellow" />
          <ResultCard title="Conservative Risk" value={`${result.conservativeRisk}%`} description="25% Kelly" color="purple" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Kelly % = Win% − ((1 − Win%) ÷ Reward:Risk)</pre>
      </div>
    </div>
  );
}
