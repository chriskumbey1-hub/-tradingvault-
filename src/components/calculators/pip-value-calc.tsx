"use client";

import * as React from "react";
import { CalcInput, ResultCard } from "./calculator-layout";
import { calculatePipValue } from "@/lib/calculators/pip-value";

export function PipValueCalc() {
  const [lotSize, setLotSize] = React.useState("1");
  const [pipSize, setPipSize] = React.useState("0.0001");

  const result = React.useMemo(
    () => calculatePipValue(Number(lotSize), Number(pipSize)),
    [lotSize, pipSize]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Pip Value Calculator</h2>
        <p className="text-sm text-zinc-400">Determine the dollar value of a single pip movement</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CalcInput label="Lot Size" value={lotSize} onChange={setLotSize} min={0.01} step={0.01} />
        <CalcInput label="Pip Size" value={pipSize} onChange={setPipSize} step={0.0001} />
      </div>
      {result && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard title="Pip Value" value={`$${result.pipValue}`} description="Value per pip" color="blue" />
          <ResultCard title="Dollar Value Per Pip" value={`$${result.dollarValuePerPip}`} description="USD equivalent" color="green" />
        </div>
      )}
      <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 mb-1">Formula</p>
        <pre className="text-xs text-zinc-300 font-mono">Pip Value = Lot Size × Contract Size × Pip Size</pre>
      </div>
    </div>
  );
}
