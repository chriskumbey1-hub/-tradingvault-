export interface ATRResult {
  suggestedStopLoss: number;
  lotSize: number;
  riskAmount: number;
}

export function calculateATR(
  atr: number,
  riskPercent: number,
  accountBalance: number,
  atrMultiplier: number = 1.5,
  pipSize: number = 0.0001,
  pipValue: number = 10
): ATRResult | null {
  if (!atr || !riskPercent || !accountBalance || atr <= 0 || riskPercent <= 0 || accountBalance <= 0) return null;

  const suggestedStopLoss = atr * atrMultiplier;
  const stopLossPips = suggestedStopLoss / pipSize;
  const riskAmount = accountBalance * (riskPercent / 100);
  const lossPerLot = stopLossPips * pipValue;
  const lotSize = lossPerLot > 0 ? riskAmount / lossPerLot : 0;

  return {
    suggestedStopLoss: Math.round(suggestedStopLoss * 100000) / 100000,
    lotSize: Math.round(lotSize * 100) / 100,
    riskAmount: Math.round(riskAmount * 100) / 100,
  };
}
