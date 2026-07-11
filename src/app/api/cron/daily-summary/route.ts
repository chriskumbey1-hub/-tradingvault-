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
    .select("symbol, direction, profit_loss, status")
    .eq("trade_date", today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalTrades = trades?.length || 0;
  const wins = trades?.filter((t) => t.status === "win").length || 0;
  const losses = trades?.filter((t) => t.status === "loss").length || 0;
  const netPnl = trades?.reduce((sum, t) => sum + (t.profit_loss || 0), 0) || 0;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;

  return NextResponse.json({
    date: today,
    totalTrades,
    wins,
    losses,
    netPnl,
    winRate,
    trades: trades || [],
  });
}
