"use client";

import * as React from "react";
import { CalcInput, CalcSelect, ResultCard } from "./calculator-layout";
import { calculateProfit } from "@/lib/calculators/profit";

export function ProfitCalc() {
  const [direction, setDirection] = React.useState("buy");
  const [entry, setEntry] = React.useState("1.1000");
  const [exit, setExit] = React.useState("1.1050");
  const [lotSize, setLotSize] = React.useState("1");
  const [pipSize, setPipSize] = React.useState("0.0001");

  const result = React.useMemo(
    () => calculateProfit(direction as "buy" | "sell", Number(entry), Number(exit), Number(lotSize), Number(pipSize)),
    [direction, entry, exit, lotSize, pipSize]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Profit Calculator</h2>
        <p className="text-sm text-zinc-400">Calculate potential profit or loss for any trade</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcSelect label="Direction" value={direction} onChange={setDirection} options={[{ value: "buy", label: "Buy (Long)" }, { value: "sell", label: "Sell (Short)" }]} />
        <CalcInput label="Entry Price" value={entry} onChange={setEntry} step={0.0001} />
        <CalcInput label="Exit Price" value={exit} onChange={setExit} step={0.0001} />
        <CalcInput label="Lot Size" value={lotSize} onChange={setLotSize} min={0.01} step={0.01} />
        <CalcInput label="Pip Size" value={pipSize} onChange={setPipSize} step={0.0001} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ResultCard title="Profit/Loss" value={`${result.profitLoss >= 0 ? "+" : ""}$${result.profitLoss.toLocaleString()}`} description={result.profitLoss >= 0 ? "Profitable trade" : "Losing trade"} color={result.profitLoss >= 0 ? "green" : "red"} />
          <ResultCard title="Pips" value={result.pips.toString()} description="Total pip movement" color="blue" />
          <ResultCard title="Return %" value={`${result.returnPercent}%`} description="Return on margin" color="yellow" />
          <ResultCard title="Value" value={`${result.currencyValue >= 0 ? "+" : ""}$${result.currencyValue.toLocaleString()}`} description="Currency equivalent" color="purple" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Profit = Pips × Pip Value × Lot Size{"\n"}Pips = (Exit − Entry) ÷ Pip Size (for buy)</pre>
      </div>
    </div>
  );
}
