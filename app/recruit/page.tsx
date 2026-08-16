"use client";

import { useState } from "react";
import {
  ClipboardList,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Check,
} from "lucide-react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { DEPARTMENTS, RANKS } from "@/lib/seed";
import { cn } from "@/lib/format";

export default function RecruitPage() {
  const [nameAr, setNameAr] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [unit, setUnit] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; error?: string }>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    setResult(null);
    if (!nameAr.trim()) {
      setResult({ ok: false, error: "يرجى تعبئة الاسم" });
      return;
    }
    if (!/^\d{15,20}$/.test(discordId.trim())) {
      setResult({ ok: false, error: "يرجى إدخال معرّف ديسكورد صحيح" });
      return;
    }
    if (!unit) {
      setResult({ ok: false, error: "يرجى اختيار الوحدة" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recruit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: nameAr.trim(),
          name: nameAr.trim(),
          discordId: discordId.trim(),
          unit,
          ranks: [...selected],
        }),
      });
      const data = await res.json();
      setResult({ ok: data.ok, error: data.error });
      if (data.ok) {
        setNameAr("");
        setDiscordId("");
        setUnit("");
        setSelected(new Set());
      }
    } catch {
      setResult({ ok: false, error: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <div className="flex items-center gap-3 border-b border-gold-400/15 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-300/40 bg-gold-400/10 text-gold-200">
            <UserPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">التجنيد — الكلية العسكرية</h1>
            <p className="text-sm text-zinc-400">قدّم طلبك للانضمام إلى الأمن العام. يُراجع من قبل مسؤولي التوظيف.</p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <Field label="الاسم الكامل">
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="الاسم الثلاثي"
              dir="rtl"
            />
          </Field>

          <Field label="Discord ID">
            <Input
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="مثال: 123456789012345678 (من الديسكورد: كليك يمين على اسمك → نسخ المعرّف)"
              dir="ltr"
              className="text-left"
            />
          </Field>

          <Field label="الوحدة">
            <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="">اختر الوحدة</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameAr}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <ClipboardList size={15} className="text-gold-300" />
                الرتب المطلوبة
              </span>
              <span className="text-xs text-zinc-400">
                المحددة: <span className="font-bold text-gold-200">{selected.size}</span>
              </span>
            </div>
            <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 scrollbar-thin sm:grid-cols-2">
              {RANKS.map((r) => {
                const active = selected.has(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 text-right transition-all",
                      active
                        ? "border-gold-300/70 bg-gold-400/15"
                        : "border-gold-400/15 bg-obsidian-900/50 hover:border-gold-400/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
                        active
                          ? "border-gold-300 bg-gold-300 text-obsidian-900"
                          : "border-zinc-600 text-transparent"
                      )}
                    >
                      <Check size={12} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{r.titleAr}</span>
                      <span className="block text-xs text-zinc-400">{r.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={submit}
            disabled={loading}
            className="mt-2 w-full py-3 text-base font-bold"
          >
            {loading ? <Loader2 size={18} className="ml-2 animate-spin" /> : <Send size={18} className="ml-2" />}
            تقديم الطلب
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
                    <div className="font-bold">تم استلام طلبك بنجاح</div>
                    <div className="text-xs text-zinc-300">سيتم مراجعته من قبل مسؤولي التوظيف وتتلقى إشعاراً عبر ديسكورد.</div>
                  </>
                ) : (
                  <div className="font-bold">فشل التقديم: {result.error}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}