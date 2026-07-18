import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { tradeIds, connectionId, strategy } = body;

    // Get imported trades to merge
    let query = supabase
      .from("imported_trades")
      .select("*")
      .eq("user_id", user.id)
      .eq("merged", false);

    if (tradeIds && tradeIds.length > 0) {
      query = query.in("id", tradeIds);
    } else if (connectionId) {
      query = query.eq("connection_id", connectionId);
    } else {
      return NextResponse.json({ error: "tradeIds or connectionId required" }, { status: 400 });
    }

    const { data: importedTrades, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!importedTrades || importedTrades.length === 0) {
      return NextResponse.json({ error: "No unmerged trades found" }, { status: 404 });
    }

    let merged = 0;
    let skipped = 0;

    for (const imp of importedTrades) {
      // Determine status from P&L
      let status = "breakeven";
      if (imp.profit_loss > 0) status = "win";
      else if (imp.profit_loss < 0) status = "loss";

      // Calculate risk_reward if stop_loss and take_profit exist
      let riskReward = null;
      if (imp.entry_price && imp.stop_loss && imp.take_profit && imp.direction) {
        const entry = Number(imp.entry_price);
        const sl = Number(imp.stop_loss);
        const tp = Number(imp.take_profit);
        if (sl > 0 && tp > 0) {
          const risk = Math.abs(entry - sl);
          const reward = Math.abs(tp - entry);
          riskReward = risk > 0 ? reward / risk : null;
        }
      }

      // Insert into trades table
      const { data: newTrade, error: insertError } = await supabase
        .from("trades")
        .insert({
          user_id: user.id,
          account_id: null,
          trade_date: imp.entry_time ? new Date(imp.entry_time).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          symbol: imp.symbol,
          market_type: imp.market_type || "forex",
          direction: imp.direction,
          entry_price: imp.entry_price,
          exit_price: imp.exit_price,
          stop_loss: imp.stop_loss || 0,
          take_profit: imp.take_profit || 0,
          lot_size: imp.lot_size || 0,
          risk_amount: 0,
          profit_loss: imp.profit_loss || 0,
          commission: imp.commission || 0,
          fees: imp.fees || 0,
          risk_reward: riskReward,
          strategy: strategy || `Imported (${imp.connection_id?.slice(0, 8)})`,
          setup: "imported",
          tags: ["imported", imp.connection_id?.slice(0, 8) || ""],
          emotion: "",
          confidence_level: 5,
          notes: imp.comment || `Broker Trade ID: ${imp.broker_trade_id}`,
          lessons_learned: "",
          screenshots: [],
          status,
        })
        .select("id")
        .single();

      if (insertError) {
        skipped++;
        continue;
      }

      // Mark as merged
      await supabase
        .from("imported_trades")
        .update({
          merged: true,
          merged_trade_id: newTrade.id,
        })
        .eq("id", imp.id);

      merged++;
    }

    return NextResponse.json({
      success: true,
      merged,
      skipped,
      total: importedTrades.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Merge failed" },
      { status: 500 }
    );
  }
}
