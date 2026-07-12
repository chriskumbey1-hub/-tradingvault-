import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { encryptPassword, connectToBroker } from "@/lib/broker-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("trading_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { platform, credentials, accountName, accountType, currency } = body;

  let connectionResult;
  try {
    connectionResult = await connectToBroker(platform, credentials);
  } catch {
    return NextResponse.json({ error: "Failed to connect to broker. Please try again." }, { status: 500 });
  }

  if (!connectionResult.success) {
    return NextResponse.json({ error: connectionResult.error }, { status: 400 });
  }

  const accountInfo = connectionResult.accountInfo!;
  const encryptedPwd = credentials.password ? encryptPassword(credentials.password) : "";

  const accountData = {
    user_id: user.id,
    account_name: accountName || `${platform.toUpperCase()} Account`,
    broker_name: credentials.server || accountName || platform.toUpperCase(),
    account_type: accountType || "live",
    platform,
    server_name: credentials.server || accountInfo.server,
    login_id: credentials.loginId || credentials.login || "",
    encrypted_password: encryptedPwd,
    connection_status: "connected",
    last_sync: new Date().toISOString(),
    initial_balance: accountInfo.balance,
    current_balance: accountInfo.balance,
    equity: accountInfo.equity,
    margin: accountInfo.margin,
    free_margin: accountInfo.freeMargin,
    leverage: accountInfo.leverage,
    currency: accountInfo.currency,
    open_positions: 0,
    account_number: credentials.loginId || credentials.login || "",
  };

  const { data, error } = await supabase
    .from("trading_accounts")
    .insert(accountData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
