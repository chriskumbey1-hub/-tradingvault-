import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function getAdminClient() {
  if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY required");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

export async function POST(request: Request) {
  try {
    // Verify bearer token
    const authHeader = request.headers.get("authorization");
    const apiToken = process.env.TRADEVAULT_API_TOKEN;
    if (!apiToken || authHeader !== `Bearer ${apiToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, accountInfo, trades, positions, syncedAt } = body;

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    }

    const admin = getAdminClient();

    // Verify connection exists
    const { data: connection } = await admin
      .from("broker_connections")
      .select("id, user_id")
      .eq("id", connectionId)
      .single();

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Create sync log
    const { data: logEntry } = await admin
      .from("sync_logs")
      .insert({
        connection_id: connectionId,
        user_id: connection.user_id,
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    let tradesImported = 0;
    let tradesSkipped = 0;

    // Insert trades with dedup
    if (trades && trades.length > 0) {
      for (const trade of trades) {
        const { error } = await admin.from("imported_trades").upsert(
          {
            user_id: connection.user_id,
            connection_id: connectionId,
            broker_trade_id: trade.brokerTradeId || "",
            broker_order_id: trade.brokerOrderId || "",
            symbol: trade.symbol,
            market_type: trade.marketType || "forex",
            direction: trade.direction,
            entry_price: trade.entryPrice,
            exit_price: trade.exitPrice,
            entry_time: trade.entryTime,
            exit_time: trade.exitTime,
            lot_size: trade.lotSize,
            profit_loss: trade.profitLoss || 0,
            commission: trade.commission || 0,
            swap: trade.swap || 0,
            fees: trade.fees || 0,
            stop_loss: trade.stopLoss,
            take_profit: trade.takeProfit,
            status: trade.status || "closed",
            magic_number: trade.magicNumber || 0,
            comment: trade.comment || "",
            merged: false,
          },
          { onConflict: "user_id,connection_id,broker_trade_id", ignoreDuplicates: false }
        );

        if (error) tradesSkipped++;
        else tradesImported++;
      }
    }

    // Update connection
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
          last_sync: syncedAt || new Date().toISOString(),
          last_error: "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId);
    }

    // Update sync log
    if (logEntry) {
      await admin
        .from("sync_logs")
        .update({
          status: "success",
          message: `Pushed ${tradesImported} trades, skipped ${tradesSkipped}`,
          trades_imported: tradesImported,
          trades_skipped: tradesSkipped,
          balance_after: accountInfo?.balance,
          equity_after: accountInfo?.equity,
          finished_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return NextResponse.json({
      success: true,
      tradesImported,
      tradesSkipped,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Push failed" },
      { status: 500 }
    );
  }
}
