"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, Loader2, ShieldCheck, MessageSquareText, Lock, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login } = useStore();
  const [step, setStep] = useState<"id" | "code">("id");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("id");
    setUserId("");
    setCode("");
    setError("");
  };

  const close = () => {
    onClose();
    reset();
  };

  const requestCode = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error || "تعذر إرسال الرمز");
      } else {
        setStep("code");
      }
    } catch {
      setError("تعذر الوصول للبوت");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error || "الرمز غير صحيح");
      } else {
        login(userId.trim(), d.officer || null);
        close();
      }
    } catch {
      setError("تعذر الوصول للبوت");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />

          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 12, opacity: 0 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gold-300/40 bg-obsidian-900/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

            <button
              onClick={close}
              className="absolute right-3 top-3 z-10 rounded-full border border-gold-400/30 bg-black/40 p-1.5 text-zinc-300 transition-colors hover:text-gold-200"
              aria-label="إغلاق"
            >
              <X size={15} />
            </button>

            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/10">
                  <ShieldCheck size={22} className="text-gold-300" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold gold-text">تسجيل الدخول</h2>
                  <p className="text-xs text-zinc-500">بوابة الأمن العام</p>
                </div>
              </div>

              {step === "id" ? (
                <>
                  <p className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
                    <MessageSquareText size={15} className="text-gold-300" />
                    أدخل معرّف ديسكورد الخاص بك وسيصلك رمز في الخاص.
                  </p>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !busy && requestCode()}
                    placeholder="USER ID"
                    dir="ltr"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-gold-400/70"
                  />
                  {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
                  <Button className="mt-4 w-full" onClick={requestCode} disabled={busy || !userId.trim()}>
                    {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <LogIn size={16} className="ml-2" />}
                    إرسال الرمز إلى الخاص
                  </Button>
                </>
              ) : (
                <>
                  <p className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
                    <Lock size={15} className="text-gold-300" />
                    أدخل الرمز الذي وصلتك في رسالة خاصة من البوت.
                  </p>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !busy && verify()}
                    placeholder="000000"
                    dir="ltr"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-lg border border-gold-400/25 bg-obsidian-900/70 px-3 py-2.5 text-center font-mono text-xl tracking-[0.4em] text-zinc-100 outline-none focus:border-gold-400/70"
                  />
                  {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" onClick={() => setStep("id")}>
                      تغيير المعرف
                    </Button>
                    <Button className="flex-1" onClick={verify} disabled={busy || code.length < 6}>
                      {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <LogIn size={16} className="ml-2" />}
                      دخول
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}