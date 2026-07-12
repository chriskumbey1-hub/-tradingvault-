"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { runMonteCarloSimulation, MonteCarloResult } from "@/lib/calculators/monte-carlo";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export function MonteCarloCalc() {
  const [balance, setBalance] = React.useState("10000");
  const [winRate, setWinRate] = React.useState("55");
  const [risk, setRisk] = React.useState("2");
  const [rr, setRr] = React.useState("2");
  const [trades, setTrades] = React.useState("200");
  const [sims, setSims] = React.useState("1000");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<MonteCarloResult | null>(null);

  const runSimulation = () => {
    setRunning(true);
    setTimeout(() => {
      const r = runMonteCarloSimulation(
        Number(balance), Number(winRate), Number(risk), Number(rr),
        Number(trades), Math.min(Number(sims), 5000)
      );
      setResult(r);
      setRunning(false);
    }, 50);
  };

  const chartData = result?.averageEquityCurve.map((v, i) => ({ trade: i, equity: v })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Monte Carlo Simulator</h2>
        <p className="text-sm text-zinc-400">Run thousands of simulations to forecast your trading outcomes</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CalcInput label="Starting Balance" value={balance} onChange={setBalance} suffix="USD" />
        <CalcInput label="Win Rate" value={winRate} onChange={setWinRate} suffix="%" min={1} max={99} step={0.1} />
        <CalcInput label="Risk %" value={risk} onChange={setRisk} suffix="%" min={0.1} max={100} step={0.1} />
        <CalcInput label="Reward Ratio" value={rr} onChange={setRr} min={0.1} step={0.1} />
        <CalcInput label="Number of Trades" value={trades} onChange={setTrades} min={10} max={10000} />
        <CalcInput label="Simulations" value={sims} onChange={setSims} min={100} max={5000} />
      </div>

      <Button onClick={runSimulation} disabled={running} className="gap-2">
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        {running ? "Running..." : "Run Simulation"}
      </Button>

      {result && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard title="Best Case" value={`$${result.bestCase.toLocaleString()}`} description="Best outcome" color="green" />
            <ResultCard title="Worst Case" value={`$${result.worstCase.toLocaleString()}`} description="Worst outcome" color="red" />
            <ResultCard title="Expected Return" value={`$${result.expectedReturn.toLocaleString()}`} description="Average P&L" color="blue" />
            <ResultCard title="Max Drawdown" value={`${result.maximumDrawdown}%`} description="Worst peak-to-trough" color="red" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ResultCard title="Probability of Profit" value={`${result.probabilityOfProfit}%`} description="Chance of being profitable" color="green" />
            <ResultCard title="Probability of Drawdown > 10%" value={`${result.probabilityOfDrawdown}%`} description="Risk of significant drawdown" color="yellow" />
          </div>

          {chartData.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Average Equity Curve ({Number(sims).toLocaleString()} simulations)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="trade" tick={{ fontSize: 10, fill: "#71717a" }} label={{ value: "Trade #", position: "bottom", fontSize: 10, fill: "#71717a" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }} formatter={(value: number) => [`$${value.toLocaleString()}`, "Equity"]} />
                  <Area type="monotone" dataKey="equity" stroke="#3b82f6" fill="url(#mcGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Simulates N trades using random outcomes based on win rate and risk/reward ratio.{"\n"}Each trade: random(Win) → +Balance×Risk×RR | random(Loss) → −Balance×Risk</pre>
      </div>
    </div>
  );
}
