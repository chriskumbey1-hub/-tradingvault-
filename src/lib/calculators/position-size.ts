export interface PositionSizeResult {
  riskAmount: number;
  lotSize: number;
  units: number;
  miniLots: number;
  microLots: number;
  positionValue: number;
  marginRequired: number;
}

export function calculatePositionSize(
  accountBalance: number,
  riskPercent: number,
  stopLossPips: number,
  pipValue: number = 10,
  leverage: number = 100
): PositionSizeResult | null {
  if (!accountBalance || !riskPercent || !stopLossPips || stopLossPips === 0) return null;
  if (accountBalance <= 0 || riskPercent <= 0 || riskPercent > 100) return null;

  const riskAmount = accountBalance * (riskPercent / 100);
  const lossPerLot = stopLossPips * pipValue;
  const lotSize = lossPerLot > 0 ? riskAmount / lossPerLot : 0;
  const units = lotSize * 100000;
  const miniLots = lotSize * 10;
  const microLots = lotSize * 100;
  const positionValue = units;
  const marginRequired = positionValue / leverage;

  return {
    riskAmount: Math.round(riskAmount * 100) / 100,
    lotSize: Math.round(lotSize * 100) / 100,
    units: Math.round(units),
    miniLots: Math.round(miniLots * 100) / 100,
    microLots: Math.round(microLots * 100) / 100,
    positionValue: Math.round(positionValue * 100) / 100,
    marginRequired: Math.round(marginRequired * 100) / 100,
  };
}
