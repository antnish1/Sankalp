"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      className={compact ? "rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-60" : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"}
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
    >
      {isSigningOut ? "Signing out..." : "Logout"}
    </button>
  );
}
