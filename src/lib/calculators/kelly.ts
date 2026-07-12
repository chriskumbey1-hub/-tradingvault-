export interface KellyResult {
  kellyPercentage: number;
  suggestedRisk: number;
  aggressiveRisk: number;
  conservativeRisk: number;
}

export function calculateKelly(
  winRate: number,
  rewardRiskRatio: number
): KellyResult | null {
  if (winRate === null || rewardRiskRatio === null) return null;
  if (winRate <= 0 || winRate >= 100 || rewardRiskRatio <= 0) return null;

  const wr = winRate / 100;
  const rr = rewardRiskRatio;

  const kelly = wr - ((1 - wr) / rr);
  const kellyPercentage = Math.max(0, kelly) * 100;
  const suggestedRisk = kellyPercentage * 0.5;
  const aggressiveRisk = kellyPercentage * 0.75;
  const conservativeRisk = kellyPercentage * 0.25;

  return {
    kellyPercentage: Math.round(kellyPercentage * 100) / 100,
    suggestedRisk: Math.round(suggestedRisk * 100) / 100,
    aggressiveRisk: Math.round(aggressiveRisk * 100) / 100,
    conservativeRisk: Math.round(conservativeRisk * 100) / 100,
  };
}
