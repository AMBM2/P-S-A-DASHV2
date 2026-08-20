"use client";

import { useEffect, useMemo, useState } from "react";
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
  UserCheck,
  RefreshCw,
  Wifi,
  WifiOff,
  Volume2,
  Search,
  X,
  ImagePlus,
  Link2,
  Upload,
  Factory,
  TrainFront,
  MapPin,
} from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import type { Grant } from "@/lib/types";
import { RANKS } from "@/lib/seed";
import { cn } from "@/lib/format";

const FIELD_GRANTS: Grant[] = ["master", "field"];

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

const GROUPS: { name: string; icon: React.ReactNode; items: string[] }[] = [
  { name: "المصانع", icon: <Factory size={14} />, items: ["مصنع البقر", "مصنع الدجاج", "مصنع القوارب"] },
  { name: "المترو", icon: <TrainFront size={14} />, items: ["المترو الاول", "المترو الثاني", "المترو بهامس", "مترو المطار", "مترو المدينة"] },
  { name: "المواقع العامة", icon: <MapPin size={14} />, items: ["الاستديو", "الدسكو", "ملاهي داش", "الخياط", "المسرح", "قراج السيارات", "المجوهرات"] },
  { name: "المواقع الحساسة", icon: <Shield size={14} />, items: ["البيت المهجور", "بيق ماركت", "ميني ماركت فقط"] },
];

type FieldMember = {
  id: string;
  name: string;
  avatar?: string;
  rankAr: string;
  rankLevel: number;
  category: "officer" | "enlisted";
  connected: boolean;
  inVoice: boolean;
};

export default function FieldPage() {
  const { session, officers, logout } = useStore();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [resolving, setResolving] = useState(true);
  const [location, setLocation] = useState("");
  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const [members, setMembers] = useState<FieldMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageName, setImageName] = useState("");

  const attachImage = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result || ""));
      setImageName(file.name);
      setImageUrl("");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!session) {
      setResolving(false);
      return;
    }
    // Stale httpOnly cookie → every protected call 401s. Drop the local
    // session so the user sees the login prompt instead of confusing errors.
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then((r) => {
        if (active && r.status === 401) logout();
      })
      .catch(() => {
        if (active) logout();
      });
    return () => {
      active = false;
    };
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadMembers = async () => {
    setMembersLoading(true);
    setMembersError("");
    try {
      const r = await fetch(`/api/field/members`, { cache: "no-store" });
      const d = await r.json();
      if (d.ok && Array.isArray(d.members)) {
        setMembers(d.members as FieldMember[]);
      } else {
        setMembersError(d.error || "تعذر جلب قائمة الأعضاء");
      }
    } catch {
      setMembersError("تعذر الاتصال بالبوت");
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (allowed && session) loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, session?.discordId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPhase("idle");
    setError("");
  };

  const selectAllConnected = () => {
    setSelected(new Set(members.filter((m) => m.connected).map((m) => m.id)));
  };
  const clearAll = () => setSelected(new Set());

  const connected = useMemo(() => members.filter((m) => m.connected), [members]);
  const offline = useMemo(() => members.filter((m) => !m.connected), [members]);

  const q = search.trim().toLowerCase();
  const matches = (m: FieldMember) =>
    !q ||
    m.name.toLowerCase().includes(q) ||
    m.rankAr.toLowerCase().includes(q) ||
    (m.category === "officer" ? "ضابط" : "فرد").includes(q);
  const visibleConnected = useMemo(
    () => connected.filter(matches), // eslint-disable-line react-hooks/exhaustive-deps
    [connected, q]
  );
  const visibleOffline = useMemo(
    () => offline.filter(matches), // eslint-disable-line react-hooks/exhaustive-deps
    [offline, q]
  );

  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const onDutyOfficers = officers.filter(
    (o) => o.status === "on-duty" && RANKS.find((r) => r.id === o.rankId)?.division === "officer"
  ).length;
  const onDutyEnlisted = onDuty - onDutyOfficers;

  const selectedMembers = members.filter((m) => selected.has(m.id));
  const selectedOfficers = selectedMembers.filter((m) => m.category === "officer").length;
  const selectedEnlisted = selectedMembers.filter((m) => m.category === "enlisted").length;

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
        body: JSON.stringify({
          actor: session?.discordId || "",
          location,
          memberIds: [...selected],
          ...(imageUrl ? { imageUrl } : {}),
          ...(imageData ? { imageData, imageName: imageName || "field-image.png" } : {}),
        }),
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

  const MemberRow = ({ m }: { m: FieldMember }) => {
    const active = selected.has(m.id);
    return (
      <button
        onClick={() => toggle(m.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-right transition-all duration-150",
          active
            ? "border-gold-300/70 bg-gold-400/15 shadow-[0_0_18px_-6px_rgba(var(--accent-rgb),0.55)]"
            : "border-gold-400/12 bg-obsidian-900/40 hover:border-gold-400/40 hover:bg-obsidian-900/70"
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
            active ? "border-gold-300 bg-gold-300 text-obsidian-900" : "border-zinc-600"
          )}
        >
          {active && <UserCheck size={12} />}
        </span>
        <span className="relative shrink-0">
          {m.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatar} alt="" className="h-10 w-10 rounded-full border border-gold-400/30 object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/25 bg-obsidian-800 text-sm font-bold text-gold-300">
              {m.name.slice(0, 1)}
            </span>
          )}
          {m.connected && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-obsidian-900 bg-emerald-400" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-white">{m.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                m.category === "officer"
                  ? "border-gold-400/40 bg-gold-400/10 text-gold-200"
                  : "border-sky-400/40 bg-sky-400/10 text-sky-200"
              )}
            >
              {m.rankAr || "—"}
            </span>
            <span className="text-[10px] text-zinc-500">{m.category === "officer" ? "ضابط" : "فرد"}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {m.inVoice && (
            <span className="flex items-center gap-1 rounded-full border border-gold-400/30 bg-gold-400/10 px-1.5 py-0.5 text-[10px] text-gold-200">
              <Volume2 size={10} /> روم
            </span>
          )}
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
              m.connected
                ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border border-zinc-600/40 bg-zinc-500/10 text-zinc-500"
            )}
          >
            {m.connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {m.connected ? "متصل" : "غير متصل"}
          </span>
        </span>
      </button>
    );
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
            إرسال التنبيهات الميدانية متاح فقط لأعضاء رول الأمن العام المسجلين من لوحة التحكم.
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
                اختر الموقع، حدّد أعضاء الأمن العام المطلوب استدعاؤهم، ثم أرسل التنبيه
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

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Tactical scenario grid */}
        <Card className="lg:col-span-3">
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
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                    <span className="text-gold-300">{g.icon}</span>
                    {g.name}
                  </span>
                  <span className="h-px flex-1 bg-gold-400/10" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
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

          {/* Image attach */}
        <div className="mt-6 border-t border-gold-400/15 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-200">
              <ImagePlus size={16} className="text-gold-300" /> ارفاق صورة الميدان (اختياري)
            </h3>
            {(imageUrl || imageData) && (
              <button
                onClick={() => {
                  setImageUrl("");
                  setImageData("");
                  setImageName("");
                }}
                className="flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-200 hover:bg-red-500/20"
              >
                <X size={12} /> إزالة
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2 size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setImageData("");
                    setImageName("");
                  }
                }}
                placeholder="رابط مباشر لصورة الميدان (https://...)"
                className="w-full rounded-xl border border-gold-400/15 bg-obsidian-900/60 py-2.5 pr-10 pl-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-gold-300/60"
              />
            </div>
            <label className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gold-400/25 bg-gold-400/10 px-4 py-2.5 text-sm font-bold text-gold-200 transition hover:bg-gold-400/20">
              <Upload size={15} />
              {imageData ? "تغيير الصورة" : "اختيار صورة"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) attachImage(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {(imageUrl || imageData) && (
            <div className="relative mt-3 inline-block overflow-hidden rounded-xl border border-gold-400/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageData || imageUrl}
                alt="صورة الميدان"
                className="max-h-40 w-auto object-cover"
              />
            </div>
          )}
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
                    إرسال تنبيه الميدان ({selected.size})
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
                      نُشر أمر التحرك لموقع <span className="font-bold text-gold-200">{location}</span> في قناة الميدان مع منشن
                      الأعضاء المحددين ورتبهم.
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
              <EmptyState message="اختر موقعاً من الشبكة أعلاه وحدّد الأعضاء ثم اضغط زر الإرسال" />
            )}
          </div>
        </Card>

        {/* Member selection panel */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold gold-text">
              <Users size={18} /> أعضاء الأمن العام
            </h2>
            <Button variant="outline" onClick={loadMembers} disabled={membersLoading} className="!px-2.5 !py-1.5 !text-xs">
              {membersLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            </Button>
          </div>

          {membersError ? (
            <div className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
              {membersError}
            </div>
          ) : null}

          <div className="mb-3 flex items-center gap-2 rounded-xl border border-gold-400/15 bg-obsidian-900/60 px-3 py-2 focus-within:border-gold-300/60">
            <Search size={15} className="shrink-0 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الرتبة..."
              className="w-full bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-zinc-200">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={selectAllConnected} className="!px-2.5 !py-1.5 !text-xs">
              <Wifi size={13} /> اختيار المتصلين ({connected.length})
            </Button>
            <Button variant="ghost" onClick={clearAll} className="!px-2.5 !py-1.5 !text-xs">
              إلغاء الكل
            </Button>
            <span className="mr-auto text-xs text-zinc-500">
              المحدد: <span className="font-bold text-gold-200">{selected.size}</span>
              {selected.size > 0 && (
                <span className="mr-2 text-[11px]">
                  <span className="font-bold text-gold-300">{selectedOfficers}</span> ضابط ·{" "}
                  <span className="font-bold text-sky-300">{selectedEnlisted}</span> فرد
                </span>
              )}
            </span>
          </div>

          {membersLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
              <Loader2 size={18} className="animate-spin" /> جارٍ جلب القائمة من ديسكورد...
            </div>
          ) : members.length === 0 ? (
            <EmptyState message="لا يوجد أعضاء بتصنيفات أمنية — حدّد التصنيفات من الإعدادات" />
          ) : (
            <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    متصلون ({visibleConnected.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {[...visibleConnected]
                    .sort((a, b) => (b.rankLevel ?? -1) - (a.rankLevel ?? -1) || a.name.localeCompare(b.name))
                    .map((m) => (
                      <MemberRow key={m.id} m={m} />
                    ))}
                  {visibleConnected.length === 0 && (
                    <div className="py-3 text-center text-xs text-zinc-600">لا نتائج مطابقة</div>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <WifiOff size={12} className="text-zinc-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    غير متصلين ({visibleOffline.length})
                  </span>
                </div>
                <div className="space-y-1.5 opacity-80">
                  {[...visibleOffline]
                    .sort((a, b) => (b.rankLevel ?? -1) - (a.rankLevel ?? -1) || a.name.localeCompare(b.name))
                    .map((m) => (
                      <MemberRow key={m.id} m={m} />
                    ))}
                  {visibleOffline.length === 0 && (
                    <div className="py-3 text-center text-xs text-zinc-600">لا نتائج مطابقة</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}