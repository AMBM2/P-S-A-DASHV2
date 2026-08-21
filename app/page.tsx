"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Newspaper,
  ShieldCheck,
  Crown,
  Search,
  ChevronLeft,
  Pin,
  Play,
  Eye,
} from "lucide-react";
import { Card, Badge, ProgressBar, EmptyState, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { timeAgo, number } from "@/lib/format";
import { AR } from "@/lib/ar";

const RANKS = [
  { id: "r1", titleAr: "Ù‚Ø§Ø¦Ø¯ Ø¹Ø§Ù…", title: "Commander" },
  { id: "r2", titleAr: "Ù†Ø§Ø¦Ø¨ Ø§Ù„Ù‚Ø§Ø¦Ø¯", title: "Deputy" },
  { id: "r3", titleAr: "Ø¹Ù…ÙŠØ¯", title: "Brigadier" },
  { id: "r4", titleAr: "Ø¹Ù‚ÙŠØ¯", title: "Colonel" },
  { id: "r5", titleAr: "Ø±Ø§Ø¦Ø¯", title: "Major" },
  { id: "r6", titleAr: "Ù…Ù„Ø§Ø²Ù…", title: "Lieutenant" },
  { id: "r7", titleAr: "ÙˆÙƒÙŠÙ„", title: "Agent" },
  { id: "r8", titleAr: "Ø¬Ù†Ø¯ÙŠ", title: "Trooper" },
];

const PRIORITY_TONE: Record<string, "gold" | "amber" | "rose" | "green" | "slate"> = {
  critical: "rose",
  high: "amber",
  normal: "slate",
  low: "green",
};

export default function HomePage() {
  const { news, officers, settings } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const cats = useMemo(
    () => settings.newsCategories || [{ id: "general", labelAr: "Ø¹Ø§Ù…", label: "General" }],
    [settings.newsCategories]
  );

  const catLabel = (id: string) => cats.find((c) => c.id === id)?.labelAr || id;

  const filtered = useMemo(() => {
    return news
      .filter((n) => n.status === "published" || n.pinned)
      .filter((n) => (cat === "all" ? true : n.category === cat))
      .filter((n) =>
        q.trim()
          ? (n.titleAr + n.title + n.bodyAr + n.body).toLowerCase().includes(q.trim().toLowerCase())
          : true
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [news, cat, q]);

  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const totalRanked = officers.length || 1;

  return (
    <div>
      {/* Command Hero */}
      <div className="clip-notch relative mb-10 overflow-hidden border border-white/10 bg-gradient-to-bl from-accent-500/10 via-[#080a10] to-[#080a10] p-8 md:p-12">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-right">
          <div className="max-w-xl">
            <div className="clip-notch-sm mb-4 inline-flex items-center gap-2 border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-accent-300">
              <ShieldCheck size={14} />
              Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù„Ù‚ÙˆØ§Øª Ø§Ù„Ø£Ù…Ù† Ø§Ù„Ø¹Ø§Ù…
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-50 md:text-6xl">
              Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø£Ù…Ù† Ø§Ù„Ø¹Ø§Ù…
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400 md:text-base">
              Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ø§Ù„Ù…ÙˆØ­Ø¯Ø© Ù„Ø£Ø®Ø¨Ø§Ø± Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©ØŒ Ø§Ù„Ø£ÙØ±Ø§Ø¯ ÙÙŠ Ø§Ù„Ø®Ø¯Ù…Ø©ØŒ ÙˆØ§Ù„ØªÙˆØ²ÙŠØ¹ Ø­Ø³Ø¨ Ø§Ù„Ø±ØªØ¨.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
              <span className="v100-badge">V300</span>
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-accent-400">
                <span className="h-1.5 w-1.5 rotate-45 bg-accent-500/15" />
                Command Operations
              </span>
            </div>
          </div>
          <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-accent-200" />
            <div className="absolute inset-5 rounded-full border border-dashed border-accent-300" />
            <div className="clip-hex relative flex h-32 w-32 items-center justify-center border border-accent-400/40 bg-[#0e1320] shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/psa-logo.png" alt="PSA" className="h-24 w-24 rounded-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* News Feed */}
        <div className="lg:col-span-2">
          <SectionTitle icon={Newspaper}>Ø£Ø®Ø¨Ø§Ø± Ø§Ù„Ø£Ù…Ù† Ø§Ù„Ø¹Ø§Ù…</SectionTitle>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-500 ltr:left-3 rtl:right-3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ø¨Ø­Ø«..."
                className="w-40 rounded-lg border border-white/15 bg-[#0e1320] py-1.5 pl-8 pr-3 text-xs text-slate-50 outline-none focus:border-accent-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[{ id: "all", labelAr: "Ø§Ù„ÙƒÙ„", label: "All" }, ...cats].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-all ${
                    cat === c.id
                      ? "border-accent-400/60 bg-accent-500/10 text-accent-300"
                      : "border-white/10 text-slate-400 hover:border-accent-400/40 hover:text-accent-400"
                  }`}
                >
                  {c.labelAr}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState message="Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø®Ø¨Ø§Ø± Ù…Ø·Ø§Ø¨Ù‚Ø©" />
          ) : (
            <div className="space-y-4">
              {filtered.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/news/${n.id}`} className="block group">
                    <Card hover className="relative overflow-hidden">
                      <span className="pointer-events-none absolute inset-y-0 right-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-accent-300 via-accent-400 to-accent-600 transition-transform duration-300 group-hover:scale-y-100" />
                      {(n.images?.[0] || n.image) && (
                        <div className="relative mb-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={n.images?.[0] || n.image}
                            alt=""
                            className="h-44 w-full rounded-xl object-cover"
                          />
                          <div className="absolute right-3 top-3 flex gap-2">
                            <Badge tone="gold">{catLabel(n.category)}</Badge>
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority]}</Badge>
                          </div>
                          {n.pinned && (
                            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-accent-400/40 bg-[#0b0f18]/85 px-2 py-1 text-[11px] text-accent-300 backdrop-blur">
                              <Pin size={11} /> Ù…Ø«Ø¨Øª
                            </span>
                          )}
                        </div>
                      )}
                      {!n.images?.[0] && !n.image && n.video && (
                        <div className="relative mb-4 flex h-44 items-center justify-center rounded-xl bg-gray-900">
                          <span className="clip-hex flex h-14 w-14 items-center justify-center border border-accent-500/40 bg-accent-500/10">
                            <Play size={24} className="text-accent-400" />
                          </span>
                          <div className="absolute right-3 top-3 flex gap-2">
                            <Badge tone="gold">{catLabel(n.category)}</Badge>
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority]}</Badge>
                          </div>
                        </div>
                      )}
                      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-accent-500/30 bg-accent-500/10 text-[9px] font-bold text-accent-400">
                          {n.author.slice(0, 1)}
                        </span>
                        <span className="font-semibold text-slate-300">{n.author}</span>
                        <span>Â·</span>
                        <span>{timeAgo(n.publishedAt)}</span>
                      </div>
                      <h3 className="mb-2 font-display text-lg font-bold leading-snug text-slate-50 transition-colors group-hover:text-accent-400">
                        {n.titleAr}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">{n.bodyAr}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="flex items-center gap-1 rounded-full border border-accent-400/25 bg-accent-500/10 px-3 py-1 text-xs font-semibold text-accent-400 transition-all group-hover:border-accent-400/60 group-hover:bg-accent-500/15">
                          Ø§Ù‚Ø±Ø£ Ø§Ù„Ø®Ø¨Ø±
                          <ChevronLeft size={13} className="rtl:rotate-180 transition-transform group-hover:translate-x-[-2px] group-hover:rtl:translate-x-[2px]" />
                        </span>
                        <span className="text-xs text-slate-500">Ù…Ø´Ø§Ù‡Ø¯Ø©: {number(n.views)}</span>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar modules */}
        <div className="space-y-6">
          <Card className="text-center">
            <div className="clip-hex mx-auto mb-3 flex h-14 w-14 items-center justify-center border border-accent-500/30 bg-accent-500/10">
              <ShieldCheck className="h-7 w-7 text-accent-400" />
            </div>
            <div className="font-display text-5xl font-bold text-slate-50">{onDuty}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">Ø§Ù„Ø£ÙØ±Ø§Ø¯ ÙÙŠ Ø§Ù„Ø®Ø¯Ù…Ø©</div>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-[11px] text-accent-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-500/15" />
              </span>
              Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø¢Ù†
            </span>
          </Card>

          <Card>
            <SectionTitle icon={Crown}>Ø§Ù„ØªÙˆØ²ÙŠØ¹ Ø­Ø³Ø¨ Ø§Ù„Ø±ØªØ¨</SectionTitle>
            <div className="space-y-4">
              {RANKS.map((r) => {
                const count = officers.filter((o) => o.rankId === r.id).length;
                const pct = (count / totalRanked) * 100;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-xs text-slate-400">{r.titleAr}</span>
                    <ProgressBar value={pct} className="flex-1" />
                    <span className="w-6 text-right text-sm font-bold text-accent-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


