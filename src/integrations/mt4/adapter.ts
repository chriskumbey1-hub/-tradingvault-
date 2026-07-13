/**
 * MetaTrader 4 Adapter — PLACEHOLDER
 *
 * MT4 has no public REST API. Real integration requires:
 *  1. MT4 Manager API (requires broker partnership license)
 *  2. A third-party bridge service
 *  3. CSV trade export from the MT4 terminal
 *
 * For production use, implement:
 *  - MT4 Manager API integration (C++/C#/.NET)
 *  - Third-party bridge (e.g., Liquidity Bridge, PrimeXM)
 *  - CSV import from MT4 terminal
 */

import type {
  BrokerAdapter,
  BrokerCredentials,
  ConnectResult,
  SyncResult,
  HealthCheckResult,
  BrokerPosition,
} from "../shared/types";

export class MT4Adapter implements BrokerAdapter {
  readonly provider = "mt4" as const;
  readonly displayName = "MetaTrader 4";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = false;
  readonly documentation =
    "MT4 requires a Manager API license or bridge. Use CSV import as an alternative. See: https://www.mql4.com/en/docs";

  async connect(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return {
      success: false,
      error:
        "MT4 direct connection not available. Use CSV import or configure a MT4 bridge. See documentation.",
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async syncAccount(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return { success: false, error: "MT4 sync requires a bridge server." };
  }

  async syncTrades(_credentials: BrokerCredentials, _since?: string): Promise<SyncResult> {
    return {
      success: false,
      error: "MT4 trade sync requires a bridge.",
      trades: [],
      positions: [],
      syncedAt: new Date().toISOString(),
    };
  }

  async syncPositions(_credentials: BrokerCredentials): Promise<{ positions: BrokerPosition[] }> {
    return { positions: [] };
  }

  async healthCheck(_credentials: BrokerCredentials): Promise<HealthCheckResult> {
    return { healthy: false, status: "error", error: "MT4 requires a bridge server." };
  }
}
