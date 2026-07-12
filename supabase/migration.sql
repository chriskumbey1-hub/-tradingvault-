-- TradeVault Migration: Add missing columns, goals, backtesting, lessons learned
-- Run this in Supabase SQL Editor

-- 1. Add lessons_learned column to trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- 2. Rename screenshot_url to screenshots and make it an array
ALTER TABLE trades DROP COLUMN IF EXISTS screenshot_url;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshots TEXT[] DEFAULT '{}';

-- 3. Make account_id nullable (for manual trades without a linked account)
ALTER TABLE trades ALTER COLUMN account_id DROP NOT NULL;

-- 4. Add risk_reward calculation trigger
CREATE OR REPLACE FUNCTION calculate_risk_reward()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stop_loss IS NOT NULL AND NEW.take_profit IS NOT NULL AND NEW.entry_price IS NOT NULL THEN
    IF NEW.direction = 'long' THEN
      NEW.risk_reward := ABS(NEW.take_profit - NEW.entry_price) / ABS(NEW.entry_price - NEW.stop_loss);
    ELSE
      NEW.risk_reward := ABS(NEW.entry_price - NEW.take_profit) / ABS(NEW.stop_loss - NEW.entry_price);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_risk_reward ON trades;
CREATE TRIGGER trigger_calculate_risk_reward
  BEFORE INSERT OR UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION calculate_risk_reward();

-- 5. Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('monthly_pnl', 'win_rate', 'trade_count', 'custom')),
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT DEFAULT '',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- 6. Backtesting Table
CREATE TABLE IF NOT EXISTS backtests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  strategy_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  market_type TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1H',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 10000,
  final_balance DECIMAL(15,2),
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  profit_factor DECIMAL(10,4),
  max_drawdown DECIMAL(5,2),
  sharpe_ratio DECIMAL(10,4),
  avg_rr DECIMAL(10,4),
  notes TEXT,
  trade_log JSONB DEFAULT '[]',
  equity_curve JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own backtests" ON backtests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own backtests" ON backtests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own backtests" ON backtests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own backtests" ON backtests FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_backtests_user_id ON backtests(user_id);

-- 7. User preferences table (for theme, onboarding state, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  onboarding_completed BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- 8. Function to create user preferences on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 9. Add RLS policy for user_preferences delete
CREATE POLICY "Users can delete their own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);
