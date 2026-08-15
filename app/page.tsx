"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, Crown, Pin, Search, Eye, ShieldCheck, MessageSquare, ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Badge, ProgressBar, EmptyState } from "@/components/ui";
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
      {/* Prestige Hero Banner */}
      <div className="gold-shimmer relative mb-10 overflow-hidden rounded-2xl border border-gold-400/25 bg-gradient-to-br from-obsidian-800 via-obsidian-900 to-black p-10 md:p-14">
        <div className="pointer-events-none absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-gold-300/60" />
        <div className="pointer-events-none absolute right-3 bottom-3 h-6 w-6 border-r-2 border-b-2 border-gold-300/60" />
        <div className="pointer-events-none absolute left-3 bottom-3 h-6 w-6 border-l-2 border-b-2 border-gold-300/40" />
        <div className="pointer-events-none absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-gold-300/40" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }} />
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-gold-600/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-right">
          <div>
            {/* Official government ribbon */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-gold-200">
              <ShieldCheck size={14} />
              {lang === "ar" ? "المنصة الرسمية لقوات الأمن العام" : "Official Public Security Command"}
            </div>

            <div className="mb-4 flex items-center justify-center gap-3 md:justify-start">
              <span className="h-px w-10 bg-gradient-to-l from-gold-400/60 to-transparent" />
              <span className="text-gold-300">{lang === "ar" ? "— رئيس الوزراء —" : "— Prime Minister —"}</span>
              <span className="h-px w-10 bg-gradient-to-r from-gold-400/60 to-transparent" />
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-600 bg-clip-text text-transparent">
                {lang === "ar" ? "بوابة الأمن العام" : "Public Security Portal"}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
              {lang === "ar"
                ? "المنصة الإدارية الموحدة لأخبار القيادة، الأفراد في الخدمة، والتوزيع حسب الرتب."
                : "The unified administrative platform for command news, on-duty personnel and rank distribution."}
            </p>
          </div>

          {/* Official emblem in glowing glass ring */}
          <div className="relative shrink-0">
            <div className="absolute -inset-3 rounded-full border border-gold-400/20" />
            <div className="absolute -inset-3 rounded-full border border-dashed border-gold-400/20 animate-[spin_40s_linear_infinite]" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-gold-400/25 bg-gold-400/5 backdrop-blur-md shadow-[0_0_32px_rgba(217,180,91,0.28)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/psa-logo.png"
                alt="PSA"
                className="h-28 w-28 rounded-full object-contain"
                style={{ filter: "drop-shadow(0 0 12px rgba(217,180,91,0.4))" }}
              />
            </div>
          </div>
        </div>

        <div className="relative mb-10 mt-2 flex items-center justify-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/40 to-gold-400/60" />
          <div className="flex items-center gap-1 text-gold-400">
            <span className="block h-1.5 w-1.5 rotate-45 border border-gold-400/70" />
            <span className="block h-2.5 w-2.5 rotate-45 bg-gold-400/30" />
            <span className="block h-1.5 w-1.5 rotate-45 border border-gold-400/70" />
          </div>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-400/40 to-gold-400/60" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Module 1: News Feed */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold gold-text">
              <Newspaper size={20} /> {lang === "ar" ? "أخبار الأمن العام" : "Directives & News"}
            </h2>
            <div className="flex items-center gap-3">
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
            <div className="space-y-4">
              {filtered.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/news/${n.id}`} className="block group">
                    <Card hover className="overflow-hidden">
                      {(n.images?.[0] || n.image) && (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={n.images?.[0] || n.image}
                            alt=""
                            className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-48"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/30 to-transparent" />
                          <div className="absolute right-3 top-3 flex gap-2">
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority] || n.priority}</Badge>
                            <Badge tone="slate">{catLabel(n.category)}</Badge>
                          </div>
                          {n.pinned && (
                            <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-gold-400/40 bg-black/50 px-2 py-1 text-[11px] text-gold-200 backdrop-blur">
                              <Pin size={11} /> {lang === "ar" ? "مثبت" : "Pinned"}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-5">
                        {!n.image && (
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority] || n.priority}</Badge>
                            <Badge tone="slate">{catLabel(n.category)}</Badge>
                            {n.pinned && (
                              <span className="flex items-center gap-1 text-xs text-gold-300">
                                <Pin size={12} /> {lang === "ar" ? "مثبت" : "Pinned"}
                              </span>
                            )}
                          </div>
                        )}
                        <h3 className="mb-2 font-display text-lg font-bold leading-snug text-white transition-colors group-hover:text-gold-200">
                          {lang === "ar" ? n.titleAr : n.title}
                        </h3>
                        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                          {lang === "ar" ? n.bodyAr : n.body}
                        </p>
                        <div className="flex items-center justify-between border-t border-gold-400/10 pt-3 text-xs text-zinc-500">
                          <span>
                            {timeAgo(n.publishedAt)} · {n.author}
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye size={13} /> {number(n.views)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={13} />
                            </span>
                            <span className="flex items-center gap-1 text-gold-300 transition-transform group-hover:translate-x-[-3px]">
                              {lang === "ar" ? "اقرأ الخبر" : "Read"}
                              <ChevronLeft size={14} className="rtl:rotate-180" />
                            </span>
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
          <Card className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10">
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
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold gold-text">
              <Crown size={18} /> {lang === "ar" ? "التوزيع حسب الرتب" : "Rank Distribution"}
            </h2>
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
