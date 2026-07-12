export interface ProfitResult {
  profitLoss: number;
  pips: number;
  returnPercent: number;
  currencyValue: number;
}

export function calculateProfit(
  direction: "buy" | "sell",
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
  pipSize: number = 0.0001,
  pipValue: number = 10
): ProfitResult | null {
  if (!entryPrice || !exitPrice || !lotSize || !pipSize || pipSize === 0) return null;
  if (entryPrice <= 0 || exitPrice <= 0 || lotSize <= 0) return null;

  const priceDiff = direction === "buy"
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;

  const pips = priceDiff / pipSize;
  const profitLoss = pips * pipValue * lotSize;
  const returnPercent = (profitLoss / (lotSize * 100000 * entryPrice)) * 100;
  const currencyValue = profitLoss;

  return {
    profitLoss: Math.round(profitLoss * 100) / 100,
    pips: Math.round(pips * 100) / 100,
    returnPercent: Math.round(returnPercent * 100) / 100,
    currencyValue: Math.round(currencyValue * 100) / 100,
  };
}
