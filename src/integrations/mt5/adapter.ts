/**
 * MetaTrader 5 Adapter — PLACEHOLDER
 *
 * MT5 has no official public REST API. Real integration requires:
 *  1. A MetaTrader 5 Python/S++ Gateway running on a VPS
 *  2. The MetaQuotes Manager API (requires broker license)
 *  3. A third-party bridge (e.g., dxFeed, Gold-i, oneZero)
 *  4. CSV/OFX import from MT5 terminal
 *
 * For production use, implement one of:
 *  - Python MT5 adapter using the MetaTrader5 package (Windows only)
 *  - REST-to-MT5 bridge server
 *  - MT5 Manager API integration
 */

import type {
  BrokerAdapter,
  BrokerCredentials,
  ConnectResult,
  SyncResult,
  HealthCheckResult,
  BrokerPosition,
} from "../shared/types";

export class MT5Adapter implements BrokerAdapter {
  readonly provider = "mt5" as const;
  readonly displayName = "MetaTrader 5";
  readonly requiresCredentials = true;
  readonly supportsRealTimeSync = false;
  readonly documentation =
    "MT5 requires a gateway server. See docs: https://www.mql5.com/en/docs/api. Supported methods: Python MT5 package (Windows VPS), Manager API (broker license), or CSV import.";

  async connect(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return {
      success: false,
      error:
        "MT5 direct connection not yet available. Please use CSV import or configure a MT5 Gateway server. See documentation for setup instructions.",
    };
  }

  async disconnect(_connectionId: string): Promise<void> {}

  async syncAccount(_credentials: BrokerCredentials): Promise<ConnectResult> {
    return {
      success: false,
      error: "MT5 sync requires a gateway. Use CSV import as an alternative.",
    };
  }

  async syncTrades(_credentials: BrokerCredentials, _since?: string): Promise<SyncResult> {
    return {
      success: false,
      error: "MT5 trade sync requires a gateway.",
      trades: [],
      positions: [],
      syncedAt: new Date().toISOString(),
    };
  }

  async syncPositions(_credentials: BrokerCredentials): Promise<{ positions: BrokerPosition[] }> {
    return { positions: [] };
  }

  async healthCheck(_credentials: BrokerCredentials): Promise<HealthCheckResult> {
    return {
      healthy: false,
      status: "error",
      error: "MT5 requires a gateway server. Use CSV import instead.",
    };
  }
}
