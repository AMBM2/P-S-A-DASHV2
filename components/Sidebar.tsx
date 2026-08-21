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
        <div className="clip-hex absolute inset-0 border border-accent-400/50 bg-gradient-to-b from-accent-400/40 to-accent-600/10 shadow-[0_0_22px_rgba(var(--accent-rgb),0.3)]" />
        <div className="clip-hex absolute inset-[3px] bg-white/90" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/psa-logo.png"
          alt="PSA"
          className="relative h-8 w-8 rounded-full object-contain"
        />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-widest text-gray-900">الأمن العام</span>
          <span className="v100-badge">V300</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-accent-600">
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
                ? "border-accent-400/40 bg-accent-50 text-accent-700 shadow-[0_0_26px_-12px_rgba(var(--accent-rgb),0.7)]"
                : "border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span
              className={cn(
                "clip-notch-sm flex h-9 w-9 shrink-0 items-center justify-center transition-all",
                active ? "bg-accent-100 text-accent-600" : "bg-gray-100 text-gray-500 group-hover:text-accent-600"
              )}
            >
              <item.icon size={17} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="text-[11px] text-gray-400">{item.hint}</span>
            </span>
            <span
              className={cn(
                "absolute inset-y-3 right-0 w-1 rounded-full bg-accent-500 transition-all",
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
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-80 flex-col border-l border-gray-200 bg-white/80 px-5 py-6 backdrop-blur-2xl lg:flex">
        <div className="mb-6 px-1">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-1">
          <NavList />
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="clip-notch-sm flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:border-accent-400/40 hover:text-accent-600"
          >
            <Search size={16} />
            <span className="flex-1 text-right">بحث سريع</span>
            <kbd className="rounded border border-accent-400/25 bg-accent-50 px-1.5 py-0.5 text-[10px] text-accent-600">⌘K</kbd>
          </button>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold tabular-nums text-gray-900">{timeStr}</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400">
                {now.toLocaleDateString("ar-SA", { weekday: "long" })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-500" />
              </span>
              <span className="text-xs font-bold text-accent-600">{onDuty}</span>
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
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-2xl lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="clip-notch-sm border border-gray-200 p-2 text-gray-700"
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
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          </Transition.Child>
          <Transition.Child
            enter="transition-transform duration-250 ease-out"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200 ease-in"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <aside className="absolute inset-y-0 right-0 flex w-80 flex-col border-l border-gray-200 bg-white px-5 py-6 backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between px-1">
                <Brand />
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-accent-600" aria-label="إغلاق">
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
