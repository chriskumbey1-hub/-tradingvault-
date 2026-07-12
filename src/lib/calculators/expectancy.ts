export interface ExpectancyResult {
  expectancy: number;
  positiveExpectancy: number;
  negativeExpectancy: number;
  profitExpectancy: number;
}

export function calculateExpectancy(
  winRate: number,
  averageWin: number,
  averageLoss: number
): ExpectancyResult | null {
  if (winRate === null || averageWin === null || averageLoss === null) return null;
  if (winRate < 0 || winRate > 100) return null;
  if (averageLoss === 0) return null;

  const wr = winRate / 100;
  const lr = 1 - wr;
  const expectancy = (wr * averageWin) - (lr * Math.abs(averageLoss));
  const positiveExpectancy = wr * averageWin;
  const negativeExpectancy = lr * Math.abs(averageLoss);
  const profitExpectancy = expectancy;

  return {
    expectancy: Math.round(expectancy * 100) / 100,
    positiveExpectancy: Math.round(positiveExpectancy * 100) / 100,
    negativeExpectancy: Math.round(negativeExpectancy * 100) / 100,
    profitExpectancy: Math.round(profitExpectancy * 100) / 100,
  };
}
