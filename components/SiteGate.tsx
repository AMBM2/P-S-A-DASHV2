"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import { LockedScreen } from "@/components/LockedScreen";

// Site-wide gate: when settings.lockdown is ON, only authorized admins
// (verified via the bot's RBAC) see the app. Everyone else sees LockedScreen.
export function SiteGate({ children }: { children: ReactNode }) {
  const { settings, loading, session } = useStore();
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!settings.lockdown) {
      setGranted(true);
      return;
    }
    if (!session?.discordId) {
      setGranted(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discordId: session.discordId }),
          cache: "no-store",
        });
        const d = await r.json();
        if (active) setGranted((d.grants?.length ?? 0) > 0);
      } catch {
        if (active) setGranted(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [settings.lockdown, session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500">
        <span className="flex items-center gap-2 text-sm">
          <Lock size={14} className="text-gold-300" /> جارٍ التحميل...
        </span>
      </div>
    );
  }

  if (settings.lockdown && granted !== true) {
    return <LockedScreen />;
  }

  return <>{children}</>;
}