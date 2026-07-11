"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { useUser } from "@/hooks/use-user";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user, loading } = useUser();
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          user={{
            name: user?.user_metadata?.name || user?.email?.split("@")[0],
            email: user?.email,
            avatar: user?.user_metadata?.avatar_url,
          }}
          onLogout={handleLogout}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
