"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateWinRate } from "@/lib/calculators/win-rate";

export function WinRateCalc() {
  const [wins, setWins] = React.useState("55");
  const [losses, setLosses] = React.useState("45");

  const result = React.useMemo(
    () => calculateWinRate(Number(wins), Number(losses)),
    [wins, losses]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Win Rate Calculator</h2>
        <p className="text-sm text-zinc-400">Calculate your win rate and loss rate from trading results</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Winning Trades" value={wins} onChange={setWins} min={0} />
        <CalcInput label="Losing Trades" value={losses} onChange={setLosses} min={0} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard title="Total Trades" value={result.totalTrades.toString()} description="Complete trades" color="blue" />
          <ResultCard title="Win Rate" value={`${result.winRate}%`} description="Percentage of wins" color="green" />
          <ResultCard title="Loss Rate" value={`${result.lossRate}%`} description="Percentage of losses" color="red" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Win Rate = Winning Trades ÷ Total Trades × 100</pre>
      </div>
    </div>
  );
}
