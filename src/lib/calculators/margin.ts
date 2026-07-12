export interface MarginResult {
  requiredMargin: number;
  marginPercentage: number;
  buyingPowerUsed: number;
}

export function calculateMargin(
  lotSize: number,
  leverage: number,
  price: number,
  contractSize: number = 100000
): MarginResult | null {
  if (!lotSize || !leverage || !price || leverage <= 0 || lotSize <= 0 || price <= 0) return null;

  const notionalValue = lotSize * contractSize * price;
  const requiredMargin = notionalValue / leverage;
  const marginPercentage = (1 / leverage) * 100;
  const buyingPowerUsed = (requiredMargin / notionalValue) * 100;

  return {
    requiredMargin: Math.round(requiredMargin * 100) / 100,
    marginPercentage: Math.round(marginPercentage * 100) / 100,
    buyingPowerUsed: Math.round(buyingPowerUsed * 100) / 100,
  };
}
