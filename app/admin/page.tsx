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
  Settings2,
  FileBadge,
  ScrollText,
  KeyRound,
  ChevronDown,
} from "lucide-react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { NewsManager } from "@/components/admin/NewsManager";
import { RosterManager } from "@/components/admin/RosterManager";
import { CodesManager } from "@/components/admin/CodesManager";
import { BadgeCodesManager } from "@/components/admin/BadgeCodesManager";
import { LeadershipManager } from "@/components/admin/LeadershipManager";
import { RolesManager } from "@/components/admin/RolesManager";
import { RecruitmentManager } from "@/components/admin/RecruitmentManager";
import { CollegeManager } from "@/components/admin/CollegeManager";
import { DischargeManager } from "@/components/admin/DischargeManager";
import { PermissionsManager } from "@/components/admin/PermissionsManager";
import { ExamBuilder } from "@/components/admin/ExamBuilder";
import { AuditLogs } from "@/components/admin/AuditLogs";
import { RoleCategoriesManager } from "@/components/admin/RoleCategoriesManager";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { PageHeader } from "@/components/PageHeader";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import { PERMISSION_DEFS } from "@/lib/permissions";
import type { AccessLevel, Grant, PermissionKey } from "@/lib/types";

type TabDef = {
  id: string;
  label: string;
  icon: any;
  cats: Grant[];
  perms: PermissionKey[];
};

const TABS: TabDef[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard, cats: ["master", "executive"], perms: ["SITE_ADMIN"] },
  { id: "news", label: "الأخبار", icon: Newspaper, cats: ["master", "executive"], perms: ["NEWS_ADMIN"] },
  { id: "recruit", label: "التوظيف", icon: UserPlus, cats: ["master", "executive", "hr"], perms: ["RECRUITMENT_ADMIN"] },
  { id: "roster", label: "الأفراد", icon: Users, cats: ["master", "executive", "personnel"], perms: ["SITE_ADMIN"] },
  { id: "roles", label: "الرتب العسكرية", icon: Shield, cats: ["master", "executive"], perms: ["SITE_ADMIN"] },
  { id: "leadership", label: "القيادة", icon: Crown, cats: ["master", "executive"], perms: ["SITE_ADMIN"] },
  { id: "codes", label: "الأكواد", icon: Radio, cats: ["master", "executive", "hr"], perms: ["SITE_ADMIN"] },
  { id: "college", label: "الكلية العسكرية", icon: GraduationCap, cats: ["master", "executive", "hr"], perms: ["RECRUITMENT_ADMIN"] },
  { id: "exams", label: "بناء الاختبارات", icon: FileBadge, cats: ["master", "executive"], perms: ["EXAMS_ADMIN"] },
  { id: "discharge", label: "الفصل", icon: UserX, cats: ["master", "executive"], perms: ["DISCHARGE_ADMIN"] },
  { id: "delegates", label: "الصلاحيات", icon: KeyRound, cats: ["master"], perms: ["PERMISSIONS_ADMIN"] },
  { id: "audit", label: "لوق العمليات", icon: ScrollText, cats: ["master", "executive"], perms: ["SITE_ADMIN"] },
  { id: "settings", label: "الإعدادات", icon: Settings2, cats: ["master", "executive"], perms: ["SITE_ADMIN"] },
];

export default function AdminPage() {
  const { settings, session, logout } = useStore();
  const lang = settings.language;
  const [tab, setTab] = useState("overview");
  const [level, setLevel] = useState<AccessLevel | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [perms, setPerms] = useState<PermissionKey[]>([]);
  const [resolving, setResolving] = useState(false);
  const [levelError, setLevelError] = useState<string | null>(null);

  // If the httpOnly session cookie is missing/invalid (e.g. it was signed with
  // an older secret), the localStorage session alone is useless — every admin
  // write would fail with 401. Detect it up-front and force a fresh login.
  useEffect(() => {
    if (!session) return;
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/session", { cache: "no-store" });
        if (active && r.status === 401) logout();
      } catch {
        if (active) logout();
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.discordId]);

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
        setGrants(d.grants || []);
        setPerms(d.permissions || []);
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

  const canSee = (t: TabDef) =>
    t.cats.some((c) => grants.includes(c)) || t.perms.some((p) => perms.includes(p));

  const isAdmin = level !== null && (level !== "none" || perms.length > 0);

  // Jump to the first tab the user may see once grants/permissions resolve.
  useEffect(() => {
    if (!grants.length && !perms.length) return;
    const allowed = TABS.filter(canSee);
    if (allowed.length === 0) return;
    if (!allowed.some((t) => t.id === tab)) setTab(allowed[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grants, perms]);

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

  const allowed = TABS.filter(canSee);
  const myPerms = perms
    .map((p) => PERMISSION_DEFS.find((x) => x.key === p)?.label || p)
    .filter((l) => l !== "صلاحية السوبر أدمن");

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="clip-notch-sm flex items-center gap-2 rounded-lg border border-gold-400/25 bg-obsidian-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-gold-400/50">
              <ShieldCheck size={14} className="text-gold-300" />
              <span className="font-bold text-gold-200">{session.officer?.nameAr || session.discordId}</span>
              <ChevronDown size={13} className="text-zinc-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {level === "master" ? "سوبر أدمن" : level === "admin" ? "أدمن" : "توظيف"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTab("overview")}>
              <LayoutDashboard size={14} /> نظرة عامة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTab("settings")}>
              <Settings2 size={14} /> الإعدادات
            </DropdownMenuItem>
            {myPerms.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-3 py-1.5 text-[11px] leading-relaxed text-zinc-500">
                  {myPerms.join(" • ")}
                </div>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onClick={logout}>
              <LogOut size={14} /> تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      </div>

      <PageHeader
        title={lang === "ar" ? "لوحة التحكم" : "Admin Control Panel"}
        subtitle={lang === "ar" ? "إدارة الأخبار والأفراد والاختبارات والصلاحيات" : "Manage news, personnel, exams and permissions"}
      />

      {resolving ? (
        <div className="glass flex items-center justify-center gap-2 rounded-2xl p-14 text-zinc-400">
          <Loader2 size={20} className="animate-spin" /> جارٍ التحقق من الصلاحيات...
        </div>
      ) : !isAdmin ? (
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
          <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-1">
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
            {tab === "codes" && (
              <>
                <BadgeCodesManager />
                <CodesManager />
              </>
            )}
            {tab === "recruit" && <RecruitmentManager />}
            {tab === "college" && <CollegeManager />}
            {tab === "exams" && <ExamBuilder />}
            {tab === "discharge" && <DischargeManager />}
            {tab === "delegates" && <PermissionsManager />}
            {tab === "audit" && <AuditLogs />}
            {tab === "settings" && <RoleCategoriesManager />}
          </div>
        </>
      )}
    </div>
  );
}