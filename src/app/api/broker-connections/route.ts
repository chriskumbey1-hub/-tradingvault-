import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAdapter } from "@/integrations/shared/adapter-factory";
import type { ProviderId, BrokerCredentials } from "@/integrations/shared/types";

const crypto = require("crypto");

function encryptCredentials(credentials: BrokerCredentials): string {
  const key = process.env.ACCOUNT_ENCRYPTION_KEY;
  if (!key) throw new Error("ACCOUNT_ENCRYPTION_KEY is required");
  const keyHash = crypto.createHash("sha256").update(key).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyHash, iv);
  let encrypted = cipher.update(JSON.stringify(credentials), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("broker_connections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { provider, credentials, accountName, accountType, brokerName } = body;

    if (!provider || !credentials) {
      return NextResponse.json({ error: "Provider and credentials are required" }, { status: 400 });
    }

    const adapter = getAdapter(provider as ProviderId);
    if (!adapter) {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    // Test connection
    const connectResult = await adapter.connect(credentials);
    if (!connectResult.success) {
      return NextResponse.json({ error: connectResult.error }, { status: 400 });
    }

    // Encrypt credentials for storage
    const encryptedCreds = encryptCredentials(credentials);

    const accountInfo = connectResult.accountInfo;

    // Save connection to DB
    const { data, error } = await supabase
      .from("broker_connections")
      .insert({
        user_id: user.id,
        provider,
        broker_name: brokerName || adapter.displayName,
        account_name: accountName || `${adapter.displayName} Account`,
        account_number: accountInfo?.accountNumber || "",
        account_type: accountType || "live",
        server: accountInfo?.server || "",
        encrypted_credentials: encryptedCreds,
        connection_status: "connected",
        currency: accountInfo?.currency || "USD",
        leverage: accountInfo?.leverage || 100,
        current_balance: accountInfo?.balance || 0,
        equity: accountInfo?.equity || 0,
        margin: accountInfo?.margin || 0,
        free_margin: accountInfo?.freeMargin || 0,
        floating_pnl: accountInfo?.floatingPnl || 0,
        open_positions: accountInfo?.openPositions || 0,
        last_sync: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create connection" },
      { status: 500 }
    );
  }
}
