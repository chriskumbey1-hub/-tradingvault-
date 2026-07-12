"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateMargin } from "@/lib/calculators/margin";

export function MarginCalc() {
  const [lotSize, setLotSize] = React.useState("1");
  const [leverage, setLeverage] = React.useState("100");
  const [price, setPrice] = React.useState("1.1000");

  const result = React.useMemo(
    () => calculateMargin(Number(lotSize), Number(leverage), Number(price)),
    [lotSize, leverage, price]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Margin Calculator</h2>
        <p className="text-sm text-zinc-400">Calculate margin requirements for your trades</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <CalcInput label="Lot Size" value={lotSize} onChange={setLotSize} min={0.01} step={0.01} />
        <CalcInput label="Leverage" value={leverage} onChange={setLeverage} min={1} />
        <CalcInput label="Price" value={price} onChange={setPrice} step={0.0001} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard title="Required Margin" value={`$${result.requiredMargin.toLocaleString()}`} description="Capital needed" color="blue" />
          <ResultCard title="Margin %" value={`${result.marginPercentage}%`} description="Of notional value" color="yellow" />
          <ResultCard title="Buying Power Used" value={`${result.buyingPowerUsed}%`} description="Utilization" color="purple" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Margin = (Lot Size × Contract Size × Price) ÷ Leverage</pre>
      </div>
    </div>
  );
}
