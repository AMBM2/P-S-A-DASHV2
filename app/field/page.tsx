"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldAlert,
  Target,
  Users,
  Shield,
  Siren,
  Crosshair,
} from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import type { Grant } from "@/lib/types";
import { RANKS } from "@/lib/seed";
import { cn } from "@/lib/format";

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

const GROUPS: { name: string; items: string[] }[] = [
  { name: "المصانع", items: ["مصنع البقر", "مصنع الدجاج", "مصنع القوارب"] },
  { name: "المترو", items: ["المترو الاول", "المترو الثاني", "المترو بهامس", "مترو المطار", "مترو المدينة"] },
  { name: "المواقع العامة", items: ["الاستديو", "الدسكو", "ملاهي داش", "الخياط", "المسرح", "قراج السيارات", "المجوهرات"] },
  { name: "المواقع الحساسة", items: ["البيت المهجور", "بيق ماركت", "ميني ماركت فقط"] },
];

export default function FieldPage() {
  const { session, officers } = useStore();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [resolving, setResolving] = useState(true);
  const [location, setLocation] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

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
  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const onDutyOfficers = officers.filter(
    (o) => o.status === "on-duty" && RANKS.find((r) => r.id === o.rankId)?.division === "officer"
  ).length;
  const onDutyEnlisted = onDuty - onDutyOfficers;

  const submit = async () => {
    setPhase("idle");
    setError("");
    if (!location) {
      setPhase("error");
      setError("يرجى اختيار موقع السيناريو من الشبكة التكتيكية");
      return;
    }
    setPhase("sending");
    try {
      const res = await fetch("/api/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });
      const data = await res.json();
      if (data.ok) {
        setPhase("sent");
        setLocation("");
      } else {
        setPhase("error");
        setError(data.error || "فشل إرسال التنبيه");
      }
    } catch {
      setPhase("error");
      setError("تعذر الاتصال بالخادم");
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
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Command header */}
      <div className="gold-shimmer relative mb-6 overflow-hidden rounded-2xl border border-gold-400/25 bg-gradient-to-br from-obsidian-800 via-obsidian-900 to-black p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }} />
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-full border border-dashed border-gold-400/50" />
              <span className="absolute inset-1.5 rounded-full border border-gold-400/30" />
              <span className="absolute inset-1.5 rounded-full bg-gold-400/10 gold-pulse" />
              <Radio size={26} className="relative text-gold-200" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h1 className="font-display text-2xl font-extrabold gold-text md:text-3xl">
                  مركز قيادة الميدان
                </h1>
              </div>
              <p className="text-sm text-zinc-400">
                اختر موقع السيناريو ثم أرسل التنبيه المنسّق إلى قناة الميدان في ديسكورد
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            <span className="text-xs font-bold text-emerald-200">القناة متصلة</span>
          </div>
        </div>

        {/* Live tactical readout */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-gold-400/15 bg-black/30 px-4 py-3">
            <Users size={20} className="text-gold-300" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">في الخدمة</div>
              <div className="font-display text-xl font-bold gold-text">{onDuty}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gold-400/15 bg-black/30 px-4 py-3">
            <Shield size={20} className="text-gold-300" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">ضباط</div>
              <div className="font-display text-xl font-bold text-gold-200">{onDutyOfficers}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gold-400/15 bg-black/30 px-4 py-3">
            <Siren size={20} className="text-gold-300" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">أفراد</div>
              <div className="font-display text-xl font-bold text-gold-200">{onDutyEnlisted}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical scenario grid */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold gold-text">
            <Crosshair size={18} /> اختر موقع السيناريو
          </h2>
          {location ? (
            <span className="rounded-full border border-gold-400/40 bg-gold-400/15 px-3 py-1 text-xs font-bold text-gold-200">
              المحدد: {location}
            </span>
          ) : (
            <span className="text-xs text-zinc-500">لم يتم اختيار موقع بعد</span>
          )}
        </div>

        <div className="space-y-5">
          {GROUPS.map((g) => (
            <div key={g.name}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-5 bg-gradient-to-l from-gold-400/60 to-transparent" />
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                  {g.name}
                </span>
                <span className="h-px flex-1 bg-gold-400/10" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {g.items.map((l) => {
                  const active = location === l;
                  return (
                    <button
                      key={l}
                      onClick={() => {
                        setLocation(l);
                        setPhase("idle");
                        setError("");
                      }}
                      className={cn(
                        "group relative flex items-center gap-2 overflow-hidden rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                        active
                          ? "border-gold-300/80 bg-gold-400/20 text-gold-100 shadow-[0_0_18px_-4px_rgba(var(--accent-rgb),0.6)]"
                          : "border-gold-400/15 bg-obsidian-900/50 text-zinc-300 hover:border-gold-400/50 hover:bg-gold-400/5"
                      )}
                    >
                      <Target
                        size={14}
                        className={cn(
                          "shrink-0 transition-colors",
                          active ? "text-gold-200" : "text-zinc-500 group-hover:text-gold-300"
                        )}
                      />
                      <span className="truncate">{l}</span>
                      {active && (
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-gold-300 to-transparent" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Dispatch console */}
        <div className="mt-6 border-t border-gold-400/15 pt-5">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row">
            <Button
              onClick={submit}
              disabled={phase === "sending"}
              className="flex-1 py-3.5 text-base font-extrabold tracking-wide"
            >
              {phase === "sending" ? (
                <>
                  <Loader2 size={18} className="ml-2 animate-spin" />
                  جارٍ إرسال التنبيه...
                </>
              ) : (
                <>
                  <Send size={18} className="ml-2" />
                  إرسال تنبيه الميدان
                </>
              )}
            </Button>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: phase === "idle" ? 0 : "auto",
              opacity: phase === "idle" ? 0 : 1,
            }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {phase === "sent" && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold-300/40 bg-gold-400/10 p-4 text-sm text-gold-100">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">تم إرسال التنبيه بنجاح</div>
                  <div className="mt-0.5 text-xs text-zinc-300">
                    نُشر أمر التحرك لموقع <span className="font-bold text-gold-200">{location}</span> في قناة الميدان — تم نصح الضباط والأفراد المتواجدين بالانتقال فوراً.
                  </div>
                </div>
              </div>
            )}
            {phase === "error" && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <div className="font-bold">فشل التنبيه: {error}</div>
              </div>
            )}
          </motion.div>

          {phase === "idle" && !location && (
            <EmptyState message="اختر موقعاً من الشبكة أعلاه ثم اضغط زر الإرسال" />
          )}
        </div>
      </Card>
    </div>
  );
}