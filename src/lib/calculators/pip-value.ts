export interface PipValueResult {
  pipValue: number;
  dollarValuePerPip: number;
}

export function calculatePipValue(
  lotSize: number,
  pipSize: number = 0.0001,
  contractSize: number = 100000
): PipValueResult | null {
  if (!lotSize || lotSize <= 0 || !pipSize || pipSize <= 0) return null;

  const pipValue = lotSize * contractSize * pipSize;
  const dollarValuePerPip = pipValue;

  return {
    pipValue: Math.round(pipValue * 100) / 100,
    dollarValuePerPip: Math.round(dollarValuePerPip * 100) / 100,
  };
}
