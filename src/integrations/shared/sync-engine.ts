/**
 * Sync Engine — orchestrates broker synchronization
 *
 * Responsibilities:
 *  1. Fetch trades from broker via adapter
 *  2. Detect and skip duplicates (by broker_trade_id)
 *  3. Store raw imported trades
 *  4. Update broker connection status
 *  5. Write sync logs
 */

import { createClient } from "@supabase/supabase-js";
import { getAdapter } from "./adapter-factory";
import type {
  ProviderId,
  BrokerCredentials,
  BrokerTrade,
  SyncResult,
} from "./types";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getAdminClient() {
  if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

interface SyncContext {
  connectionId: string;
  userId: string;
  provider: ProviderId;
  encryptedCredentials: string;
  lastSync: string | null;
}

function decryptCredentials(encryptedJson: string): BrokerCredentials {
  // The credentials are stored encrypted with AES-256-CBC
  // We use the same decryption from broker-service.ts
  const crypto = require("crypto");
  const key = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (!key) throw new Error("ACCOUNT_ENCRYPTION_KEY is required");

  const keyHash = crypto.createHash("sha256").update(key).digest();
  const [ivHex, cipherHex] = encryptedJson.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", keyHash, iv);
  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted);
}

/**
 * Run a full sync for a single broker connection.
 */
export async function runSync(ctx: SyncContext): Promise<{
  success: boolean;
  error?: string;
  logId: string;
  tradesImported: number;
  tradesSkipped: number;
}> {
  const admin = getAdminClient();

  // Create sync log entry
  const { data: logEntry, error: logError } = await admin
    .from("sync_logs")
    .insert({
      connection_id: ctx.connectionId,
      user_id: ctx.userId,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (logError || !logEntry) {
    return { success: false, error: "Failed to create sync log", logId: "", tradesImported: 0, tradesSkipped: 0 };
  }

  const logId = logEntry.id;

  try {
    // Mark connection as syncing
    await admin
      .from("broker_connections")
      .update({ connection_status: "syncing", last_error: "" })
      .eq("id", ctx.connectionId);

    // Get adapter
    const adapter = getAdapter(ctx.provider);
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${ctx.provider}`);
    }

    // Decrypt credentials
    let credentials: BrokerCredentials;
    try {
      credentials = decryptCredentials(ctx.encryptedCredentials);
    } catch {
      throw new Error("Failed to decrypt broker credentials. Please reconnect.");
    }

    // Sync account info first
    const accountResult = await adapter.syncAccount(credentials);
    if (!accountResult.success) {
      throw new Error(accountResult.error || "Account sync failed");
    }

    // Sync trades
    const syncResult = await adapter.syncTrades(credentials, ctx.lastSync ?? undefined);

    let tradesImported = 0;
    let tradesSkipped = 0;

    if (syncResult.success && syncResult.trades.length > 0) {
      // Insert trades with duplicate detection
      for (const trade of syncResult.trades) {
        const { error: insertError } = await admin
          .from("imported_trades")
          .upsert(
            {
              user_id: ctx.userId,
              connection_id: ctx.connectionId,
              broker_trade_id: trade.brokerTradeId,
              broker_order_id: trade.brokerOrderId || "",
              symbol: trade.symbol,
              market_type: trade.marketType,
              direction: trade.direction,
              entry_price: trade.entryPrice,
              exit_price: trade.exitPrice,
              entry_time: trade.entryTime,
              exit_time: trade.exitTime,
              lot_size: trade.lotSize,
              profit_loss: trade.profitLoss,
              commission: trade.commission,
              swap: trade.swap,
              fees: trade.fees,
              stop_loss: trade.stopLoss,
              take_profit: trade.takeProfit,
              status: trade.status,
              magic_number: trade.magicNumber || 0,
              comment: trade.comment || "",
              merged: false,
            },
            {
              onConflict: "user_id,connection_id,broker_trade_id",
              ignoreDuplicates: false, // update if exists
            }
          );

        if (insertError) {
          // Duplicate — skip
          tradesSkipped++;
        } else {
          tradesImported++;
        }
      }
    }

    // Update connection with latest account info
    const accountInfo = syncResult.accountInfo || accountResult.accountInfo;
    if (accountInfo) {
      await admin
        .from("broker_connections")
        .update({
          connection_status: "connected",
          current_balance: accountInfo.balance,
          equity: accountInfo.equity,
          margin: accountInfo.margin,
          free_margin: accountInfo.freeMargin,
          floating_pnl: accountInfo.floatingPnl,
          open_positions: accountInfo.openPositions,
          currency: accountInfo.currency,
          leverage: accountInfo.leverage,
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.connectionId);
    }

    // Update sync log
    await admin
      .from("sync_logs")
      .update({
        status: "success",
        message: `Synced ${tradesImported} trades, skipped ${tradesSkipped} duplicates`,
        trades_imported: tradesImported,
        trades_skipped: tradesSkipped,
        balance_after: accountInfo?.balance,
        equity_after: accountInfo?.equity,
        finished_at: new Date().toISOString(),
      })
      .eq("id", logId);

    return {
      success: true,
      logId,
      tradesImported,
      tradesSkipped,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Sync failed";

    // Mark connection as error
    await admin
      .from("broker_connections")
      .update({
        connection_status: "error",
        last_error: errorMsg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ctx.connectionId);

    // Update sync log
    await admin
      .from("sync_logs")
      .update({
        status: "failed",
        message: errorMsg,
        finished_at: new Date().toISOString(),
      })
      .eq("id", logId);

    return { success: false, error: errorMsg, logId, tradesImported: 0, tradesSkipped: 0 };
  }
}

/**
 * Run sync for ALL active connections (called by cron).
 */
export async function runGlobalSync(): Promise<{
  synced: number;
  failed: number;
  results: Array<{ connectionId: string; provider: string; success: boolean; error?: string }>;
}> {
  const admin = getAdminClient();

  // Get all connected broker connections that need syncing
  const { data: connections } = await admin
    .from("broker_connections")
    .select("id, user_id, provider, encrypted_credentials, last_sync, sync_interval_minutes")
    .eq("connection_status", "connected");

  if (!connections || connections.length === 0) {
    return { synced: 0, failed: 0, results: [] };
  }

  const now = Date.now();
  const results: Array<{ connectionId: string; provider: string; success: boolean; error?: string }> = [];
  let synced = 0;
  let failed = 0;

  for (const conn of connections) {
    // Check if enough time has passed since last sync
    if (conn.last_sync) {
      const lastSyncMs = new Date(conn.last_sync).getTime();
      const intervalMs = (conn.sync_interval_minutes || 5) * 60 * 1000;
      if (now - lastSyncMs < intervalMs) continue;
    }

    const result = await runSync({
      connectionId: conn.id,
      userId: conn.user_id,
      provider: conn.provider as ProviderId,
      encryptedCredentials: conn.encrypted_credentials,
      lastSync: conn.last_sync,
    });

    results.push({
      connectionId: conn.id,
      provider: conn.provider,
      success: result.success,
      error: result.error,
    });

    if (result.success) synced++;
    else failed++;
  }

  return { synced, failed, results };
}
