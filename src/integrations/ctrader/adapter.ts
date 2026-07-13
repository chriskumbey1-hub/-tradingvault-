/**
 * cTrader Open API Adapter — PLACEHOLDER
 *
 * cTrader Open API exists (OAuth 2.0) but requires:
 *  1. Broker registration of your application
 *  2. OAuth client credentials from your broker
 *  3. User authorization via OAuth flow
 *
 * API docs: https://openapi.ctrader.com
 * The API supports: accounts, orders, positions, deals, historical deals.
 *
 * For production: implement OAuth 2.0 flow + REST/WebSocket endpoints.
 */

import type {
  BrokerAdapter,
  BrokerCredentials,
  ConnectResult,
  SyncResult,
  HealthCheckResult,
  BrokerPosition,
} from "../shared/types";

export class CTraderAdapter implements BrokerAdapter {
  readonly provider = "ctrader" as const;
  readonly displayName = "cTrader";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = false;
  readonly documentation =
    "cTrader Open API requires OAuth app registration with your broker. See: https://openapi.ctrader.com. Contact your broker to enable API access.";

  async connect(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return {
      success: false,
      error:
        "cTrader Open API requires broker-provisioned OAuth credentials. Contact your broker to enable API access, then reconfigure.",
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async syncAccount(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return { success: false, error: "cTrader sync requires OAuth setup." };
  }

  async syncTrades(_credentials: BrokerCredentials, _since?: string): Promise<SyncResult> {
    return {
      success: false,
      error: "cTrader trade sync requires OAuth setup.",
      trades: [],
      positions: [],
      syncedAt: new Date().toISOString(),
    };
  }

  async syncPositions(_credentials: BrokerCredentials): Promise<{ positions: BrokerPosition[] }> {
    return { positions: [] };
  }

  async healthCheck(_credentials: BrokerCredentials): Promise<HealthCheckResult> {
    return { healthy: false, status: "error", error: "cTrader requires OAuth registration." };
  }
}
