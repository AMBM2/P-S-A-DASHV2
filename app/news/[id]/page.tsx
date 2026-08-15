"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Calendar, Eye, Pin, User } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { AR } from "@/lib/ar";
import { supabase } from "@/lib/supabase";
import { NewsComments } from "@/components/NewsComments";

const PRIORITY_TONE: Record<string, any> = {
  critical: "rose",
  high: "amber",
  normal: "gold",
  low: "slate",
};

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { news, settings } = useStore();
  const lang = settings.language;
  const [activeImg, setActiveImg] = useState(0);

  const item = news.find((n) => n.id === id);
  const cats = settings.newsCategories || [];
  const catLabel = (cid: string) => {
    const c = cats.find((x) => x.id === cid);
    return lang === "ar" ? c?.labelAr || AR.category[cid] || cid : c?.label || cid;
  };

  const images = item?.images?.length ? item.images : item?.image ? [item.image] : [];

  useEffect(() => {
    if (!id || !item) return;
    supabase
      .from("news")
      .update({ views: (item.views || 0) + 1 })
      .eq("id", id)
      .then(() => {});
  }, [id, item?.views]);

  useEffect(() => {
    setActiveImg(0);
  }, [id]);

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState message={lang === "ar" ? "الخبر غير موجود" : "Article not found"} />
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gold-300 hover:underline">
            {lang === "ar" ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-gold-300 hover:underline">
        <ArrowRight size={14} className="rtl:rotate-180" />
        {lang === "ar" ? "العودة إلى الأخبار" : "Back to news"}
      </Link>

      <Card className="overflow-hidden">
        {images.length > 0 && (
          <div>
            <div className="relative bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImg]}
                alt=""
                className="max-h-96 w-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="flex flex-wrap gap-2 border-t border-gold-400/10 bg-obsidian-900/60 p-3">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`overflow-hidden rounded-lg border transition-all ${
                      i === activeImg
                        ? "border-gold-400/80 ring-2 ring-gold-400/30"
                        : "border-gold-400/15 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-14 w-20 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={PRIORITY_TONE[item.priority]}>{AR.priority[item.priority] || item.priority}</Badge>
            <Badge tone="slate">{catLabel(item.category)}</Badge>
            {item.pinned && (
              <span className="flex items-center gap-1 text-xs text-gold-300">
                <Pin size={12} /> {lang === "ar" ? "مثبت" : "Pinned"}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl font-bold leading-snug text-white md:text-3xl">
            {lang === "ar" ? item.titleAr : item.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-gold-400/10 py-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <User size={13} /> {item.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {formatDate(item.publishedAt, lang)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={13} /> {item.views + 1} {lang === "ar" ? "مشاهدة" : "views"}
            </span>
          </div>

          <div className="mt-6 whitespace-pre-wrap text-[15px] leading-loose text-zinc-300">
            {lang === "ar" ? item.bodyAr : item.body}
          </div>
        </div>
      </Card>

      <NewsComments newsId={item.id} enabled={item.commentsEnabled} />
    </div>
  );
}