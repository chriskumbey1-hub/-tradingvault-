export interface DrawdownResult {
  maxDrawdown: number;
  percentageDrawdown: number;
  remainingCapital: number;
  recoveryRequired: number;
}

export function calculateDrawdown(
  startingBalance: number,
  currentBalance: number
): DrawdownResult | null {
  if (!startingBalance || !currentBalance || startingBalance <= 0) return null;

  const maxDrawdown = startingBalance - currentBalance;
  const percentageDrawdown = (maxDrawdown / startingBalance) * 100;
  const remainingCapital = currentBalance;
  const recoveryRequired = percentageDrawdown > 0
    ? (maxDrawdown / currentBalance) * 100
    : 0;

  return {
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    percentageDrawdown: Math.round(percentageDrawdown * 100) / 100,
    remainingCapital: Math.round(remainingCapital * 100) / 100,
    recoveryRequired: Math.round(recoveryRequired * 100) / 100,
  };
}
