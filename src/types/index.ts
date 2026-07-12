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
  | "exness"
  | "maven"
  | "ftmo"
  | "fundednext"
  | "myfundedfx"
  | "fundedtrader"
  | "topstep"
  | "e8funding"
  | "surgetrader"
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
  category: "forex" | "crypto" | "multi" | "prop";
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
  account_id: string | null;
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
  lessons_learned: string | null;
  screenshots: string[];
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
  lessons_learned?: string;
  screenshots?: string[];
  status: TradeStatus;
  account_id?: string | null;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export interface Backtest {
  id: string;
  user_id: string;
  strategy_name: string;
  symbol: string;
  market_type: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  final_balance: number | null;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number | null;
  profit_factor: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  avg_rr: number | null;
  notes: string | null;
  trade_log: Json;
  equity_curve: Json;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: "dark" | "light" | "system";
  onboarding_completed: boolean;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ConnectionStage {
  label: string;
  status: "pending" | "active" | "done" | "error";
}
