"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Radio, Loader2, CheckCircle2, AlertTriangle, Users, Check } from "lucide-react";
import { Button, Card, Field, Input, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { RANKS } from "@/lib/seed";
import { cn } from "@/lib/format";

export default function FieldPage() {
  const { addAudit, officers } = useStore();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; count: number; error?: string }>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = imageUrl.trim();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const base = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(f);
    });
    setImageUrl(base);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!name.trim()) {
      setResult({ ok: false, count: 0, error: "يرجى تعبئة اسم السيناريو" });
      return;
    }
    if (selected.size === 0) {
      setResult({ ok: false, count: 0, error: "يرجى اختيار المشاركين من القسم أدناه" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          nameAr: name.trim(),
          image: imageUrl.trim() || null,
          participants: [...selected],
        }),
      });
      const data = await res.json();
      setResult({
        ok: data.ok,
        count: data.count ?? 0,
        error: data.error,
      });
      if (data.ok) addAudit("field", `إرسال تنبيه ميداني: ${name.trim()} (${data.count ?? 0} مشارك)`);
    } catch {
      setResult({ ok: false, count: 0, error: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  const participants = officers.filter((o) => o.discordId && o.status !== "discharged");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <div className="flex items-center gap-3 border-b border-gold-400/15 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-300/40 bg-gold-400/10 text-gold-200">
            <Radio size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">جدول الميدان</h1>
            <p className="text-sm text-zinc-400">اختيار المشاركين وتنبيههم عبر Discord برتبهم العسكرية</p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <Field label="اسم السيناريو">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: سيناريو حماية المنشآت الحيوية"
              dir="rtl"
            />
          </Field>

          <Field label="صورة السيناريو (رابط أو رفع)">
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... أو ارفع صورة"
                dir="ltr"
                className="text-left"
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="shrink-0">
                <ImageIcon size={16} className="ml-1" />
                رفع
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
            {preview && (
              <div className="mt-2 overflow-hidden rounded-lg border border-gold-300/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="معاينة" className="max-h-52 w-full object-cover" />
              </div>
            )}
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <Users size={15} className="text-gold-300" />
                المشاركون
              </span>
              <span className="text-xs text-zinc-400">
                المحددون: <span className="font-bold text-gold-200">{selected.size}</span>
              </span>
            </div>
            {participants.length === 0 ? (
              <EmptyState message="لا يوجد أفراد مسجلون — قم بمزامنة ديسكورد أولاً" />
            ) : (
              <div className="grid max-h-80 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2">
                {participants.map((o) => {
                  const rank = RANKS.find((r) => r.id === o.rankId);
                  const active = selected.has(o.discordId as string);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggle(o.discordId as string)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-2.5 text-right transition-all",
                        active
                          ? "border-gold-300/70 bg-gold-400/15"
                          : "border-gold-400/15 bg-obsidian-900/50 hover:border-gold-400/40"
                      )}
                    >
                      {o.discordAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`https://cdn.discordapp.com/avatars/${o.discordId}/${o.discordAvatar}.png?size=64`}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full border border-gold-400/30 object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-xs font-bold text-gold-300">
                          {(o.nameAr || o.name || "?").slice(0, 2)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{o.nameAr || o.name}</span>
                        <span className="block text-xs text-zinc-400">
                          {rank ? rank.titleAr : "—"} · <span className="font-mono text-gold-300/80">{o.badge}</span>
                        </span>
                      </span>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                          active ? "border-gold-300 bg-gold-300 text-obsidian-900" : "border-zinc-600 text-transparent"
                        )}
                      >
                        <Check size={12} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Button
            onClick={submit}
            disabled={loading || selected.size === 0}
            className="mt-2 w-full py-3 text-base font-bold"
          >
            {loading ? <Loader2 size={18} className="ml-2 animate-spin" /> : <Send size={18} className="ml-2" />}
            إرسال وتنبيه الميدان
          </Button>

          {result && (
            <div
              className={
                "flex items-start gap-3 rounded-lg border p-4 text-sm " +
                (result.ok
                  ? "border-gold-300/40 bg-gold-400/10 text-gold-100"
                  : "border-red-400/30 bg-red-500/10 text-red-200")
              }
            >
              {result.ok ? <CheckCircle2 size={20} className="mt-0.5 shrink-0" /> : <AlertTriangle size={20} className="mt-0.5 shrink-0" />}
              <div className="space-y-1">
                {result.ok ? (
                  <>
                    <div className="font-bold">تم إرسال تنبيه الميدان بنجاح</div>
                    <div className="text-xs text-zinc-300">
                      <span className="inline-flex items-center gap-1"><Users size={13} /> تم تنبيه {result.count} مشارك في قناة الميدان مع رتبهم العسكرية</span>
                    </div>
                  </>
                ) : (
                  <div className="font-bold">فشل التنبيه: {result.error}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}