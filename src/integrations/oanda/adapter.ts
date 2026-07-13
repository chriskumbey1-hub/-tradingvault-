/**
 * OANDA v20 Adapter — LIVE integration
 *
 * Uses OANDA v20 REST API for both live and practice (demo) accounts.
 * API docs: https://developer.oanda.com/rest-live-v20/introduction/
 *
 * Requirements:
 *  - Personal Access Token (PAT) from OANDA portal
 *  - Account ID (format: 101-001-12345678-001)
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

function getBaseUrl(environment: "live" | "demo"): string {
  return environment === "live"
    ? "https://api-fxtrade.oanda.com"
    : "https://api-fxpractice.oanda.com";
}

function getStreamUrl(environment: "live" | "demo"): string {
  return environment === "live"
    ? "https://stream-fxtrade.oanda.com"
    : "https://stream-fxpractice.oanda.com";
}

async function apiGet(
  baseUrl: string,
  path: string,
  token: string
): Promise<unknown> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    const errMsg = (body.errorMessage as Record<string, unknown>)?.message;
    throw new Error(`OANDA API ${res.status}: ${errMsg || res.statusText}`);
  }
  return res.json();
}

const INSTRUMENT_MAP: Record<string, string> = {
  EUR_USD: "EUR/USD",
  GBP_USD: "GBP/USD",
  USD_JPY: "USD/JPY",
  AUD_USD: "AUD/USD",
  NZD_USD: "NZD/USD",
  USD_CAD: "USD/CAD",
  USD_CHF: "USD/CHF",
  EUR_GBP: "EUR/GBP",
  EUR_JPY: "EUR/JPY",
  GBP_JPY: "GBP/JPY",
  XAU_USD: "XAU/USD",
  XAG_USD: "XAG/USD",
  BTC_USD: "BTC/USD",
};

function formatSymbol(instrument: string): string {
  return INSTRUMENT_MAP[instrument] ?? instrument.replace("_", "/");
}

function marketTypeFromInstrument(instrument: string): string {
  if (instrument.startsWith("XAU") || instrument.startsWith("XAG")) return "commodities";
  if (instrument.includes("BTC") || instrument.includes("ETH")) return "crypto";
  return "forex";
}

export class OANDAAdapter implements BrokerAdapter {
  readonly provider = "oanda" as const;
  readonly displayName = "OANDA";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = true;
  readonly documentation =
    "Live integration via OANDA v20 REST API. Requires a Personal Access Token and Account ID from the OANDA portal.";

  async connect(credentials: BrokerCredentials): Promise<ConnectResult> {
    const { accessToken, accountId, environment } = credentials as {
      accessToken: string;
      accountId: string;
      environment: "live" | "demo";
    };
    const baseUrl = getBaseUrl(environment);

    try {
      const account = (await apiGet(
        baseUrl,
        `/v3/accounts/${accountId}/summary`,
        accessToken
      )) as Record<string, unknown>;

      const acct = account.account as Record<string, unknown>;
      const balance = parseFloat(String(acct.balance ?? 0));
      const unrealizedPnl = parseFloat(String(acct.unrealizedPL ?? 0));
      const equity = balance + unrealizedPnl;
      const marginUsed = parseFloat(String(acct.marginUsed ?? 0));
      const marginAvailable = parseFloat(String(acct.marginAvailable ?? 0));
      const openTradeCount = parseInt(String(acct.openTradeCount ?? 0));
      const openPositionCount = parseInt(String(acct.openPositionCount ?? 0));

      const accountInfo: BrokerAccountInfo = {
        balance,
        equity,
        margin: marginUsed,
        freeMargin: marginAvailable,
        leverage: 1,
        currency: String(acct.currency ?? "USD"),
        server: environment === "live" ? "OANDA Live" : "OANDA Practice",
        platform: "oanda",
        accountNumber: accountId,
        openPositions: openTradeCount + openPositionCount,
        floatingPnl: unrealizedPnl,
      };

      return { success: true, accountInfo };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to connect to OANDA",
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
    const { accessToken, accountId, environment } = credentials as {
      accessToken: string;
      accountId: string;
      environment: "live" | "demo";
    };
    const baseUrl = getBaseUrl(environment);
    const trades: BrokerTrade[] = [];
    const positions: BrokerPosition[] = [];

    try {
      // Fetch closed trades
      const countParams = since ? `?count=500` : `?count=100`;
      const tradesResp = (await apiGet(
        baseUrl,
        `/v3/accounts/${accountId}/trades${countParams}`,
        accessToken
      )) as Record<string, unknown>;

      const tradeList = (tradesResp.trades as Array<Record<string, unknown>>) ?? [];

      for (const t of tradeList) {
        const state = String(t.state ?? "");
        if (state !== "CLOSED") continue;

        const instrument = String(t.instrument ?? "");
        const direction: "long" | "short" = String(t.currentUnits ?? 0).includes("-")
          ? "short"
          : "long";
        const entryTime = String(t.openTime ?? "");
        const closeTime = String(t.closeTime ?? "");
        const realizedPL = parseFloat(String(t.realizedPL ?? 0));
        const commission = Math.abs(parseFloat(String(t.commission ?? 0)));
        const financing = Math.abs(parseFloat(String(t.financing ?? 0)));

        // Fetch trade details for entry/exit prices
        const detail = (await apiGet(
          baseUrl,
          `/v3/accounts/${accountId}/trades/${t.id}`,
          accessToken
        )) as Record<string, unknown>;
        const tradeDetail = detail.trade as Record<string, unknown>;

        const price = (tradeDetail.price as Record<string, unknown>) ?? {};
        const avgEntry = parseFloat(String(price.average ?? 0));
        const avgExit = parseFloat(String(price.average ?? 0));

        trades.push({
          brokerTradeId: String(t.id ?? ""),
          brokerOrderId: String(t.id ?? ""),
          symbol: formatSymbol(instrument),
          marketType: marketTypeFromInstrument(instrument),
          direction,
          entryPrice: avgEntry,
          exitPrice: avgExit,
          entryTime,
          exitTime: closeTime,
          lotSize: Math.abs(parseFloat(String(t.initialUnits ?? 0))),
          profitLoss: realizedPL,
          commission,
          swap: financing,
          fees: commission + financing,
          stopLoss: t.stopLossOrder
            ? parseFloat(String((t.stopLossOrder as Record<string, unknown>).price ?? 0))
            : undefined,
          takeProfit: t.takeProfitOrder
            ? parseFloat(String((t.takeProfitOrder as Record<string, unknown>).price ?? 0))
            : undefined,
          status: "closed",
        });
      }

      // Fetch open trades → positions
      const openTradesResp = (await apiGet(
        baseUrl,
        `/v3/accounts/${accountId}/openTrades`,
        accessToken
      )) as Record<string, unknown>;
      const openList = (openTradesResp.trades as Array<Record<string, unknown>>) ?? [];

      for (const t of openList) {
        const instrument = String(t.instrument ?? "");
        const currentUnits = parseFloat(String(t.currentUnits ?? 0));

        positions.push({
          brokerTradeId: String(t.id ?? ""),
          symbol: formatSymbol(instrument),
          direction: currentUnits > 0 ? "long" : "short",
          entryPrice: parseFloat(String(t.price ?? 0)),
          currentPrice: parseFloat(String(t.unrealizedPL ?? 0)),
          lotSize: Math.abs(currentUnits),
          profitLoss: parseFloat(String(t.unrealizedPL ?? 0)),
          swap: parseFloat(String(t.financing ?? 0)),
          commission: 0,
          entryTime: String(t.openTime ?? ""),
        });
      }

      // Account info
      const account = (await apiGet(
        baseUrl,
        `/v3/accounts/${accountId}/summary`,
        accessToken
      )) as Record<string, unknown>;
      const acct = account.account as Record<string, unknown>;
      const balance = parseFloat(String(acct.balance ?? 0));
      const unrealizedPnl = parseFloat(String(acct.unrealizedPL ?? 0));

      return {
        success: true,
        trades,
        positions,
        syncedAt: new Date().toISOString(),
        accountInfo: {
          balance,
          equity: balance + unrealizedPnl,
          margin: parseFloat(String(acct.marginUsed ?? 0)),
          freeMargin: parseFloat(String(acct.marginAvailable ?? 0)),
          leverage: 1,
          currency: String(acct.currency ?? "USD"),
          server: environment === "live" ? "OANDA Live" : "OANDA Practice",
          platform: "oanda",
          accountNumber: accountId,
          openPositions: openList.length,
          floatingPnl: unrealizedPnl,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to sync OANDA trades",
        trades: [],
        positions: [],
        syncedAt: new Date().toISOString(),
      };
    }
  }

  async syncPositions(
    credentials: BrokerCredentials
  ): Promise<{ positions: BrokerPosition[] }> {
    const { accessToken, accountId, environment } = credentials as {
      accessToken: string;
      accountId: string;
      environment: "live" | "demo";
    };
    const baseUrl = getBaseUrl(environment);

    try {
      const resp = (await apiGet(
        baseUrl,
        `/v3/accounts/${accountId}/openPositions`,
        accessToken
      )) as Record<string, unknown>;

      const list = (resp.positions as Array<Record<string, unknown>>) ?? [];
      return {
        positions: list.map((p) => {
          const long = p.long as Record<string, unknown> | undefined;
          const short = p.short as Record<string, unknown> | undefined;
          const isLong = long && parseFloat(String(long.units ?? 0)) > 0;
          const units = isLong ? long : short;

          return {
            brokerTradeId: String(p.instrument ?? ""),
            symbol: formatSymbol(String(p.instrument ?? "")),
            direction: isLong ? ("long" as const) : ("short" as const),
            entryPrice: parseFloat(String(units?.averagePrice ?? 0)),
            currentPrice: 0,
            lotSize: Math.abs(parseFloat(String(units?.units ?? 0))),
            profitLoss: parseFloat(String(units?.unrealizedPL ?? 0)),
            swap: parseFloat(String(units?.financing ?? 0)),
            commission: 0,
            entryTime: "",
          };
        }),
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
