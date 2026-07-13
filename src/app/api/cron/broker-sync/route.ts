import { NextResponse } from "next/server";
import { runGlobalSync } from "@/integrations/shared/sync-engine";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runGlobalSync();

    return NextResponse.json({
      message: `Sync complete: ${result.synced} succeeded, ${result.failed} failed`,
      ...result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Global sync failed" },
      { status: 500 }
    );
  }
}
