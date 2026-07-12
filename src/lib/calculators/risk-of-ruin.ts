export interface RiskOfRuinResult {
  riskOfRuin: number;
  probabilityOfFailure: number;
  safetyRating: string;
}

export function calculateRiskOfRuin(
  winRate: number,
  riskPerTrade: number,
  rewardRatio: number,
  accountSize: number
): RiskOfRuinResult | null {
  if (winRate === null || riskPerTrade === null || rewardRatio === null || accountSize === null) return null;
  if (winRate <= 0 || winRate >= 100 || riskPerTrade <= 0 || rewardRatio <= 0 || accountSize <= 0) return null;

  const wr = winRate / 100;
  const rr = rewardRatio;
  const risk = riskPerTrade / 100;

  const kellyOptimal = wr - ((1 - wr) / rr);
  const halfKelly = kellyOptimal / 2;

  const edge = (wr * rr) - (1 - wr);
  const variance = (wr * rr * rr) + ((1 - wr) * 1) - (edge * edge);
  const standardDev = Math.sqrt(variance);

  const riskOfRuin = Math.max(0, Math.min(100,
    Math.exp(-2 * edge * accountSize / (risk * risk * standardDev * standardDev * 100)) * 100
  ));

  const probabilityOfFailure = riskOfRuin;

  let safetyRating: string;
  if (riskOfRuin < 1) safetyRating = "Very Safe";
  else if (riskOfRuin < 5) safetyRating = "Safe";
  else if (riskOfRuin < 15) safetyRating = "Moderate";
  else if (riskOfRuin < 30) safetyRating = "Risky";
  else safetyRating = "Very Risky";

  return {
    riskOfRuin: Math.round(riskOfRuin * 100) / 100,
    probabilityOfFailure: Math.round(probabilityOfFailure * 100) / 100,
    safetyRating,
  };
}
