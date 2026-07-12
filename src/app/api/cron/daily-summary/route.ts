import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split("T")[0];

  const { data: trades, error } = await supabase
    .from("trades")
    .select("user_id, profit_loss, status")
    .eq("trade_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userStats: Record<string, { trades: number; wins: number; losses: number; netPnl: number }> = {};

  (trades || []).forEach((t) => {
    const uid = t.user_id;
    if (!userStats[uid]) {
      userStats[uid] = { trades: 0, wins: 0, losses: 0, netPnl: 0 };
    }
    userStats[uid].trades++;
    if (t.status === "win") userStats[uid].wins++;
    if (t.status === "loss") userStats[uid].losses++;
    userStats[uid].netPnl += t.profit_loss || 0;
  });

  const summaries = Object.entries(userStats).map(([userId, stats]) => ({
    userId,
    totalTrades: stats.trades,
    wins: stats.wins,
    losses: stats.losses,
    netPnl: Math.round(stats.netPnl * 100) / 100,
    winRate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 100) : 0,
  }));

  return NextResponse.json({
    date: today,
    totalUsers: summaries.length,
    totalTrades: trades?.length || 0,
    summaries,
  });
}
