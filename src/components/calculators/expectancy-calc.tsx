"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateExpectancy } from "@/lib/calculators/expectancy";

export function ExpectancyCalc() {
  const [winRate, setWinRate] = React.useState("55");
  const [avgWin, setAvgWin] = React.useState("200");
  const [avgLoss, setAvgLoss] = React.useState("100");

  const result = React.useMemo(
    () => calculateExpectancy(Number(winRate), Number(avgWin), Number(avgLoss)),
    [winRate, avgWin, avgLoss]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Expectancy Calculator</h2>
        <p className="text-sm text-zinc-400">Calculate your expected profit or loss per trade</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <CalcInput label="Win Rate" value={winRate} onChange={setWinRate} suffix="%" min={0} max={100} step={0.1} />
        <CalcInput label="Average Win" value={avgWin} onChange={setAvgWin} suffix="USD" />
        <CalcInput label="Average Loss" value={avgLoss} onChange={setAvgLoss} suffix="USD" />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard title="Trade Expectancy" value={`${result.expectancy >= 0 ? "+" : ""}$${result.expectancy}`} description={result.expectancy >= 0 ? "Profitable system" : "Losing system"} color={result.expectancy >= 0 ? "green" : "red"} />
          <ResultCard title="Per Trade Value" value={`${result.positiveExpectancy >= result.negativeExpectancy ? "+" : ""}$${(result.positiveExpectancy - result.negativeExpectancy).toFixed(2)}`} description="Net expected value" color="blue" />
          <ResultCard title="Positive Component" value={`+$${result.positiveExpectancy}`} description="From winning trades" color="green" />
          <ResultCard title="Negative Component" value={`-$${result.negativeExpectancy}`} description="From losing trades" color="red" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Expectancy = (Win% × Avg Win) − (Loss% × Avg Loss)</pre>
      </div>
    </div>
  );
}
