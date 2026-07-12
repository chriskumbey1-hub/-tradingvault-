"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateRiskReward } from "@/lib/calculators/risk-reward";

export function RiskRewardCalc() {
  const [entry, setEntry] = React.useState("1.1000");
  const [stopLoss, setStopLoss] = React.useState("1.0950");
  const [takeProfit, setTakeProfit] = React.useState("1.1100");
  const [pipSize, setPipSize] = React.useState("0.0001");

  const result = React.useMemo(
    () => calculateRiskReward(Number(entry), Number(stopLoss), Number(takeProfit), Number(pipSize)),
    [entry, stopLoss, takeProfit, pipSize]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Risk / Reward Calculator</h2>
        <p className="text-sm text-zinc-400">Calculate the risk-to-reward ratio for any trade setup</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Entry Price" value={entry} onChange={setEntry} placeholder="1.1000" step={0.0001} />
        <CalcInput label="Stop Loss" value={stopLoss} onChange={setStopLoss} placeholder="1.0950" step={0.0001} />
        <CalcInput label="Take Profit" value={takeProfit} onChange={setTakeProfit} placeholder="1.1100" step={0.0001} />
        <CalcInput label="Pip Size" value={pipSize} onChange={setPipSize} placeholder="0.0001" step={0.0001} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard title="Risk" value={`${result.riskPips} pips`} description="Distance to stop loss" color="red" />
          <ResultCard title="Reward" value={`${result.rewardPips} pips`} description="Distance to target" color="green" />
          <ResultCard title="Risk:Reward" value={result.ratio} description="Optimal if ≥ 1:2" color="blue" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Risk = (Entry − Stop) ÷ Pip Size{"\n"}Reward = (Target − Entry) ÷ Pip Size{"\n"}Ratio = Reward ÷ Risk</pre>
      </div>
    </div>
  );
}
