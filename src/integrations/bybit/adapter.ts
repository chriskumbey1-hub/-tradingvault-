/**
 * Bybit V5 Adapter — LIVE integration
 *
 * Uses Bybit Unified Margin Account (UMA) V5 REST API.
 * API docs: https://bybit-exchange.github.io/docs/v5/
 *
 * Requirements:
 *  - API key with "Unified Margin Trade" read permissions
 *  - HMAC-SHA256 signing for all private endpoints
 */

import type {
  BrokerAdapter,
  BrokerCredentials,
  ConnectResult,
  SyncResult,
  HealthCheckResult,
  BrokerTrade,
  BrokerPosition,
  BrokerAccountInfo,
} from "../shared/types";

const BASE_URL = "https://api.bybit.com";

function hmacSha256(secret: string, data: string): string {
  const crypto = require("crypto");
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

async function apiGet(
  path: string,
  apiKey: string,
  apiSecret: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const timestamp = Date.now().toString();
  const recvWindow = "5000";

  // Sort params and build query string
  const sortedParams = { ...params, timestamp, recv_window: recvWindow };
  const qs = Object.entries(sortedParams)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const signature = hmacSha256(apiSecret, `${timestamp}${recvWindow}${qs}`);

  const res = await fetch(`${BASE_URL}${path}?${qs}`, {
    headers: {
      "X-BAPI-API-KEY": apiKey,
      "X-BAPI-SIGN": signature,
      "X-BAPI-TIMESTAMP": timestamp,
      "X-BAPI-RECV-WINDOW": recvWindow,
    },
  });

  if (!res.ok) {
    throw new Error(`Bybit API ${res.status}: ${res.statusText}`);
  }

  const data = await res.json() as Record<string, unknown>;
  if (data.retCode !== 0) {
    throw new Error(`Bybit error ${data.retCode}: ${data.retMsg}`);
  }
  return data.result;
}

export class BybitAdapter implements BrokerAdapter {
  readonly provider = "bybit" as const;
  readonly displayName = "Bybit";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = true;
  readonly documentation =
    "Live integration via Bybit V5 REST API. Requires API key with Unified Margin Trade read permissions.";

  async connect(credentials: BrokerCredentials): Promise<ConnectResult> {
    const { apiKey, apiSecret } = credentials as { apiKey: string; apiSecret: string };
    try {
      const wallet = (await apiGet("/v5/account/wallet-balance", apiKey, apiSecret, {
        accountType: "UNIFIED",
      })) as Record<string, unknown>;

      const list = (wallet.list as Array<Record<string, unknown>>)?.[0];
      const coins = (list?.coin as Array<Record<string, unknown>>) ?? [];
      const usdt = coins.find((c) => c.coin === "USDT") ?? coins[0];

      const balance = parseFloat(String(usdt?.walletBalance ?? 0));
      const equity = parseFloat(String(usdt?.equity ?? balance));
      const margin = parseFloat(String(usdt?.totalInitialMargin ?? 0));
      const freeMargin = parseFloat(String(usdt?.availableToWithdraw ?? equity - margin));
      const floatingPnl = parseFloat(String(usdt?.unrealisedPnl ?? 0));

      // Get open position count
      const positions = (await apiGet("/v5/position/list", apiKey, apiSecret, {
        category: "linear",
      })) as Record<string, unknown>;
      const openPos = (positions.list as Array<Record<string, unknown>>)?.filter(
        (p) => parseFloat(String(p.size ?? 0)) > 0
      ) ?? [];

      const accountInfo: BrokerAccountInfo = {
        balance,
        equity,
        margin,
        freeMargin,
        leverage: 1,
        currency: "USDT",
        server: "Bybit Unified",
        platform: "bybit",
        accountNumber: "bybit-um",
        openPositions: openPos.length,
        floatingPnl,
      };

      return { success: true, accountInfo };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to Bybit",
      };
    }
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async syncAccount(credentials: BrokerCredentials): Promise<ConnectResult> {
    return this.connect(credentials);
  }

  async syncTrades(
    credentials: BrokerCredentials,
    since?: string
  ): Promise<SyncResult> {
    const { apiKey, apiSecret } = credentials as { apiKey: string; apiSecret: string };
    const trades: BrokerTrade[] = [];
    const positions: BrokerPosition[] = [];

    try {
      // Fetch closed PnL (linear)
      const startTime = since ? new Date(since).getTime().toString() : undefined;
      const closedPnlParams: Record<string, string> = { category: "linear", limit: "200" };
      if (startTime) closedPnlParams.startTime = startTime;

      const closedPnl = (await apiGet(
        "/v5/position/closed-pnl",
        apiKey,
        apiSecret,
        closedPnlParams
      )) as Record<string, unknown>;

      const pnlList = (closedPnl.list as Array<Record<string, unknown>>) ?? [];

      for (const p of pnlList) {
        const brokerTradeId = String(p.orderId ?? p.execId ?? `${p.symbol}-${p.createdTime}`);
        const isLong = String(p.side) === "Buy";

        trades.push({
          brokerTradeId,
          brokerOrderId: String(p.orderId ?? ""),
          symbol: String(p.symbol ?? ""),
          marketType: "crypto",
          direction: isLong ? "long" : "short",
          entryPrice: parseFloat(String(p.avgPrice ?? 0)),
          exitPrice: parseFloat(String(p.avgPrice ?? 0)),
          entryTime: new Date(parseInt(String(p.createdTime ?? 0))).toISOString(),
          exitTime: new Date(parseInt(String(p.createdTime ?? 0))).toISOString(),
          lotSize: Math.abs(parseFloat(String(p.qty ?? 0))),
          profitLoss: parseFloat(String(p.closedPnl ?? 0)),
          commission: Math.abs(parseFloat(String(p.execFee ?? 0))),
          swap: 0,
          fees: Math.abs(parseFloat(String(p.execFee ?? 0))),
          stopLoss: p.stopLoss ? parseFloat(String(p.stopLoss)) : undefined,
          takeProfit: p.takeProfit ? parseFloat(String(p.takeProfit)) : undefined,
          status: "closed",
          comment: String(p.orderLinkId ?? ""),
        });
      }

      // Fetch open positions
      const positionsResult = (await apiGet("/v5/position/list", apiKey, apiSecret, {
        category: "linear",
      })) as Record<string, unknown>;

      const openPos = (positionsResult.list as Array<Record<string, unknown>>)?.filter(
        (p) => parseFloat(String(p.size ?? 0)) > 0
      ) ?? [];

      for (const p of openPos) {
        positions.push({
          brokerTradeId: `pos-${p.symbol}-${p.avgPrice}`,
          symbol: String(p.symbol ?? ""),
          direction: String(p.side) === "Buy" ? "long" : "short",
          entryPrice: parseFloat(String(p.avgPrice ?? 0)),
          currentPrice: parseFloat(String(p.markPrice ?? p.avgPrice ?? 0)),
          lotSize: Math.abs(parseFloat(String(p.size ?? 0))),
          profitLoss: parseFloat(String(p.unrealisedPnl ?? 0)),
          swap: parseFloat(String(p.cumRealisedFunding ?? 0)),
          commission: 0,
          entryTime: new Date(parseInt(String(p.createdTime ?? Date.now()))).toISOString(),
          stopLoss: p.stopLoss ? parseFloat(String(p.stopLoss)) : undefined,
          takeProfit: p.takeProfit ? parseFloat(String(p.takeProfit)) : undefined,
        });
      }

      // Get account info
      const wallet = (await apiGet("/v5/account/wallet-balance", apiKey, apiSecret, {
        accountType: "UNIFIED",
      })) as Record<string, unknown>;
      const list = (wallet.list as Array<Record<string, unknown>>)?.[0];
      const coins = (list?.coin as Array<Record<string, unknown>>) ?? [];
      const usdt = coins.find((c) => c.coin === "USDT") ?? coins[0];

      return {
        success: true,
        trades,
        positions,
        syncedAt: new Date().toISOString(),
        accountInfo: {
          balance: parseFloat(String(usdt?.walletBalance ?? 0)),
          equity: parseFloat(String(usdt?.equity ?? 0)),
          margin: parseFloat(String(usdt?.totalInitialMargin ?? 0)),
          freeMargin: parseFloat(String(usdt?.availableToWithdraw ?? 0)),
          leverage: 1,
          currency: "USDT",
          server: "Bybit Unified",
          platform: "bybit",
          accountNumber: "bybit-um",
          openPositions: openPos.length,
          floatingPnl: parseFloat(String(usdt?.unrealisedPnl ?? 0)),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to sync Bybit trades",
        trades: [],
        positions: [],
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async syncPositions(
    credentials: BrokerCredentials
  ): Promise<{ positions: BrokerPosition[] }> {
    const { apiKey, apiSecret } = credentials as { apiKey: string; apiSecret: string };
    try {
      const result = (await apiGet("/v5/position/list", apiKey, apiSecret, {
        category: "linear",
      })) as Record<string, unknown>;

      const openPos = (result.list as Array<Record<string, unknown>>)?.filter(
        (p) => parseFloat(String(p.size ?? 0)) > 0
      ) ?? [];

      return {
        positions: openPos.map((p) => ({
          brokerTradeId: `pos-${p.symbol}-${p.avgPrice}`,
          symbol: String(p.symbol ?? ""),
          direction: String(p.side) === "Buy" ? "long" : "short",
          entryPrice: parseFloat(String(p.avgPrice ?? 0)),
          currentPrice: parseFloat(String(p.markPrice ?? p.avgPrice ?? 0)),
          lotSize: Math.abs(parseFloat(String(p.size ?? 0))),
          profitLoss: parseFloat(String(p.unrealisedPnl ?? 0)),
          swap: parseFloat(String(p.cumRealisedFunding ?? 0)),
          commission: 0,
          entryTime: new Date(parseInt(String(p.createdTime ?? Date.now()))).toISOString(),
        })),
      };
    } catch {
      return { positions: [] };
    }
  }

  async healthCheck(
    credentials: BrokerCredentials
  ): Promise<HealthCheckResult> {
    try {
      const result = await this.connect(credentials);
      return {
        healthy: result.success,
        status: result.success ? "connected" : "error",
        error: result.error,
      };
    } catch (err) {
      return {
        healthy: false,
        status: "error",
        error: err instanceof Error ? err.message : "Health check failed",
      };
    }
  }
}
