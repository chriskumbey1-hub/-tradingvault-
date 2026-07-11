export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      trading_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_name: string;
          broker_name: string;
          account_type: string;
          initial_balance: number;
          current_balance: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_name: string;
          broker_name: string;
          account_type?: string;
          initial_balance?: number;
          current_balance?: number;
          currency?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_name?: string;
          broker_name?: string;
          account_type?: string;
          initial_balance?: number;
          current_balance?: number;
          currency?: string;
          created_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          trade_date: string;
          symbol: string;
          market_type: string;
          direction: string;
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
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          trade_date: string;
          symbol: string;
          market_type: string;
          direction: string;
          entry_price: number;
          exit_price?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          lot_size: number;
          risk_amount: number;
          profit_loss?: number | null;
          commission?: number;
          fees?: number;
          risk_reward?: number | null;
          strategy?: string | null;
          setup?: string | null;
          tags?: string[];
          emotion?: string | null;
          confidence_level?: number | null;
          notes?: string | null;
          screenshot_url?: string | null;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          trade_date?: string;
          symbol?: string;
          market_type?: string;
          direction?: string;
          entry_price?: number;
          exit_price?: number | null;
          stop_loss?: number | null;
          take_profit?: number | null;
          lot_size?: number;
          risk_amount?: number;
          profit_loss?: number | null;
          commission?: number;
          fees?: number;
          risk_reward?: number | null;
          strategy?: string | null;
          setup?: string | null;
          tags?: string[];
          emotion?: string | null;
          confidence_level?: number | null;
          notes?: string | null;
          screenshot_url?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          strategy_name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          strategy_name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          strategy_name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
