"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateDrawdown } from "@/lib/calculators/drawdown";

export function DrawdownCalc() {
  const [starting, setStarting] = React.useState("10000");
  const [current, setCurrent] = React.useState("8500");

  const result = React.useMemo(
    () => calculateDrawdown(Number(starting), Number(current)),
    [starting, current]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Drawdown Calculator</h2>
        <p className="text-sm text-zinc-400">Measure your maximum drawdown and recovery requirements</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Starting Balance" value={starting} onChange={setStarting} suffix="USD" />
        <CalcInput label="Current Balance" value={current} onChange={setCurrent} suffix="USD" />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard title="Max Drawdown" value={`$${result.maxDrawdown.toLocaleString()}`} description="Amount lost from peak" color="red" />
          <ResultCard title="Drawdown %" value={`${result.percentageDrawdown}%`} description="Percentage decline" color="red" />
          <ResultCard title="Remaining Capital" value={`$${result.remainingCapital.toLocaleString()}`} description="Current balance" color="green" />
          <ResultCard title="Recovery Required" value={`${result.recoveryRequired}%`} description="Gain needed to recover" color="yellow" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Drawdown = (Peak − Current) ÷ Peak × 100{"\n"}Recovery = Drawdown ÷ Current × 100</pre>
      </div>
    </div>
  );
}
