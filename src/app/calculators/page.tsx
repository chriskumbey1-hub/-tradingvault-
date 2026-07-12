"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CalculatorLayout } from "@/components/calculators/calculator-layout";
import { RiskRewardCalc } from "@/components/calculators/risk-reward-calc";
import { PositionSizeCalc } from "@/components/calculators/position-size-calc";
import { ProfitCalc } from "@/components/calculators/profit-calc";
import { PipValueCalc } from "@/components/calculators/pip-value-calc";
import { MarginCalc } from "@/components/calculators/margin-calc";
import { DrawdownCalc } from "@/components/calculators/drawdown-calc";
import { ExpectancyCalc } from "@/components/calculators/expectancy-calc";
import { WinRateCalc } from "@/components/calculators/win-rate-calc";
import { RiskOfRuinCalc } from "@/components/calculators/risk-of-ruin-calc";
import { KellyCalc } from "@/components/calculators/kelly-calc";
import { ATRCalc } from "@/components/calculators/atr-calc";
import { PortfolioCalc } from "@/components/calculators/portfolio-calc";
import { MonteCarloCalc } from "@/components/calculators/monte-carlo-calc";

const CALC_COMPONENTS: Record<string, React.FC> = {
  "risk-reward": RiskRewardCalc,
  "position-size": PositionSizeCalc,
  "profit": ProfitCalc,
  "pip-value": PipValueCalc,
  "margin": MarginCalc,
  "drawdown": DrawdownCalc,
  "expectancy": ExpectancyCalc,
  "win-rate": WinRateCalc,
  "risk-of-ruin": RiskOfRuinCalc,
  "kelly": KellyCalc,
  "atr": ATRCalc,
  "portfolio": PortfolioCalc,
  "monte-carlo": MonteCarloCalc,
};

export default function CalculatorsPage() {
  const [activeCalc, setActiveCalc] = React.useState("risk-reward");

  const ActiveComponent = CALC_COMPONENTS[activeCalc];

  return (
    <DashboardLayout>
      <CalculatorLayout activeId={activeCalc} onSelect={setActiveCalc}>
        {ActiveComponent && <ActiveComponent />}
      </CalculatorLayout>
    </DashboardLayout>
  );
}
