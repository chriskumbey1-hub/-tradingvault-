"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculateRiskOfRuin } from "@/lib/calculators/risk-of-ruin";

export function RiskOfRuinCalc() {
  const [winRate, setWinRate] = React.useState("55");
  const [risk, setRisk] = React.useState("2");
  const [rr, setRr] = React.useState("2");
  const [balance, setBalance] = React.useState("10000");

  const result = React.useMemo(
    () => calculateRiskOfRuin(Number(winRate), Number(risk), Number(rr), Number(balance)),
    [winRate, risk, rr, balance]
  );

  const gaugeAngle = result ? Math.min(result.riskOfRuin / 50 * 180, 180) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Risk of Ruin Calculator</h2>
        <p className="text-sm text-zinc-400">Estimate the probability of losing your entire account</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Win Rate" value={winRate} onChange={setWinRate} suffix="%" min={1} max={99} step={0.1} />
        <CalcInput label="Risk Per Trade" value={risk} onChange={setRisk} suffix="%" min={0.1} max={100} step={0.1} />
        <CalcInput label="Reward Ratio" value={rr} onChange={setRr} min={0.1} step={0.1} />
        <CalcInput label="Account Size" value={balance} onChange={setBalance} suffix="USD" />
      </div>
      {result && (
        <>
          <div className="flex justify-center">
            <div className="relative w-48 h-28">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round" />
                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${gaugeAngle / 180 * 251.3} 251.3`} />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="text-2xl font-bold text-zinc-100">{result.riskOfRuin}%</p>
                <p className="text-xs text-zinc-500">Risk of Ruin</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultCard title="Risk of Ruin" value={`${result.riskOfRuin}%`} description="Probability of total loss" color={result.riskOfRuin < 5 ? "green" : result.riskOfRuin < 15 ? "yellow" : "red"} />
            <ResultCard title="Safety Rating" value={result.safetyRating} description="Account safety level" color={result.riskOfRuin < 5 ? "green" : result.riskOfRuin < 15 ? "yellow" : "red"} />
          </div>
        </>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Uses Kelly criterion and statistical modeling{"\n"}Risk of Ruin = e^(-2 × Edge × Capital / Variance)</pre>
      </div>
    </div>
  );
}
