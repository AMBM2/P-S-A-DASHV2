"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  Radio,
  Crown,
  Shield,
  LogOut,
  UserPlus,
  GraduationCap,
  UserX,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { NewsManager } from "@/components/admin/NewsManager";
import { RosterManager } from "@/components/admin/RosterManager";
import { CodesManager } from "@/components/admin/CodesManager";
import { LeadershipManager } from "@/components/admin/LeadershipManager";
import { RolesManager } from "@/components/admin/RolesManager";
import { RecruitmentManager } from "@/components/admin/RecruitmentManager";
import { CollegeManager } from "@/components/admin/CollegeManager";
import { DischargeManager } from "@/components/admin/DischargeManager";
import { AdminsManager } from "@/components/admin/AdminsManager";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import type { AccessLevel } from "@/lib/types";

const TABS: {
  id: string;
  label: string;
  icon: any;
  levels: AccessLevel[];
}[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard, levels: ["master", "admin"] },
  { id: "news", label: "الأخبار", icon: Newspaper, levels: ["master", "admin"] },
  { id: "roster", label: "الأفراد", icon: Users, levels: ["master", "admin"] },
  { id: "roles", label: "الرتب العسكرية", icon: Shield, levels: ["master", "admin"] },
  { id: "leadership", label: "القيادة", icon: Crown, levels: ["master", "admin"] },
  { id: "codes", label: "الأكواد", icon: Radio, levels: ["master", "admin"] },
  { id: "recruit", label: "التوظيف", icon: UserPlus, levels: ["master", "admin", "recruitment"] },
  { id: "college", label: "الكلية العسكرية", icon: GraduationCap, levels: ["master", "admin", "recruitment"] },
  { id: "discharge", label: "الفصل", icon: UserX, levels: ["master", "admin"] },
  { id: "admins", label: "الصلاحيات", icon: ShieldCheck, levels: ["master"] },
];

export default function AdminPage() {
  const { settings, session, logout } = useStore();
  const lang = settings.language;
  const [tab, setTab] = useState("overview");
  const [level, setLevel] = useState<AccessLevel | null>(null);
  const [resolving, setResolving] = useState(false);
  const [levelError, setLevelError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setResolving(true);
    setLevelError(null);
    (async () => {
      try {
        const r = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discordId: session.discordId }),
          cache: "no-store",
        });
        const d = await r.json();
        if (!active) return;
        setLevel(d.level || "none");
      } catch {
        if (!active) return;
        setLevel("none");
        setLevelError("تعذر تحديد الصلاحية");
      } finally {
        if (active) setResolving(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jump to the first tab the user may see once their level resolves.
  useEffect(() => {
    if (!level || level === "none") return;
    const allowed = TABS.filter((t) => t.levels.includes(level));
    if (allowed.length === 0) return;
    if (!allowed.some((t) => t.id === tab)) setTab(allowed[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  if (!session) {
    return (
      <div>
        <PageHeader
          title={lang === "ar" ? "لوحة التحكم" : "Admin Control Panel"}
          subtitle={
            lang === "ar"
              ? "منطقة محمية — الدخول بمعرّف ديسكورد ورمز خاص"
              : "Protected area — Discord ID + private code required"
          }
        />
        <AdminLogin />
      </div>
    );
  }

  const allowed = TABS.filter((t) => level && t.levels.includes(level));

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-3">
        <span className="text-xs text-zinc-400">
          الداخل:{" "}
          <span className="font-bold text-gold-200">{session.officer?.nameAr || session.discordId}</span>
        </span>
        {level && level !== "none" && (
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
              level === "master"
                ? "border-rose-400/40 bg-rose-500/10 text-rose-300"
                : level === "admin"
                  ? "border-gold-400/40 bg-gold-400/10 text-gold-200"
                  : "border-indigo-400/40 bg-indigo-500/10 text-indigo-300"
            )}
          >
            {level === "master" ? "سوبر أدمن" : level === "admin" ? "أدمن" : "توظيف"}
          </span>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-gold-400/25 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:border-rose-400/40 hover:text-rose-300"
        >
          <LogOut size={13} /> تسجيل الخروج
        </button>
      </div>

      <PageHeader
        title={lang === "ar" ? "لوحة التحكم" : "Admin Control Panel"}
        subtitle={lang === "ar" ? "إدارة الأخبار والأفراد والقيادة والأكواد" : "Manage news, personnel, leadership and codes"}
      />

      {resolving ? (
        <div className="glass flex items-center justify-center gap-2 rounded-2xl p-14 text-zinc-400">
          <Loader2 size={20} className="animate-spin" /> جارٍ التحقق من الصلاحيات...
        </div>
      ) : level === "none" || level === null ? (
        <div className="glass flex flex-col items-center gap-4 rounded-2xl p-14 text-center">
          <ShieldCheck size={36} className="text-rose-300" />
          <div>
            <div className="text-lg font-bold text-white">لا تملك صلاحية الوصول</div>
            <div className="mt-1 text-sm text-zinc-400">
              {levelError || "حسابك لا يملك صلاحية دخول لوحة التحكم. تواصل مع السوبر أدمن."}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex gap-1 overflow-x-auto no-scrollbar rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-1">
            {allowed.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all",
                  tab === t.id
                    ? "bg-gold-400/15 text-gold-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                )}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </div>

          <div className="glass rounded-2xl p-5 md:p-6">
            {tab === "overview" && <AdminOverview />}
            {tab === "news" && <NewsManager />}
            {tab === "roster" && <RosterManager />}
            {tab === "roles" && <RolesManager />}
            {tab === "leadership" && <LeadershipManager />}
            {tab === "codes" && <CodesManager />}
            {tab === "recruit" && <RecruitmentManager />}
            {tab === "college" && <CollegeManager />}
            {tab === "discharge" && <DischargeManager />}
            {tab === "admins" && <AdminsManager />}
          </div>
        </>
      )}
    </div>
  );
}