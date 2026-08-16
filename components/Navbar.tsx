"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  LogIn,
  LogOut,
  UserRound,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { AudioPlayer } from "@/components/AudioPlayer";
import { LoginModal } from "@/components/LoginModal";
import { RANKS } from "@/lib/seed";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/leadership", label: "القادة", icon: Crown },
  { href: "/personnel", label: "الأفراد", icon: Users },
  { href: "/lookup", label: "الاستعلام", icon: Fingerprint },
  { href: "/field", label: "الميدان", icon: Radio },
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { officers, session, logout } = useStore();
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const timeStr = now.toLocaleTimeString("en-GB");
  const rankTitle = session?.officer?.rankId
    ? RANKS.find((r) => r.id === session.officer!.rankId)?.titleAr
    : null;

  return (
    <>
      {/* Official ministry strip */}
      <div className="glass-strong sticky top-0 z-40 border-b border-gold-400/20">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-gold-400/35 bg-gold-400/5 shadow-[0_0_22px_rgba(217,180,91,0.35)]" />
                <div className="absolute inset-0 rounded-full border border-gold-200/20" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/psa-logo.png"
                  alt="PSA"
                  className="relative h-9 w-9 rounded-full object-contain"
                  style={{ filter: "drop-shadow(0 0 10px rgba(217,180,91,0.4))" }}
                />
              </div>
              <div className="leading-tight">
                <div className="font-display text-lg font-bold tracking-widest gold-text">
                  الأمن العام
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold-300/70">
                  <ShieldCheck size={11} />
                  P S A
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 py-1.5 text-sm font-medium transition-colors",
                    active ? "text-gold-200" : "text-zinc-400 hover:text-gold-200"
                  )}
                >
                  <item.icon size={15} />
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 transition-all duration-300",
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <div className="flex flex-col items-end leading-tight">
              <span className="font-display text-base font-bold tabular-nums gold-text">
                {timeStr}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                {now.toLocaleDateString("ar-SA", { weekday: "long" })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-300" />
              </span>
              <span className="text-xs font-bold text-gold-200">{onDuty} في الخدمة</span>
            </div>
            {session ? (
              <div className="flex items-center gap-2">
                <div className="hidden flex-col items-end leading-tight sm:flex">
                  <span className="max-w-[140px] truncate text-xs font-bold text-gold-200">
                    {session.officer?.nameAr || session.discordId}
                  </span>
                  {rankTitle && <span className="text-[10px] text-zinc-500">{rankTitle}</span>}
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg border border-gold-400/25 p-2 text-zinc-300 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                  title="تسجيل الخروج"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-xs font-bold text-gold-200 transition-colors hover:bg-gold-400/20"
              >
                <LogIn size={14} /> تسجيل الدخول
              </button>
            )}
            <AudioPlayer />
            <button
              onClick={() => setOpen(!open)}
              className="rounded-lg border border-gold-400/20 p-2 text-zinc-300 lg:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-gold-400/20 lg:hidden">
            <nav className="mx-auto grid max-w-[1500px] grid-cols-2 gap-1 p-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                    pathname === item.href
                      ? "bg-gold-400/15 text-gold-200"
                      : "text-zinc-300 hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  session ? logout() : setLoginOpen(true);
                }}
                className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-gold-400/30 px-3 py-2.5 text-sm font-bold text-gold-200"
              >
                {session ? <LogOut size={16} /> : <UserRound size={16} />}
                {session ? (session.officer?.nameAr || "تسجيل الخروج") : "تسجيل الدخول"}
              </button>
            </nav>
          </div>
        )}
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
