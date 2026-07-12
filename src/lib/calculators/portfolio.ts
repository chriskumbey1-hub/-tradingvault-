export interface PortfolioPosition {
  id: string;
  pair: string;
  lotSize: number;
  riskPercent: number;
  correlation: number;
}

export interface PortfolioResult {
  totalRisk: number;
  combinedExposure: number;
  currencyExposure: number;
  riskBreakdown: { pair: string; risk: number; percent: number }[];
}

export function calculatePortfolioRisk(
  positions: PortfolioPosition[],
  accountBalance: number
): PortfolioResult | null {
  if (!positions.length || !accountBalance || accountBalance <= 0) return null;

  let totalRisk = 0;
  let combinedExposure = 0;
  const riskBreakdown: { pair: string; risk: number; percent: number }[] = [];

  positions.forEach((pos) => {
    const risk = accountBalance * (pos.riskPercent / 100) * pos.lotSize;
    const exposure = pos.lotSize * 100000;
    totalRisk += risk;
    combinedExposure += exposure;
    riskBreakdown.push({
      pair: pos.pair,
      risk: Math.round(risk * 100) / 100,
      percent: pos.riskPercent,
    });
  });

  const maxCorrelation = Math.max(...positions.map((p) => Math.abs(p.correlation)));
  const adjustedRisk = totalRisk * (1 + maxCorrelation * 0.2);

  return {
    totalRisk: Math.round(adjustedRisk * 100) / 100,
    combinedExposure: Math.round(combinedExposure * 100) / 100,
    currencyExposure: Math.round(combinedExposure * 100) / 100,
    riskBreakdown,
  };
}
