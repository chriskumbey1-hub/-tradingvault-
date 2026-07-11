import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { syncAccount } from "@/lib/broker-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action, data: actionData } = body;

  if (action === "sync") {
    const account = await supabase
      .from("trading_accounts")
      .select("platform, connection_status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (account.error || !account.data) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const syncResult = await syncAccount(id, account.data.platform);

    const { error } = await supabase
      .from("trading_accounts")
      .update({
        last_sync: syncResult.lastSync,
        connection_status: syncResult.success ? "connected" : "error",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: syncResult.success, lastSync: syncResult.lastSync });
  }

  if (action === "reconnect") {
    const { error } = await supabase
      .from("trading_accounts")
      .update({ connection_status: "connected", last_sync: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "disconnect") {
    const { error } = await supabase
      .from("trading_accounts")
      .update({ connection_status: "disconnected" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const updateData: Record<string, unknown> = {};
  if (actionData?.account_name) updateData.account_name = actionData.account_name;
  if (actionData?.broker_name) updateData.broker_name = actionData.broker_name;
  if (actionData?.server_name) updateData.server_name = actionData.server_name;

  const { error } = await supabase
    .from("trading_accounts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const deleteTrades = url.searchParams.get("deleteTrades") === "true";

  if (deleteTrades) {
    await supabase
      .from("trades")
      .delete()
      .eq("account_id", id)
      .eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("trading_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
