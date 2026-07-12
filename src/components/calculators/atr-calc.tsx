"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateATR } from "@/lib/calculators/atr";

export function ATRCalc() {
  const [atr, setAtr] = React.useState("0.0050");
  const [risk, setRisk] = React.useState("2");
  const [balance, setBalance] = React.useState("10000");
  const [multiplier, setMultiplier] = React.useState("1.5");

  const result = React.useMemo(
    () => calculateATR(Number(atr), Number(risk), Number(balance), Number(multiplier)),
    [atr, risk, balance, multiplier]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">ATR Position Size Calculator</h2>
        <p className="text-sm text-zinc-400">Use Average True Range for volatility-based position sizing</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="ATR Value" value={atr} onChange={setAtr} step={0.0001} />
        <CalcInput label="Risk %" value={risk} onChange={setRisk} suffix="%" min={0.01} max={100} step={0.1} />
        <CalcInput label="Account Balance" value={balance} onChange={setBalance} suffix="USD" />
        <CalcInput label="ATR Multiplier" value={multiplier} onChange={setMultiplier} min={0.1} step={0.1} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard title="Suggested Stop Loss" value={result.suggestedStopLoss.toString()} description="ATR × Multiplier" color="red" />
          <ResultCard title="Lot Size" value={result.lotSize.toString()} description="Recommended size" color="blue" />
          <ResultCard title="Risk Amount" value={`$${result.riskAmount.toLocaleString()}`} description="Maximum risk" color="yellow" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Stop Loss = ATR × Multiplier{"\n"}Lot Size = Risk Amount ÷ (Stop Pips × Pip Value)</pre>
      </div>
    </div>
  );
}
