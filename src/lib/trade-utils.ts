export const MARKET_MULTIPLIERS: Record<string, number> = {
  forex: 100000,
  indices: 100,
  commodities: 100,
  stocks: 1,
  crypto: 1,
};

export function calculatePnL(
  direction: string,
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
  marketType: string
): number {
  const multiplier = MARKET_MULTIPLIERS[marketType] || 1;
  const priceDiff = direction === "long" ? exitPrice - entryPrice : entryPrice - exitPrice;
  return priceDiff * lotSize * multiplier;
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
