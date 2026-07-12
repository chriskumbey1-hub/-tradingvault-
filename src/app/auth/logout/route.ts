import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Sign out even if Supabase call fails
  }
  return NextResponse.redirect(new URL("/auth/login", request.url));
}

export async function GET() {
  return NextResponse.json({ error: "Use POST to logout" }, { status: 405 });
}
