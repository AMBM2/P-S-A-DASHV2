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
  UserPlus,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { AudioPlayer } from "@/components/AudioPlayer";
import { cn } from "@/lib/format";
import useEmblaCarousel from "embla-carousel-react";

const NAV = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/leadership", label: "القادة", icon: Crown },
  { href: "/personnel", label: "الأفراد", icon: Users },
  { href: "/lookup", label: "الاستعلام", icon: Fingerprint },
  { href: "/field", label: "الميدان", icon: Radio },
  { href: "/recruit", label: "التجنيد", icon: UserPlus },
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { officers } = useStore();
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    const el = emblaApi?.rootNode();
    if (!el || !pathname) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [pathname, emblaApi]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const timeStr = now.toLocaleTimeString("en-GB");

  return (
    <>
      {/* Official command strip */}
      <div className="glass-strong sticky top-0 z-40 border-b border-gold-400/20">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] hazard-stripes opacity-40" />
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3">
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="clip-hex absolute inset-0 bg-gradient-to-b from-gold-400/40 to-gold-600/10 border border-gold-400/40 shadow-[0_0_22px_rgba(var(--accent-rgb),0.35)]" />
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
                  <span className="font-display text-lg font-bold tracking-widest gold-text">
                    الأمن العام
                  </span>
                  <span className="v100-badge">V300</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold-300/70">
                  <ShieldCheck size={11} />
                  P S A
                </div>
              </div>
            </Link>
          </div>

          {/* Embla carousel nav dock: horizontal, hidden scrollbar, swipeable */}
          <nav className="nav-fade-mask relative hidden min-w-0 flex-1 md:block" ref={emblaRef}>
            <div className="flex items-center gap-1 py-1">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={active}
                    className={cn(
                      "group relative flex shrink-0 items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors select-none",
                      active ? "text-gold-200" : "text-zinc-400 hover:text-gold-200"
                    )}
                  >
                    <item.icon size={15} />
                    {item.label}
                    <span
                      className={cn(
                        "absolute inset-x-3 -bottom-0.5 h-[2px] bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500 transition-all duration-300",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-70"
                      )}
                    />
                    <span
                      className={cn(
                        "pointer-events-none absolute -bottom-px left-0 h-2 w-2 border-b-2 border-l-2 border-gold-400/60 transition-all duration-300 rtl:left-auto rtl:right-0 rtl:border-b-2 rtl:border-r-2 rtl:border-l-0",
                        active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="hidden shrink-0 items-center gap-4 md:flex">
            <div className="flex flex-col items-end leading-tight">
              <span className="font-display text-base font-bold tabular-nums gold-text">
                {timeStr}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                {now.toLocaleDateString("ar-SA", { weekday: "long" })}
              </span>
            </div>
            <div className="clip-notch-sm flex items-center gap-1.5 border border-gold-400/30 bg-gold-400/10 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-300" />
              </span>
              <span className="text-xs font-bold text-gold-200">{onDuty} في الخدمة</span>
            </div>
            <AudioPlayer />
            <button
              onClick={() => setOpen(!open)}
              className="clip-notch-sm border border-gold-400/20 p-2 text-zinc-300 md:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-gold-400/20 md:hidden">
            <nav className="mx-auto grid max-w-[1500px] grid-cols-2 gap-1 p-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm",
                    pathname === item.href
                      ? "bg-gold-400/15 text-gold-200"
                      : "text-zinc-300 hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
