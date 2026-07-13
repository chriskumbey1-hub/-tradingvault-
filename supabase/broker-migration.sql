-- TradeVault Phase 2: Broker Integration Migration
-- Run after the base schema migration

-- ============================================================
-- 1. broker_connections — stores linked broker accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                    -- mt5, mt4, ctrader, binance, bybit, oanda, etc.
  broker_name TEXT NOT NULL DEFAULT '',       -- display name e.g. "IC Markets", "FTMO"
  account_number TEXT NOT NULL DEFAULT '',    -- broker account / login id
  server TEXT DEFAULT '',                     -- broker server name
  account_name TEXT DEFAULT '',               -- user-given alias
  account_type TEXT DEFAULT 'live' CHECK (account_type IN ('live', 'demo', 'prop', 'paper')),
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'syncing', 'error', 'expired')),
  encrypted_credentials TEXT DEFAULT '',      -- AES-256-CBC encrypted JSON of provider-specific secrets
  access_token TEXT DEFAULT '',               -- encrypted OAuth/API access token
  refresh_token TEXT DEFAULT '',              -- encrypted OAuth refresh token
  token_expires_at TIMESTAMPTZ,
  currency TEXT DEFAULT 'USD',
  leverage INTEGER DEFAULT 100,
  current_balance DECIMAL(15,2) DEFAULT 0,
  equity DECIMAL(15,2) DEFAULT 0,
  margin DECIMAL(15,2) DEFAULT 0,
  free_margin DECIMAL(15,2) DEFAULT 0,
  floating_pnl DECIMAL(15,2) DEFAULT 0,
  open_positions INTEGER DEFAULT 0,
  last_sync TIMESTAMPTZ,
  last_error TEXT DEFAULT '',
  sync_interval_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broker_connections_user_id ON broker_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_connections_provider ON broker_connections(provider);
CREATE INDEX IF NOT EXISTS idx_broker_connections_status ON broker_connections(connection_status);
CREATE INDEX IF NOT EXISTS idx_broker_connections_last_sync ON broker_connections(last_sync);

-- RLS
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broker connections"
  ON broker_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own broker connections"
  ON broker_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own broker connections"
  ON broker_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own broker connections"
  ON broker_connections FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 2. sync_logs — audit trail for every sync attempt
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES broker_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'partial')),
  message TEXT DEFAULT '',
  trades_imported INTEGER DEFAULT 0,
  trades_updated INTEGER DEFAULT 0,
  trades_skipped INTEGER DEFAULT 0,
  balance_before DECIMAL(15,2),
  balance_after DECIMAL(15,2),
  equity_after DECIMAL(15,2),
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_connection_id ON sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);

-- RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
  ON sync_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs"
  ON sync_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update sync logs"
  ON sync_logs FOR UPDATE USING (true);

-- ============================================================
-- 3. imported_trades — raw broker trades before merge
-- ============================================================
CREATE TABLE IF NOT EXISTS imported_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES broker_connections(id) ON DELETE CASCADE,

  -- dedup key: unique per provider
  broker_trade_id TEXT NOT NULL DEFAULT '',   -- ticket / order id from broker
  broker_order_id TEXT DEFAULT '',            -- order id (may differ from trade id)

  -- trade data
  symbol TEXT NOT NULL,
  market_type TEXT DEFAULT 'forex',
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  entry_time TIMESTAMPTZ,
  exit_time TIMESTAMPTZ,
  lot_size DECIMAL(10,4),
  profit_loss DECIMAL(15,2) DEFAULT 0,
  commission DECIMAL(15,2) DEFAULT 0,
  swap DECIMAL(15,2) DEFAULT 0,
  fees DECIMAL(15,2) DEFAULT 0,
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  status TEXT DEFAULT 'closed' CHECK (status IN ('open', 'closed', 'cancelled')),
  magic_number INTEGER DEFAULT 0,
  comment TEXT DEFAULT '',

  -- merge state
  merged BOOLEAN DEFAULT false,
  merged_trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- prevent duplicates: one trade per broker per provider trade id
  UNIQUE(user_id, connection_id, broker_trade_id)
);

CREATE INDEX IF NOT EXISTS idx_imported_trades_user_id ON imported_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_imported_trades_connection_id ON imported_trades(connection_id);
CREATE INDEX IF NOT EXISTS idx_imported_trades_merged ON imported_trades(merged);
CREATE INDEX IF NOT EXISTS idx_imported_trades_broker_trade_id ON imported_trades(broker_trade_id);
CREATE INDEX IF NOT EXISTS idx_imported_trades_symbol ON imported_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_imported_trades_entry_time ON imported_trades(entry_time);

-- RLS
ALTER TABLE imported_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imported trades"
  ON imported_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own imported trades"
  ON imported_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own imported trades"
  ON imported_trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own imported trades"
  ON imported_trades FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. Add account_type column to trading_accounts if missing
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trading_accounts' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE trading_accounts ADD COLUMN account_type TEXT DEFAULT 'live';
  END IF;
END $$;
