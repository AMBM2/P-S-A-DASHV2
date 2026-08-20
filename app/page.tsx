"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Atropos from "atropos/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Newspaper, Crown, Pin, Search, Eye, ShieldCheck, MessageSquare, ChevronLeft, Play } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Badge, ProgressBar, EmptyState, SectionTitle } from "@/components/ui";
import { AuroraBackground, GlowCard, BorderBeam } from "@/components/effects";
import { timeAgo, number } from "@/lib/format";
import { AR } from "@/lib/ar";
import { RANKS } from "@/lib/seed";

const PRIORITY_TONE: Record<string, any> = {
  critical: "rose",
  high: "amber",
  normal: "gold",
  low: "slate",
};

export default function HomePage() {
  const { news, officers, settings } = useStore();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [feedRef] = useAutoAnimate<HTMLDivElement>();

  const lang = settings.language;
  const onDuty = officers.filter((o) => o.status === "on-duty").length;
  const cats = settings.newsCategories || [];

  const catLabel = (cid: string) => {
    const c = cats.find((x) => x.id === cid);
    return lang === "ar" ? c?.labelAr || AR.category[cid] || cid : c?.label || cid;
  };

  const filtered = useMemo(() => {
    return news
      .filter((n) => n.status === "published")
      .filter((n) => cat === "all" || n.category === cat)
      .filter((n) => {
        if (!q) return true;
        const s = (n.title + n.titleAr + n.body + n.bodyAr).toLowerCase();
        return s.includes(q.toLowerCase());
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.publishedAt) - +new Date(a.publishedAt));
  }, [news, cat, q, cats]);

  const totalRanked = RANKS.reduce((sum, r) => sum + officers.filter((o) => o.rankId === r.id).length, 0) || 1;

  return (
    <div>
      {/* Command Hero */}
      <div className="clip-notch relative mb-10 overflow-hidden border border-gold-400/20 bg-[rgba(var(--glass),0.6)] p-8 backdrop-blur-xl md:p-12">
        <AuroraBackground />
        <BorderBeam size={280} duration={9} />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-right">
          <div className="max-w-xl">
            <div className="clip-notch-sm mb-4 inline-flex items-center gap-2 border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-gold-200">
              <ShieldCheck size={14} />
              {lang === "ar" ? "المنصة الرسمية لقوات الأمن العام" : "Official Public Security Command"}
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight gold-text md:text-6xl">
              {lang === "ar" ? "بوابة الأمن العام" : "Public Security Portal"}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 md:text-base">
              {lang === "ar"
                ? "المنصة الإدارية الموحدة لأخبار القيادة، الأفراد في الخدمة، والتوزيع حسب الرتب."
                : "The unified administrative platform for command news, on-duty personnel and rank distribution."}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 md:justify-start">
              <span className="v100-badge">V300</span>
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-gold-300/80">
                <span className="h-1.5 w-1.5 rotate-45 bg-gold-400/80" />
                Command Operations
              </span>
            </div>
          </div>

          {/* Official emblem — Atropos 3D parallax */}
          <Atropos
            className="relative shrink-0"
            rotateXMax={16}
            rotateYMax={16}
            shadow={false}
            highlight={false}
          >
            <div data-atropos-offset="-6">
              <div className="clip-hex absolute -inset-3 border border-gold-400/25" />
            </div>
            <div data-atropos-offset="-3">
              <div className="clip-hex absolute -inset-3 border border-dashed border-gold-400/20 animate-[spin_40s_linear_infinite]" />
            </div>
            <div
              data-atropos-offset="5"
              className="clip-hex relative flex h-36 w-36 items-center justify-center border border-gold-400/30 bg-gold-400/5 backdrop-blur-md gold-glow-strong animate-[goldPulse_4s_ease-in-out_infinite]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/psa-logo.png"
                alt="PSA"
                className="h-28 w-28 rounded-full object-contain"
                style={{ filter: "drop-shadow(0 0 12px rgba(var(--accent-rgb),0.4))" }}
              />
            </div>
          </Atropos>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Module 1: News Feed */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <SectionTitle icon={Newspaper}>
              {lang === "ar" ? "أخبار الأمن العام" : "Directives & News"}
            </SectionTitle>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-zinc-500 ltr:left-3 rtl:right-3" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={lang === "ar" ? "بحث..." : "Search..."}
                  className="w-40 rounded-lg border border-gold-400/20 bg-obsidian-900/60 py-1.5 pl-8 pr-3 text-xs text-zinc-100 outline-none focus:border-gold-400/70"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[{ id: "all", labelAr: "الكل", label: "All" }, ...cats].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition-all ${
                      cat === c.id
                        ? "border-gold-400/60 bg-gold-400/15 text-gold-200"
                        : "border-gold-400/15 text-zinc-400 hover:border-gold-400/40 hover:text-zinc-200"
                    }`}
                  >
                    {lang === "ar" ? c.labelAr : c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState message={lang === "ar" ? "لا توجد أخبار مطابقة" : "No matching news"} />
          ) : (
            <div className="space-y-4" ref={feedRef}>
              {filtered.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/news/${n.id}`} className="block group">
                    <Card hover className="relative overflow-hidden">
                      <span className="pointer-events-none absolute inset-y-0 right-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 transition-transform duration-300 group-hover:scale-y-100" />
                      {(n.images?.[0] || n.image) && (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={n.images?.[0] || n.image}
                            alt=""
                            className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-44"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/20 to-transparent" />
                          <div className="absolute right-3 top-3 flex gap-2">
                            <Badge tone="gold">{catLabel(n.category)}</Badge>
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority] || n.priority}</Badge>
                          </div>
                          {n.pinned && (
                            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-gold-400/40 bg-black/50 px-2 py-1 text-[11px] text-gold-200 backdrop-blur">
                              <Pin size={11} /> {lang === "ar" ? "مثبت" : "Pinned"}
                            </span>
                          )}
                          {n.video && (
                            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-gold-400/30 bg-black/60 px-2 py-0.5 text-[11px] text-white backdrop-blur">
                              <Play size={11} /> {lang === "ar" ? "فيديو" : "Video"}
                            </span>
                          )}
                          <div className="absolute bottom-3 right-3 flex items-center gap-2 text-[11px] text-zinc-300">
                            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur">
                              <Eye size={11} /> {number(n.views)}
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 backdrop-blur">
                              <MessageSquare size={11} /> تعليقات
                            </span>
                          </div>
                        </div>
                      )}
                      {!n.images?.[0] && !n.image && n.video && (
                        <div className="relative flex h-40 items-center justify-center bg-black sm:h-44">
                          <span className="clip-hex flex h-14 w-14 items-center justify-center border border-gold-400/40 bg-gold-400/10">
                            <Play size={24} className="text-gold-300" />
                          </span>
                          <div className="absolute right-3 top-3 flex gap-2">
                            <Badge tone="gold">{catLabel(n.category)}</Badge>
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority] || n.priority}</Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        {!n.images?.[0] && !n.image && (
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Badge tone="gold">{catLabel(n.category)}</Badge>
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority] || n.priority}</Badge>
                            {n.pinned && (
                              <span className="flex items-center gap-1 text-xs text-gold-300">
                                <Pin size={12} /> {lang === "ar" ? "مثبت" : "Pinned"}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-zinc-500">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-[9px] font-bold text-gold-300">
                            {n.author.slice(0, 1)}
                          </span>
                          <span className="font-semibold text-zinc-400">{n.author}</span>
                          <span>·</span>
                          <span>{timeAgo(n.publishedAt)}</span>
                        </div>

                        <h3 className="mb-2 font-display text-lg font-bold leading-snug text-white transition-colors group-hover:text-gold-200">
                          {lang === "ar" ? n.titleAr : n.title}
                        </h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">
                          {lang === "ar" ? n.bodyAr : n.body}
                        </p>

                        <div className="mt-4 flex items-center justify-between border-t border-gold-400/10 pt-3">
                          <span className="flex items-center gap-1 rounded-full border border-gold-400/25 bg-gold-400/5 px-3 py-1 text-xs font-semibold text-gold-200 transition-all group-hover:border-gold-400/60 group-hover:bg-gold-400/15">
                            {lang === "ar" ? "اقرأ الخبر" : "Read"}
                            <ChevronLeft size={13} className="rtl:rotate-180 transition-transform group-hover:translate-x-[-2px] group-hover:rtl:translate-x-[2px]" />
                          </span>
                          <span className="text-xs text-zinc-500">
                            {lang === "ar" ? "مشاهدة" : "views"}: {number(n.views)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Module 2 + 3: On-Duty Counter & Rank Distribution */}
        <div className="space-y-6">
          <GlowCard intensity={0.6} className="text-center">
            <div className="clip-hex mx-auto mb-3 flex h-14 w-14 items-center justify-center border border-gold-400/30 bg-gold-400/10 gold-pulse">
              <ShieldCheck className="h-7 w-7 text-gold-300" />
            </div>
            <div className="font-display text-5xl font-bold gold-text">{onDuty}</div>
            <div className="mt-1 text-xs uppercase tracking-widest text-zinc-400">
              {lang === "ar" ? "الأفراد في الخدمة" : "Officers On Duty"}
            </div>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-[11px] text-gold-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold-300" />
              </span>
              {lang === "ar" ? "الخدمة الآن" : "On shift"}
            </span>
          </GlowCard>

          <Card>
            <SectionTitle icon={Crown}>
              {lang === "ar" ? "التوزيع حسب الرتب" : "Rank Distribution"}
            </SectionTitle>
            <div className="space-y-4">
              {RANKS.map((r) => {
                const count = officers.filter((o) => o.rankId === r.id).length;
                const pct = (count / totalRanked) * 100;
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-xs text-zinc-400">
                      {lang === "ar" ? r.titleAr : r.title}
                    </span>
                    <ProgressBar value={pct} className="flex-1" />
                    <span className="w-6 text-right text-sm font-bold text-gold-200">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 border-t border-gold-400/15 pt-3 text-sm text-zinc-400">
              <span className="font-display text-lg font-bold gold-text">{officers.length}</span>{" "}
              {lang === "ar" ? "إجمالي الأفراد" : "total personnel"}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
