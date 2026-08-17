"use client";

import { Lock, ShieldCheck, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { AdminLogin } from "@/components/admin/AdminLogin";

// Full-screen lock shown to everyone except authorized admins when
// settings.lockdown is ON. Authorized admins authenticate here to enter.
export function LockedScreen() {
  const { session } = useStore();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-gold-400/25 bg-obsidian-900/60 p-8 text-center backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-32 -translate-x-1/2 rounded-full bg-gold-400/10 blur-3xl" />

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 gold-glow-strong">
            <Lock size={28} className="text-gold-300" />
          </div>
          <h1 className="font-display text-2xl font-bold gold-text">الموقع مقفل حالياً</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            الوصول مقصور على الإدارة المعتمدة فقط. أدخل بياناتك لفتح الدخول.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/5 px-3 py-1 text-[11px] text-zinc-400">
            <ShieldCheck size={12} className="text-gold-300" />
            بوابة الأمن العام
          </div>
        </div>

        {session ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-center text-sm text-rose-200">
            حسابك غير مصرح بالدخول في وضع الإغلاق.
          </div>
        ) : (
          <AdminLogin />
        )}
      </div>
    </div>
  );
}