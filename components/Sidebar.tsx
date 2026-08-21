"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Crown,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Home,
  Fingerprint,
  ShieldCheck,
  Radio,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";

const NAV: { href: string; label: string; icon: LucideIcon; hint: string }[] = [
  { href: "/", label: "الرئيسية", icon: Home, hint: "الملخص والتحديثات" },
  { href: "/leadership", label: "القادة", icon: Crown, hint: "هيكل القيادة" },
  { href: "/personnel", label: "الأفراد", icon: Users, hint: "سجل الأفراد" },
  { href: "/lookup", label: "الاستعلام", icon: Fingerprint, hint: "استعلام ميداني" },
  { href: "/field", label: "الميدان", icon: Radio, hint: "أوامر وأكواد الميدان" },
  { href: "/recruit", label: "التجنيد", icon: UserPlus, hint: "طلبات الانضمام" },
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard, hint: "إدارة النظام" },
];

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <div className="clip-hex absolute inset-0 border border-accent-400/50 bg-gradient-to-b from-accent-400/40 to-accent-600/10 shadow-[0_0_22px_rgba(var(--accent-rgb),0.3)]" />
        <div className="clip-hex absolute inset-[3px] bg-[#0e1320]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/psa-logo.png"
          alt="PSA"
          className="relative h-8 w-8 rounded-full object-contain"
        />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-widest text-slate-50">الأمن العام</span>
          <span className="v100-badge">V300</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-accent-400">
          <ShieldCheck size={11} />
          P S A
        </div>
      </div>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
              active
                ? "border-accent-500/40 bg-accent-500/10 text-accent-300 shadow-[0_0_26px_-12px_rgba(var(--accent-rgb),0.7)]"
                : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-50"
            )}
          >
            <span
              className={cn(
                "clip-notch-sm flex h-9 w-9 shrink-0 items-center justify-center transition-all",
                active ? "bg-accent-500/15 text-accent-400" : "bg-white/[0.06] text-slate-400 group-hover:text-accent-400"
              )}
            >
              <item.icon size={17} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="text-[11px] text-slate-500">{item.hint}</span>
            </span>
            <span
              className={cn(
                "absolute inset-y-3 right-0 w-1 rounded-full bg-accent-500/15 transition-all",
                active ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { officers } = useStore();
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const timeStr = now.toLocaleTimeString("en-GB");

  return (
    <>
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-80 flex-col border-l border-white/10 bg-[#0b0f18]/85 px-5 py-6 backdrop-blur-2xl lg:flex">
        <div className="mb-6 px-1">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-1">
          <NavList />
        </div>
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tabular-nums text-slate-50">{timeStr}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                {now.toLocaleDateString("ar-SA", { weekday: "long" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500/15" />
              </span>
              <span className="text-xs font-bold text-accent-400">{onDuty}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#0b0f18]/85 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="clip-notch-sm border border-white/10 p-2 text-slate-200"
          aria-label="القائمة"
        >
          <Menu size={20} />
        </button>
        <Brand />
        <div className="w-9" />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-80 flex-col border-l border-white/10 bg-[#0e1320] px-5 py-6 backdrop-blur-2xl">
            <div className="mb-6 flex items-center justify-between px-1">
              <Brand />
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-accent-400" aria-label="إغلاق">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-1">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

