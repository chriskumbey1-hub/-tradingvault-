"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculatePositionSize } from "@/lib/calculators/position-size";

export function PositionSizeCalc() {
  const [balance, setBalance] = React.useState("10000");
  const [risk, setRisk] = React.useState("2");
  const [slPips, setSlPips] = React.useState("50");
  const [leverage, setLeverage] = React.useState("100");

  const result = React.useMemo(
    () => calculatePositionSize(Number(balance), Number(risk), Number(slPips), 10, Number(leverage)),
    [balance, risk, slPips, leverage]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Position Size Calculator</h2>
        <p className="text-sm text-zinc-400">Calculate the optimal lot size based on your risk tolerance</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Account Balance" value={balance} onChange={setBalance} placeholder="10000" suffix="USD" />
        <CalcInput label="Risk Percentage" value={risk} onChange={setRisk} placeholder="2" suffix="%" min={0.01} max={100} step={0.1} />
        <CalcInput label="Stop Loss (Pips)" value={slPips} onChange={setSlPips} placeholder="50" min={1} />
        <CalcInput label="Leverage" value={leverage} onChange={setLeverage} placeholder="100" min={1} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ResultCard title="Risk Amount" value={`$${result.riskAmount.toLocaleString()}`} description="Maximum loss on this trade" color="red" />
          <ResultCard title="Lot Size" value={result.lotSize.toString()} description="Recommended position size" color="blue" />
          <ResultCard title="Units" value={result.units.toLocaleString()} description="Number of units" color="green" />
          <ResultCard title="Mini Lots" value={result.miniLots.toString()} description="In mini lots (0.1)" color="purple" />
          <ResultCard title="Micro Lots" value={result.microLots.toString()} description="In micro lots (0.01)" color="yellow" />
          <ResultCard title="Margin Required" value={`$${result.marginRequired.toLocaleString()}`} description="Based on leverage" color="blue" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Risk Amount = Balance × (Risk% ÷ 100){"\n"}Lot Size = Risk Amount ÷ (Stop Pips × Pip Value)</pre>
      </div>
    </div>
  );
}
