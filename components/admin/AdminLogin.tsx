"use client";

import { useState } from "react";
import { LogIn, Loader2, ShieldCheck, MessageSquareText, Lock, Fingerprint } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, Card } from "@/components/ui";

export function AdminLogin() {
  const { login } = useStore();
  const [step, setStep] = useState<"id" | "code">("id");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentVia, setSentVia] = useState<"dm" | "channel" | null>(null);

  const requestCode = async () => {
    setBusy(true);
    setError("");
    setSentVia(null);
    try {
      const r = await fetch("/api/login/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim() }),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error || "تعذر إرسال الرمز");
      } else {
        setSentVia(d.via === "channel" ? "channel" : "dm");
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
        body: JSON.stringify({ userId: userId.trim(), code }),
      });
      const d = await r.json();
      if (!d.ok) {
        setError(d.error || "الرمز غير صحيح");
      } else {
        login(userId.trim(), d.officer || null);
      }
    } catch {
      setError("تعذر الوصول للبوت");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl justify-center px-4 py-10">
      <Card className="relative w-full max-w-md overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />

        <div className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/10">
              <ShieldCheck size={22} className="text-gold-300" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold gold-text">دخول لوحة التحكم</h2>
              <p className="text-xs text-zinc-500">بوابة الأمن العام</p>
            </div>
          </div>

          {step === "id" ? (
            <>
              <p className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
                <Fingerprint size={15} className="text-gold-300" />
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
                <MessageSquareText size={15} className="text-gold-300" />
                {sentVia === "channel"
                  ? "أُرسل الرمز في قناة السيرفر (منشن لك) — أدخل الرمز."
                  : "وصلتك رسالة خاصة من البوت — أدخل الرمز."}
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
                  {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <Lock size={16} className="ml-2" />}
                  دخول
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}