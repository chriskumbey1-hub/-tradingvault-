export interface WinRateResult {
  totalTrades: number;
  winRate: number;
  lossRate: number;
}

export function calculateWinRate(
  winningTrades: number,
  losingTrades: number
): WinRateResult | null {
  if (winningTrades === null || losingTrades === null) return null;
  if (winningTrades < 0 || losingTrades < 0) return null;

  const totalTrades = winningTrades + losingTrades;
  if (totalTrades === 0) return null;

  const winRate = (winningTrades / totalTrades) * 100;
  const lossRate = (losingTrades / totalTrades) * 100;

  return {
    totalTrades,
    winRate: Math.round(winRate * 100) / 100,
    lossRate: Math.round(lossRate * 100) / 100,
  };
}
