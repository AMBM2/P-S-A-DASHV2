"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  Radio,
  Crown,
  Shield,
} from "lucide-react";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { NewsManager } from "@/components/admin/NewsManager";
import { RosterManager } from "@/components/admin/RosterManager";
import { CodesManager } from "@/components/admin/CodesManager";
import { LeadershipManager } from "@/components/admin/LeadershipManager";
import { RolesManager } from "@/components/admin/RolesManager";
import { AdminGate } from "@/components/admin/AdminGate";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import { isAuthed } from "@/lib/security";

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "news", label: "الأخبار", icon: Newspaper },
  { id: "roster", label: "الأفراد", icon: Users },
  { id: "roles", label: "الرتب العسكرية", icon: Shield },
  { id: "leadership", label: "القيادة", icon: Crown },
  { id: "codes", label: "الأكواد", icon: Radio },
];

export default function AdminPage() {
  const { settings } = useStore();
  const lang = settings.language;
  const [tab, setTab] = useState("overview");
  const [authed, setAuthed] = useState(false);

  if (!authed && !isAuthed()) {
    return (
      <div>
        <PageHeader
          title={lang === "ar" ? "لوحة التحكم" : "Admin Control Panel"}
          subtitle={
            lang === "ar"
              ? "منطقة محمية — يتطلب مفتاح وصول سري"
              : "Protected area — secret access key required"
          }
        />
        <AdminGate onUnlock={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "لوحة التحكم" : "Admin Control Panel"}
        subtitle={lang === "ar" ? "إدارة الأخبار والأفراد والقيادة والأكواد" : "Manage news, personnel, leadership and codes"}
      />

      <div className="mb-6 flex gap-1 overflow-x-auto no-scrollbar rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-1">
        {TABS.map((t) => (
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
      </div>
    </div>
  );
}
