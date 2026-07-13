/**
 * DXtrade Adapter — PLACEHOLDER
 *
 * DXtrade (by Devexperts) has a WebSocket API but it requires broker provisioning.
 * Retail users cannot directly access the API.
 *
 * Integration options:
 *  1. Broker-side API access (request from your broker)
 *  2. CSV/Excel trade export from DXtrade web terminal
 *  3. Screenshot-based trade import
 */

import type {
  BrokerAdapter,
  BrokerCredentials,
  ConnectResult,
  SyncResult,
  HealthCheckResult,
  BrokerPosition,
} from "../shared/types";

export class DXTradeAdapter implements BrokerAdapter {
  readonly provider = "dxtrade" as const;
  readonly displayName = "DXtrade";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = false;
  readonly documentation =
    "DXtrade requires broker-provisioned API access. Use CSV import as an alternative. Contact your broker for WebSocket API credentials.";

  async connect(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return {
      success: false,
      error:
        "DXtrade API access requires broker provisioning. Use CSV import or request API access from your broker.",
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async syncAccount(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return { success: false, error: "DXtrade sync requires broker API access." };
  }

  async syncTrades(_credentials: BrokerCredentials, _since?: string): Promise<SyncResult> {
    return {
      success: false,
      error: "DXtrade trade sync requires broker API access.",
      trades: [],
      positions: [],
      syncedAt: new Date().toISOString(),
    };
  }

  async syncPositions(_credentials: BrokerCredentials): Promise<{ positions: BrokerPosition[] }> {
    return { positions: [] };
  }

  async healthCheck(_credentials: BrokerCredentials): Promise<HealthCheckResult> {
    return { healthy: false, status: "error", error: "DXtrade requires broker API provisioning." };
  }
}
