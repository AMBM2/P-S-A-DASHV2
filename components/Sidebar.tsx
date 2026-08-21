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
  Search,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui";
import { cn } from "@/lib/format";
import { Transition } from "@headlessui/react";

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
        <div className="clip-hex absolute inset-0 border border-gold-400/40 bg-gradient-to-b from-gold-400/40 to-gold-600/10 shadow-[0_0_22px_rgba(var(--accent-rgb),0.35)]" />
        <div className="clip-hex absolute inset-[3px] bg-obsidian-900/90" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/psa-logo.png"
          alt="PSA"
          className="relative h-8 w-8 rounded-full object-contain"
          style={{ filter: "drop-shadow(0 0 10px rgba(var(--accent-rgb),0.4))" }}
        />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-widest gold-text">الأمن العام</span>
          <span className="v100-badge">V300</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold-300/70">
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
                ? "border-gold-400/40 bg-gradient-to-l from-gold-400/20 to-transparent text-gold-100 shadow-[0_0_26px_-10px_rgba(var(--accent-rgb),0.7)]"
                : "border-transparent text-zinc-400 hover:border-white/5 hover:bg-white/[0.04] hover:text-gold-200"
            )}
          >
            <span
              className={cn(
                "clip-notch-sm flex h-9 w-9 shrink-0 items-center justify-center transition-all",
                active ? "bg-gold-400/15 text-gold-200" : "bg-white/[0.03] text-zinc-400 group-hover:text-gold-200"
              )}
            >
              <item.icon size={17} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="text-[11px] text-zinc-500">{item.hint}</span>
            </span>
            <span
              className={cn(
                "absolute inset-y-3 right-0 w-1 rounded-full bg-gold-300 transition-all",
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
      {/* ===================== DESKTOP SIDEBAR ===================== */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-80 flex-col border-l border-gold-400/15 bg-[rgba(var(--glass),0.5)] px-5 py-6 backdrop-blur-2xl lg:flex">
        <div className="mb-6 px-1">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-1">
          <NavList />
        </div>

        <div className="mt-4 space-y-3 border-t border-gold-400/10 pt-4">
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="clip-notch-sm flex w-full items-center gap-3 rounded-xl border border-gold-400/15 bg-white/[0.03] px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:border-gold-400/40 hover:text-gold-200"
          >
            <Search size={16} />
            <span className="flex-1 text-right">بحث سريع</span>
            <kbd className="rounded border border-gold-400/25 bg-gold-400/10 px-1.5 py-0.5 text-[10px] text-gold-200">⌘K</kbd>
          </button>

          <div className="flex items-center justify-between rounded-xl border border-gold-400/15 bg-white/[0.03] px-4 py-3">
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tabular-nums gold-text">{timeStr}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                {now.toLocaleDateString("ar-SA", { weekday: "long" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-300" />
              </span>
              <span className="text-xs font-bold text-gold-200">{onDuty}</span>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AudioPlayer />
                  </TooltipTrigger>
                  <TooltipContent side="top">النشيد الرسمي</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </aside>

      {/* ===================== MOBILE TOPBAR + DRAWER ===================== */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gold-400/15 bg-[rgba(var(--glass),0.7)] px-4 py-3 backdrop-blur-2xl lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="clip-notch-sm border border-gold-400/20 p-2 text-gold-200"
          aria-label="القائمة"
        >
          <Menu size={20} />
        </button>
        <Brand />
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AudioPlayer />
            </TooltipTrigger>
            <TooltipContent side="top">النشيد الرسمي</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Transition show={open}>
        <div className="fixed inset-0 z-50 lg:hidden">
          <Transition.Child
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          </Transition.Child>
          <Transition.Child
            enter="transition-transform duration-250 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <aside className="absolute inset-y-0 right-0 flex w-80 flex-col border-l border-gold-400/15 bg-[rgba(var(--glass),0.95)] px-5 py-6 backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between px-1">
                <Brand />
                <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-gold-200" aria-label="إغلاق">
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-1">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
            </aside>
          </Transition.Child>
        </div>
      </Transition>
    </>
  );
}
