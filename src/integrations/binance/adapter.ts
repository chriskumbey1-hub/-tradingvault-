/**
 * Binance Futures/Spot Adapter — LIVE integration
 *
 * Uses Binance REST API v3 (Spot) + USDⓈ-M Futures API.
 * API docs: https://binance-docs.github.io/apidocs/
 *
 * Requirements:
 *  - API key with "Enable Futures" + "Enable Spot" read permissions
 *  - IP whitelist recommended for production
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

const BASE_SPOT = "https://api.binance.com";
const BASE_FUTURES = "https://fapi.binance.com";
const RECV_WINDOW = 10_000;

function hmacSha256(secret: string, data: string): string {
  // Node.js crypto — available in Next.js server runtime
  const crypto = require("crypto");
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function signQuery(params: Record<string, string | number>, secret: string): string {
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const signature = hmacSha256(secret, qs);
  return `${qs}&signature=${signature}`;
}

async function apiGet(
  base: string,
  path: string,
  apiKey: string,
  apiSecret: string,
  params: Record<string, string | number> = {}
): Promise<unknown> {
  const allParams = { ...params, timestamp: Date.now(), recvWindow: RECV_WINDOW };
  const signed = signQuery(allParams, apiSecret);
  const res = await fetch(`${base}${path}?${signed}`, {
    headers: { "X-MBX-APIKEY": apiKey },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Binance API ${res.status}: ${(body as Record<string, unknown>).msg || res.statusText}`
    );
  }
  return res.json();
}

export class BinanceAdapter implements BrokerAdapter {
  readonly provider = "binance" as const;
  readonly displayName = "Binance";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = true;
  readonly documentation =
    "Live integration via Binance REST API. Requires API key with Futures/Spot read permissions. IP whitelist recommended.";

  async connect(credentials: BrokerCredentials): Promise<ConnectResult> {
    const { apiKey, apiSecret } = credentials as { apiKey: string; apiSecret: string };
    try {
      // Verify API key by fetching account info
      const account = (await apiGet(BASE_FUTURES, "/fapi/v2/account", apiKey, apiSecret)) as Record<string, unknown>;

      const assets = (account.assets as Array<Record<string, unknown>>)?.find(
        (a) => a.asset === "USDT"
      ) ?? (account.assets as Array<Record<string, unknown>>)?.[0];

      const balance = parseFloat(String(assets?.walletBalance ?? 0));
      const equity = parseFloat(String(assets?.marginBalance ?? balance));
      const margin = parseFloat(String(assets?.totalInitialMargin ?? 0));
      const freeMargin = parseFloat(String(assets?.availableBalance ?? equity - margin));
      const floatingPnl = parseFloat(String(assets?.unrealizedProfit ?? 0));

      // Get open positions count
      const positions = (account.positions as Array<Record<string, unknown>>)?.filter(
        (p) => parseFloat(String(p.positionAmt ?? 0)) !== 0
      ) ?? [];

      const accountInfo: BrokerAccountInfo = {
        balance,
        equity,
        margin,
        freeMargin,
        leverage: 1,
        currency: "USDT",
        server: "Binance Futures",
        platform: "binance",
        accountNumber: "binance-futures",
        openPositions: positions.length,
        floatingPnl,
      };

      return { success: true, accountInfo };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to Binance",
      };
    }
  }

  async disconnect(_connectionId: string): Promise<void> {
    // No persistent session to close — stateless API keys
  }

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
      // Fetch Futures income history (closed PnL)
      const startTime = since ? new Date(since).getTime() : undefined;
      const incomeParams: Record<string, string | number> = { limit: 1000 };
      if (startTime) incomeParams.startTime = startTime;

      const income = (await apiGet(
        BASE_FUTURES,
        "/fapi/v1/income",
        apiKey,
        apiSecret,
        incomeParams
      )) as Array<Record<string, unknown>>;

      // Build trade records from income entries
      // Group by symbol to reconstruct trades
      const symbolMap = new Map<string, BrokerTrade>();

      for (const entry of income) {
        if (entry.incomeType !== "REALIZED_PNL") continue;
        const symbol = String(entry.symbol ?? "");
        const time = entry.time as number;

        // Fetch recent trades for this symbol
        const recentTrades = (await apiGet(
          BASE_FUTURES,
          "/fapi/v1/userTrades",
          apiKey,
          apiSecret,
          { symbol, limit: 100 }
        )) as Array<Record<string, unknown>>;

        for (const t of recentTrades) {
          const brokerTradeId = String(t.id ?? t.orderId ?? `${symbol}-${t.time}`);
          if (symbolMap.has(brokerTradeId)) continue;

          const qty = Math.abs(parseFloat(String(t.qty ?? 0)));
          const pnl = parseFloat(String(t.realizedPnl ?? 0));
          const commission = Math.abs(parseFloat(String(t.commission ?? 0)));
          const isBuyer = t.buyer === true;

          symbolMap.set(brokerTradeId, {
            brokerTradeId,
            brokerOrderId: String(t.orderId ?? ""),
            symbol,
            marketType: "crypto",
            direction: isBuyer ? "long" : "short",
            entryPrice: parseFloat(String(t.price ?? 0)),
            exitPrice: parseFloat(String(t.price ?? 0)),
            entryTime: new Date(time).toISOString(),
            exitTime: new Date(time).toISOString(),
            lotSize: qty,
            profitLoss: pnl,
            commission,
            swap: 0,
            fees: commission,
            status: "closed",
            comment: t.maker ? "maker" : "taker",
          });
        }
      }

      trades.push(...symbolMap.values());

      // Fetch open positions
      const account = (await apiGet(BASE_FUTURES, "/fapi/v2/account", apiKey, apiSecret)) as Record<string, unknown>;
      const openPositions = (account.positions as Array<Record<string, unknown>>)?.filter(
        (p) => parseFloat(String(p.positionAmt ?? 0)) !== 0
      ) ?? [];

      for (const p of openPositions) {
        const amt = parseFloat(String(p.positionAmt ?? 0));
        positions.push({
          brokerTradeId: `pos-${p.symbol}-${p.entryPrice}`,
          symbol: String(p.symbol ?? ""),
          direction: amt > 0 ? "long" : "short",
          entryPrice: parseFloat(String(p.entryPrice ?? 0)),
          currentPrice: 0, // Would need mark price endpoint
          lotSize: Math.abs(amt),
          profitLoss: parseFloat(String(p.unrealizedProfit ?? 0)),
          swap: 0,
          commission: 0,
          entryTime: new Date().toISOString(),
          stopLoss: undefined,
          takeProfit: undefined,
        });
      }

      // Account info
      const assets = (account.assets as Array<Record<string, unknown>>)?.find(
        (a) => a.asset === "USDT"
      );
      const balance = parseFloat(String(assets?.walletBalance ?? 0));
      const equity = parseFloat(String(assets?.marginBalance ?? balance));
      const margin = parseFloat(String(assets?.totalInitialMargin ?? 0));

      return {
        success: true,
        trades,
        positions,
        syncedAt: new Date().toISOString(),
        accountInfo: {
          balance,
          equity,
          margin,
          freeMargin: parseFloat(String(assets?.availableBalance ?? 0)),
          leverage: 1,
          currency: "USDT",
          server: "Binance Futures",
          platform: "binance",
          accountNumber: "binance-futures",
          openPositions: openPositions.length,
          floatingPnl: parseFloat(String(assets?.unrealizedProfit ?? 0)),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to sync Binance trades",
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
      const account = (await apiGet(BASE_FUTURES, "/fapi/v2/account", apiKey, apiSecret)) as Record<string, unknown>;
      const openPositions = (account.positions as Array<Record<string, unknown>>)?.filter(
        (p) => parseFloat(String(p.positionAmt ?? 0)) !== 0
      ) ?? [];

      const positions: BrokerPosition[] = openPositions.map((p) => {
        const amt = parseFloat(String(p.positionAmt ?? 0));
        return {
          brokerTradeId: `pos-${p.symbol}-${p.entryPrice}`,
          symbol: String(p.symbol ?? ""),
          direction: amt > 0 ? "long" : "short",
          entryPrice: parseFloat(String(p.entryPrice ?? 0)),
          currentPrice: parseFloat(String(p.markPrice ?? p.entryPrice ?? 0)),
          lotSize: Math.abs(amt),
          profitLoss: parseFloat(String(p.unrealizedProfit ?? 0)),
          swap: 0,
          commission: 0,
          entryTime: new Date().toISOString(),
        };
      });
      return { positions };
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
