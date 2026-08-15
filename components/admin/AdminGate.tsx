"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { getMasterKey, meetsPolicy, setAuthed } from "@/lib/security";

const POLICY = {
  min: 24,
  lower: /[a-z]/,
  upper: /[A-Z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
};

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cooldown > 0 || checking) return;

    const attempt = key;
    setChecking(true);
    // simulate a short verification delay for realism
    setTimeout(() => {
      const valid = attempt === getMasterKey() && meetsPolicy(attempt);
      if (valid) {
        setAuthed(true);
        onUnlock();
      } else {
        const next = attempts + 1;
        setAttempts(next);
        setError(
          next >= 3
            ? "تم حظر المحاولة مؤقتاً — انتظر قبل إعادة المحاولة"
            : "مفتاح الوصول غير صحيح"
        );
        setKey("");
        if (next >= 3) setCooldown(15);
        else setCooldown(8);
      }
      setChecking(false);
    }, 600);
  };

  const locked = cooldown > 0;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-strong gold-shimmer relative w-full max-w-md overflow-hidden rounded-3xl p-8"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-gold-400/10 blur-3xl" />

        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-gold-400/30 bg-gold-400/5 backdrop-blur-md shadow-[0_0_25px_rgba(217,180,91,0.3)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/psa-logo.png"
              alt="PSA"
              className="relative h-16 w-16 rounded-full object-contain"
              style={{ filter: "drop-shadow(0 0 12px rgba(217,180,91,0.35))" }}
            />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold gold-text">المنطقة المحمية</h2>
            <p className="mt-1 text-sm text-zinc-400">
              أدخل مفتاح الوصول السري (24 حرفاً على الأقل) للدخول إلى لوحة التحكم
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Lock size={16} className="absolute top-1/2 -translate-y-1/2 text-gold-400/70 ltr:left-3 rtl:right-3" />
            <input
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="••••••••••••••••••••••••"
              dir="ltr"
              disabled={locked}
              autoFocus
              className="w-full rounded-xl border border-gold-400/30 bg-obsidian-900/70 py-3 pl-10 pr-12 text-left font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/20 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-gold-300 ltr:right-3 rtl:left-3"
              tabIndex={-1}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-gold-400/70" />
              {locked
                ? `مهلة الانتظار: ${cooldown} ثانية`
                : `المحاولات الفاشلة: ${attempts}`}
            </span>
            <span className="font-mono text-zinc-600">
              {key.length}/24+
            </span>
          </div>

          <button
            type="submit"
            disabled={locked || checking}
            className="gold-shimmer flex w-full items-center justify-center gap-2 rounded-xl border border-gold-400/60 bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 px-4 py-3 text-sm font-bold text-black shadow-[0_0_22px_rgba(217,180,91,0.35)] transition-all hover:from-gold-200 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            {checking ? "جارٍ التحقق..." : "دخول آمن"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
          يتطلب مفتاح الوصول: 24 حرفاً على الأقل، أحرف كبيرة وصغيرة، أرقام، ورموز خاصة
        </p>
      </motion.div>
    </div>
  );
}
