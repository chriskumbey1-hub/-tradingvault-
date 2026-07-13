import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAdapter } from "@/integrations/shared/adapter-factory";
import { runSync } from "@/integrations/shared/sync-engine";
import type { ProviderId } from "@/integrations/shared/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("broker_connections")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action, data: actionData } = body;

    // Verify ownership
    const { data: connection } = await supabase
      .from("broker_connections")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!connection) return NextResponse.json({ error: "Connection not found" }, { status: 404 });

    switch (action) {
      case "sync": {
        const result = await runSync({
          connectionId: id,
          userId: user.id,
          provider: connection.provider as ProviderId,
          encryptedCredentials: connection.encrypted_credentials,
          lastSync: connection.last_sync,
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Re-fetch the updated connection
        const { data: updated } = await supabase
          .from("broker_connections")
          .select("*")
          .eq("id", id)
          .single();

        return NextResponse.json({ success: true, connection: updated, logId: result.logId });
      }

      case "health": {
        const adapter = getAdapter(connection.provider as ProviderId);
        if (!adapter) {
          return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
        }

        // Health check would need decrypted credentials — skip for now
        return NextResponse.json({
          healthy: connection.connection_status === "connected",
          status: connection.connection_status,
          lastSync: connection.last_sync,
        });
      }

      case "disconnect": {
        const { error } = await supabase
          .from("broker_connections")
          .update({
            connection_status: "disconnected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "reconnect": {
        const { error } = await supabase
          .from("broker_connections")
          .update({
            connection_status: "connected",
            last_error: "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "update": {
        const { error } = await supabase
          .from("broker_connections")
          .update({
            account_name: actionData?.account_name,
            broker_name: actionData?.broker_name,
            sync_interval_minutes: actionData?.sync_interval_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Delete imported trades first
    await supabase
      .from("imported_trades")
      .delete()
      .eq("connection_id", id)
      .eq("user_id", user.id);

    // Delete sync logs
    await supabase
      .from("sync_logs")
      .delete()
      .eq("connection_id", id)
      .eq("user_id", user.id);

    // Delete connection
    const { error } = await supabase
      .from("broker_connections")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
