export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
}

export type PlatformType =
  | "mt5"
  | "mt4"
  | "matchtrader"
  | "ctrader"
  | "dxtrade"
  | "tradelocker"
  | "binance"
  | "bybit"
  | "coinbase"
  | "kraken"
  | "ibkr"
  | "manual";

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "syncing"
  | "error"
  | "connecting";

export interface TradingAccount {
  id: string;
  user_id: string;
  account_name: string;
  broker_name: string;
  account_type: string;
  initial_balance: number;
  current_balance: number;
  currency: string;
  platform: PlatformType;
  server_name: string;
  login_id: string;
  encrypted_password: string;
  connection_status: ConnectionStatus;
  last_sync: string | null;
  equity: number;
  margin: number;
  free_margin: number;
  leverage: number;
  open_positions: number;
  account_number: string;
  created_at: string;
}

export interface Platform {
  id: PlatformType;
  name: string;
  category: "forex" | "crypto" | "multi";
  hasApi: boolean;
  description: string;
  logoColor: string;
}

export type MarketType =
  | "forex"
  | "stocks"
  | "crypto"
  | "commodities"
  | "indices"
  | "futures";

export type TradeDirection = "long" | "short";

export type TradeStatus = "win" | "loss" | "breakeven" | "open";

export interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  trade_date: string;
  symbol: string;
  market_type: MarketType;
  direction: TradeDirection;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  risk_amount: number;
  profit_loss: number | null;
  commission: number;
  fees: number;
  risk_reward: number | null;
  strategy: string | null;
  setup: string | null;
  tags: string[];
  emotion: string | null;
  confidence_level: number | null;
  notes: string | null;
  screenshot_url: string | null;
  status: TradeStatus;
  created_at: string;
}

export interface Strategy {
  id: string;
  user_id: string;
  strategy_name: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export interface DashboardStats {
  total_trades: number;
  total_profit: number;
  win_rate: number;
  profit_factor: number;
  average_rr: number;
}

export interface TradeFormData {
  trade_date: string;
  symbol: string;
  market_type: MarketType;
  direction: TradeDirection;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  take_profit?: number;
  lot_size: number;
  risk_amount: number;
  profit_loss?: number;
  commission: number;
  fees: number;
  strategy?: string;
  setup?: string;
  tags: string[];
  emotion?: string;
  confidence_level?: number;
  notes?: string;
  screenshot_url?: string;
  status: TradeStatus;
  account_id: string;
}

export interface ConnectionStage {
  label: string;
  status: "pending" | "active" | "done" | "error";
}
