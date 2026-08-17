"use client";

import { useEffect, useState } from "react";
import { Send, Loader2, CheckCircle2, AlertTriangle, Radio, ShieldAlert } from "lucide-react";
import { Button, Card, Field, Select } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import type { Grant } from "@/lib/types";

const FIELD_GRANTS: Grant[] = ["master", "executive", "field"];

// Fixed scenario locations — the dispatch payload only accepts these.
const LOCATIONS = [
  "مصنع البقر",
  "مصنع الدجاج",
  "مصنع القوارب",
  "المترو الاول",
  "المترو الثاني",
  "المترو بهامس",
  "مترو المطار",
  "مترو المدينة",
  "الاستديو",
  "الدسكو",
  "ملاهي داش",
  "الخياط",
  "المسرح",
  "قراج السيارات",
  "المجوهرات",
  "البيت المهجور",
  "بيق ماركت",
  "ميني ماركت فقط",
];

export default function FieldPage() {
  const { session } = useStore();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [resolving, setResolving] = useState(true);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; text?: string; error?: string }>(null);

  useEffect(() => {
    if (!session) {
      setResolving(false);
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
        if (active) setGrants(d.grants || []);
      } catch {
        // default: no grants
      } finally {
        if (active) setResolving(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  const allowed = grants.some((g) => FIELD_GRANTS.includes(g));

  const submit = async () => {
    setResult(null);
    if (!location) {
      setResult({ ok: false, error: "يرجى اختيار موقع السيناريو" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });
      const data = await res.json();
      setResult({
        ok: data.ok,
        text: data.ok ? `تم إرسال تنبيه الميدان (${location}) إلى قناة الميدان` : undefined,
        error: data.error,
      });
      if (data.ok) setLocation("");
    } catch {
      setResult({ ok: false, error: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <AdminLogin />;
  }

  if (resolving) {
    return (
      <div className="mx-auto flex w-full max-w-3xl justify-center px-4 py-10">
        <div className="glass flex items-center justify-center gap-2 rounded-2xl p-14 text-zinc-400">
          <Loader2 size={20} className="animate-spin" /> جارٍ التحقق من الصلاحيات...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="glass flex flex-col items-center gap-4 rounded-2xl p-14 text-center">
          <ShieldAlert size={36} className="text-rose-300" />
          <div className="text-lg font-bold text-white">لا تملك صلاحية قيادة الميدان</div>
          <div className="text-sm text-zinc-400">
            إرسال التنبيهات الميدانية متاح فقط لقيادة الميدان والقيادة العليا.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        <div className="flex items-center gap-3 border-b border-gold-400/15 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-300/40 bg-gold-400/10 text-gold-200">
            <Radio size={20} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">جدول الميدان — تنبيه الدوريات</h1>
            <p className="text-sm text-zinc-400">أدخل موقع السيناريو ويتم إرسال التنبيه المنسّق إلى قناة الميدان في ديسكورد</p>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <Field label="موقع السيناريو">
            <Select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setResult(null);
              }}
              dir="rtl"
            >
              <option value="">— اختر موقع السيناريو —</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>

          <Button onClick={submit} disabled={loading} className="w-full py-3 text-base font-bold">
            {loading ? <Loader2 size={18} className="ml-2 animate-spin" /> : <Send size={18} className="ml-2" />}
            إرسال تنبيه الميدان
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
              <div className="font-bold">{result.ok ? result.text : `فشل التنبيه: ${result.error}`}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}