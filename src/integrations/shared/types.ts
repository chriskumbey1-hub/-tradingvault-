// ============================================================
// Shared Types for Broker Integration Layer
// ============================================================

export type ProviderId =
  | "mt5"
  | "mt4"
  | "ctrader"
  | "dxtrade"
  | "matchtrader"
  | "binance"
  | "bybit"
  | "oanda"
  | "manual";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "syncing"
  | "error"
  | "expired";

export type TradeDirection = "long" | "short";
export type TradeStatus = "open" | "closed" | "cancelled";

// ---- Credentials (per provider) ----

export interface MT5Credentials {
  loginId: string;
  password: string;
  server: string;
}

export interface MT4Credentials {
  loginId: string;
  password: string;
  server: string;
}

export interface CTraderCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface DXTradeCredentials {
  email: string;
  password: string;
  brokerUrl: string;
}

export interface MatchTraderCredentials {
  email: string;
  password: string;
  brokerUrl: string;
}

export interface BinanceCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface BybitCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface OANDACredentials {
  accessToken: string;
  accountId: string;
  environment: "live" | "demo";
}

export type BrokerCredentials =
  | MT5Credentials
  | MT4Credentials
  | CTraderCredentials
  | DXTradeCredentials
  | MatchTraderCredentials
  | BinanceCredentials
  | BybitCredentials
  | OANDACredentials;

// ---- Account Info ----

export interface BrokerAccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  server: string;
  platform: string;
  accountNumber: string;
  openPositions: number;
  floatingPnl: number;
}

// ---- Trade from broker ----

export interface BrokerTrade {
  brokerTradeId: string;
  brokerOrderId?: string;
  symbol: string;
  marketType: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  entryTime: string; // ISO date
  exitTime?: string;
  lotSize: number;
  profitLoss: number;
  commission: number;
  swap: number;
  fees: number;
  stopLoss?: number;
  takeProfit?: number;
  status: TradeStatus;
  magicNumber?: number;
  comment?: string;
}

// ---- Open Position from broker ----

export interface BrokerPosition {
  brokerTradeId: string;
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  currentPrice: number;
  lotSize: number;
  profitLoss: number;
  swap: number;
  commission: number;
  entryTime: string;
  stopLoss?: number;
  takeProfit?: number;
  magicNumber?: number;
  comment?: string;
}

// ---- Adapter Results ----

export interface ConnectResult {
  success: boolean;
  error?: string;
  accountInfo?: BrokerAccountInfo;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  accountInfo?: BrokerAccountInfo;
  trades: BrokerTrade[];
  positions: BrokerPosition[];
  syncedAt: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  status: ConnectionStatus;
  error?: string;
}

// ---- Adapter Interface ----

export interface BrokerAdapter {
  readonly provider: ProviderId;
  readonly displayName: string;
  readonly requiresCredentials: boolean;
  readonly supportsRealTimeSync: boolean;
  readonly documentation: string;

  /** Validate credentials and fetch account info */
  connect(credentials: BrokerCredentials): Promise<ConnectResult>;

  /** Disconnect and clean up */
  disconnect(connectionId: string): Promise<void>;

  /** Fetch current account balance/equity/margin */
  syncAccount(credentials: BrokerCredentials): Promise<ConnectResult>;

  /** Fetch closed trades since last sync */
  syncTrades(
    credentials: BrokerCredentials,
    since?: string
  ): Promise<SyncResult>;

  /** Fetch currently open positions */
  syncPositions(
    credentials: BrokerCredentials
  ): Promise<{ positions: BrokerPosition[] }>;

  /** Fetch pending orders */
  syncOrders?(credentials: BrokerCredentials): Promise<{ orders: unknown[] }>;

  /** Check if the connection is still valid */
  healthCheck(
    credentials: BrokerCredentials
  ): Promise<HealthCheckResult>;
}

// ---- Provider Metadata ----

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  category: "forex" | "crypto" | "prop" | "multi";
  hasRealApi: boolean;
  description: string;
  fields: ProviderField[];
  icon?: string;
}

export interface ProviderField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "url";
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  helpText?: string;
}

// ---- Sync Log Entry ----

export interface SyncLogEntry {
  id: string;
  connectionId: string;
  status: "running" | "success" | "failed" | "partial";
  message: string;
  tradesImported: number;
  tradesUpdated: number;
  tradesSkipped: number;
  balanceBefore: number | null;
  balanceAfter: number | null;
  equityAfter: number | null;
  startedAt: string;
  finishedAt: string | null;
}
