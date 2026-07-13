/**
 * Match-Trader Adapter — PLACEHOLDER
 *
 * Match-Trader (by Conotoxia) has a WebSocket API but requires broker provisioning.
 * Retail users cannot access the API directly.
 *
 * Integration options:
 *  1. Broker-side WebSocket API access
 *  2. CSV trade export
 */

import type {
  BrokerAdapter,
  BrokerCredentials,
  ConnectResult,
  SyncResult,
  HealthCheckResult,
  BrokerPosition,
} from "../shared/types";

export class MatchTraderAdapter implements BrokerAdapter {
  readonly provider = "matchtrader" as const;
  readonly displayName = "Match-Trader";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = false;
  readonly documentation =
    "Match-Trader requires broker-provisioned WebSocket API. Use CSV import as an alternative. Contact your broker for API credentials.";

  async connect(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return {
      success: false,
      error:
        "Match-Trader API access requires broker provisioning. Use CSV import or request API access from your broker.",
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async syncAccount(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return { success: false, error: "Match-Trader sync requires broker API access." };
  }

  async syncTrades(_credentials: BrokerCredentials, _since?: string): Promise<SyncResult> {
    return {
      success: false,
      error: "Match-Trader trade sync requires broker API access.",
      trades: [],
      positions: [],
      syncedAt: new Date().toISOString(),
    };
  }

  async syncPositions(_credentials: BrokerCredentials): Promise<{ positions: BrokerPosition[] }> {
    return { positions: [] };
  }

  async healthCheck(_credentials: BrokerCredentials): Promise<HealthCheckResult> {
    return { healthy: false, status: "error", error: "Match-Trader requires broker API provisioning." };
  }
}
