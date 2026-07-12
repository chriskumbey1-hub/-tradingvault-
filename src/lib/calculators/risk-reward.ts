export interface RiskRewardResult {
  riskPips: number;
  rewardPips: number;
  ratio: string;
  riskReward: number;
}

export function calculateRiskReward(
  entry: number,
  stopLoss: number,
  takeProfit: number,
  pipSize: number
): RiskRewardResult | null {
  if (!entry || !stopLoss || !takeProfit || !pipSize || pipSize === 0) return null;
  if (entry <= 0 || stopLoss <= 0 || takeProfit <= 0) return null;

  const riskPips = Math.abs(entry - stopLoss) / pipSize;
  const rewardPips = Math.abs(takeProfit - entry) / pipSize;
  const riskReward = rewardPips / riskPips;

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const r = Math.round(riskPips);
  const rw = Math.round(rewardPips);
  const g = gcd(r, rw);

  return {
    riskPips: Math.round(riskPips * 100) / 100,
    rewardPips: Math.round(rewardPips * 100) / 100,
    ratio: `1 : ${(riskReward).toFixed(2)}`,
    riskReward: Math.round(riskReward * 100) / 100,
  };
}
