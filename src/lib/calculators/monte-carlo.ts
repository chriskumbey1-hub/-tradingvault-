export interface MonteCarloResult {
  bestCase: number;
  worstCase: number;
  averageEquityCurve: number[];
  probabilityOfProfit: number;
  probabilityOfDrawdown: number;
  maximumDrawdown: number;
  expectedReturn: number;
}

export function runMonteCarloSimulation(
  startingBalance: number,
  winRate: number,
  riskPercent: number,
  rewardRatio: number,
  numberOfTrades: number,
  simulationCount: number
): MonteCarloResult {
  const wr = winRate / 100;
  const risk = riskPercent / 100;
  const results: number[][] = [];
  const finalBalances: number[] = [];
  const maxDrawdowns: number[] = [];

  for (let sim = 0; sim < simulationCount; sim++) {
    let balance = startingBalance;
    const curve: number[] = [balance];
    let peak = balance;
    let maxDD = 0;

    for (let trade = 0; trade < numberOfTrades; trade++) {
      const isWin = Math.random() < wr;
      const riskAmount = balance * risk;
      const change = isWin ? riskAmount * rewardRatio : -riskAmount;
      balance = Math.max(0, balance + change);
      curve.push(balance);

      if (balance > peak) peak = balance;
      const dd = (peak - balance) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    results.push(curve);
    finalBalances.push(balance);
    maxDrawdowns.push(maxDD);
  }

  const avgCurve: number[] = [];
  for (let i = 0; i <= numberOfTrades; i++) {
    let sum = 0;
    for (let sim = 0; sim < simulationCount; sim++) {
      sum += results[sim][i];
    }
    avgCurve.push(Math.round((sum / simulationCount) * 100) / 100);
  }

  const profits = finalBalances.filter((b) => b > startingBalance);
  const drawdowns = maxDrawdowns.filter((d) => d > 0.1);

  return {
    bestCase: Math.round(Math.max(...finalBalances) * 100) / 100,
    worstCase: Math.round(Math.min(...finalBalances) * 100) / 100,
    averageEquityCurve: avgCurve,
    probabilityOfProfit: Math.round((profits.length / simulationCount) * 10000) / 100,
    probabilityOfDrawdown: Math.round((drawdowns.length / simulationCount) * 10000) / 100,
    maximumDrawdown: Math.round(Math.max(...maxDrawdowns) * 10000) / 100,
    expectedReturn: Math.round(
      (finalBalances.reduce((a, b) => a + b, 0) / simulationCount - startingBalance) * 100
    ) / 100,
  };
}
