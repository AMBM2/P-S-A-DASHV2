"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { Users, ShieldCheck, RefreshCw, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";

type RoleEntry = {
  id: string;
  name: string;
  position: number;
  rankId: string | null;
  rankAr: string | null;
  detected: "officer" | "enlisted" | null;
  category: "officer" | "enlisted" | null;
};

type RoleCategoriesData = {
  ok: boolean;
  guild?: string;
  officer?: string[];
  enlisted?: string[];
  roles?: RoleEntry[];
  error?: string;
};

// الفرز التلقائي حسب الرتب — maps Discord roles to OFICER / ENLISTED groups
// used when scanning the voice room during patrol dispatch.
export function RoleCategoriesManager() {
  const { session } = useStore();
  const [data, setData] = useState<RoleCategoriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/role-categories", {
        headers: { "x-bot-actor": session?.discordId || "" },
        cache: "no-store",
      });
      const d = await r.json();
      setData(d.ok ? d : { ok: false, error: d.error || "bad response" });
      if (!d.ok) setMsg({ ok: false, text: d.error || "تعذر جلب الإعدادات" });
    } catch {
      setData({ ok: false, error: "bot unreachable" });
      setMsg({ ok: false, text: "تعذر الاتصال بالبوت" });
    } finally {
      setLoading(false);
    }
  }, [session?.discordId]);

  useEffect(() => {
    load();
  }, [load]);

  const setCategory = async (roleId: string, category: "officer" | "enlisted" | "none") => {
    setBusy(roleId);
    setMsg(null);
    try {
      const r = await fetch("/api/role-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId,
          category: category === "none" ? null : category,
          actor: session?.discordId,
        }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تم الحفظ" : `فشل: ${d.error || "غير مصرح"}` });
      await load();
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(null);
    }
  };

  const syncAll = async () => {
    if (!confirm("تحديد كل الرتب العسكرية تلقائياً (القيادة والضباط = ضباط، الأفراد = أفراد)؟")) return;
    setBusy("sync");
    setMsg(null);
    try {
      const r = await fetch("/api/role-categories/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: session?.discordId }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? `تمت مزامنة ${d.added || 0} رتبة` : `فشل: ${d.error || "غير مصرح"}` });
      await load();
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(null);
    }
  };

  const roles = (data?.roles || [])
    .filter((r) => r.rankId || r.category)
    .sort((a, b) => b.position - a.position);

  const explicitOfficer = roles.filter((r) => r.category === "officer");
  const explicitEnlisted = roles.filter((r) => r.category === "enlisted");
  const uncategorized = roles.filter((r) => !r.category);

  const SegmentBtn = ({
    active,
    onClick,
    children,
    tone,
  }: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    tone: "rose" | "indigo" | "zinc";
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
        active
          ? tone === "rose"
            ? "bg-rose-500/25 text-rose-200"
            : tone === "indigo"
              ? "bg-indigo-500/25 text-indigo-200"
              : "bg-zinc-600/40 text-gray-600"
          : "bg-white/5 text-zinc-500 hover:text-gray-600"
      )}
    >
      {children}
    </button>
  );

  const RoleRow = ({ r }: { r: RoleEntry }) => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold-400/10 bg-obsidian-900/40 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-xs text-gray-700">{r.name}</span>
        {r.rankAr && (
          <Badge tone="gold">
            {r.rankAr} {r.rankId}
          </Badge>
        )}
        {r.detected && !r.category && (
          <span className="text-[10px] text-zinc-500">
            {r.detected === "officer" ? "مقترح: ضابط" : "مقترح: فرد"}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {busy === r.id ? (
          <Loader2 size={14} className="animate-spin text-gold-300" />
        ) : (
          <>
            <SegmentBtn
              tone="rose"
              active={r.category === "officer"}
              onClick={() => setCategory(r.id, r.category === "officer" ? "none" : "officer")}
            >
              ضابط
            </SegmentBtn>
            <SegmentBtn
              tone="indigo"
              active={r.category === "enlisted"}
              onClick={() => setCategory(r.id, r.category === "enlisted" ? "none" : "enlisted")}
            >
              فرد
            </SegmentBtn>
            <SegmentBtn tone="zinc" active={!r.category} onClick={() => setCategory(r.id, "none")}>
              بلا
            </SegmentBtn>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">الفرز التلقائي حسب الرتب</h3>
        <button
          onClick={syncAll}
          disabled={!!busy}
          className="flex items-center gap-1.5 rounded-lg border border-gold-400/25 px-3 py-1.5 text-xs font-bold text-gold-200 transition-colors hover:bg-gold-400/10 disabled:opacity-50"
        >
          {busy === "sync" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          مزامنة تلقائية من الرتب
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-400/15 bg-obsidian-900/40 p-3 text-xs text-zinc-400">
        <ShieldCheck size={14} className="text-gold-300" />
        عند إطلاق تنبيه الميدان يفحص البوت المتواجدين في الغرفة الصوتية ويصنّفهم حسب هذه الرولات إلى
        ضباط (قسم الضباط) وأفراد (قسم الأفراد) مع وضع المنشن المباشر تحت كل قسم. من يظهر في التبويب
        "الأكواد / الرتب" فقط من يُعرض هنا — الرتب العسكرية فقط.
      </div>

      {msg && (
        <div
          className={cn(
            "mb-4 rounded-lg border p-3 text-sm",
            msg.ok
              ? "border-gold-300/40 bg-gold-400/10 text-gold-100"
              : "border-red-400/30 bg-red-500/10 text-red-200"
          )}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
          <Loader2 size={18} className="animate-spin" /> جارٍ التحميل...
        </div>
      ) : !data?.ok ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          {data?.error || "تعذر جلب الإعدادات"}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2.5">
              <Users size={15} className="text-rose-300" />
              <span className="text-xs text-gray-600">الضباط:</span>
              <span className="font-mono text-sm font-bold text-rose-200">{explicitOfficer.length}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-4 py-2.5">
              <Users size={15} className="text-indigo-300" />
              <span className="text-xs text-gray-600">الأفراد:</span>
              <span className="font-mono text-sm font-bold text-indigo-200">{explicitEnlisted.length}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-500/25 bg-obsidian-900/40 px-4 py-2.5">
              <span className="text-xs text-zinc-400">غير مصنّف:</span>
              <span className="font-mono text-sm font-bold text-gray-600">{uncategorized.length}</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-rose-200">
              <Check size={14} /> قسم الضباط — عند التنبيه يوضع المنشن تحت "ضـبـاط الأمن العام المتواجدين"
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {explicitOfficer.map((r) => (
                <RoleRow key={r.id} r={r} />
              ))}
              {explicitOfficer.length === 0 && (
                <p className="text-xs text-zinc-500">لا توجد رولات مصنّفة كضباط — اضغط "مزامنة تلقائية" أو حدّد يدوياً.</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-200">
              <Check size={14} /> قسم الأفراد — عند التنبيه يوضع المنشن تحت "افـراد الأمن العام المتواجدين"
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {explicitEnlisted.map((r) => (
                <RoleRow key={r.id} r={r} />
              ))}
              {explicitEnlisted.length === 0 && (
                <p className="text-xs text-zinc-500">لا توجد رولات مصنّفة كأفراد — اضغط "مزامنة تلقائية" أو حدّد يدوياً.</p>
              )}
            </div>
          </div>

          {uncategorized.length > 0 && (
            <div>
              <div className="mb-2 text-sm font-bold text-gray-600">رتب غير مصنّفة (يُتجاهلها الفحص)</div>
              <div className="grid gap-2 md:grid-cols-2">
                {uncategorized.map((r) => (
                  <RoleRow key={r.id} r={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}