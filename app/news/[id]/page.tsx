"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Eye, Calendar, User, Pin, Play } from "lucide-react";
import { Card, Badge, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { timeAgo, number } from "@/lib/format";
import { AR } from "@/lib/ar";

export default function NewsDetail() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { news, settings } = useStore();
  const item = news.find((n) => n.id === id);

  const catLabel = (cid: string) =>
    (settings.newsCategories || []).find((c) => c.id === cid)?.labelAr || cid;

  useEffect(() => {
    if (item) {
      fetch("/api/news/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    }
  }, [item]);

  if (!item) {
    return (
      <div>
        <button onClick={() => router.back()} className="mb-4 text-sm text-accent-600 hover:underline">
          ← رجوع
        </button>
        <EmptyState message="الخبر غير موجود" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-accent-600 hover:underline">
        <ArrowRight size={14} className="rtl:rotate-180" /> العودة للرئيسية
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="gold">{catLabel(item.category)}</Badge>
        <Badge tone={item.priority === "critical" ? "rose" : item.priority === "high" ? "amber" : "slate"}>
          {AR.priority[item.priority]}
        </Badge>
        {item.pinned && (
          <Badge tone="gold">
            <Pin size={11} /> مثبت
          </Badge>
        )}
      </div>

      <h1 className="mb-3 font-display text-3xl font-extrabold leading-tight text-gray-900 md:text-4xl">
        {item.titleAr}
      </h1>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <User size={13} /> {item.author}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={13} /> {timeAgo(item.publishedAt)}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={13} /> {number(item.views)} مشاهدة
        </span>
      </div>

      {(item.images?.[0] || item.image) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.images?.[0] || item.image} alt="" className="mb-6 max-h-[420px] w-full rounded-2xl object-cover" />
      )}
      {item.video && !item.images?.[0] && !item.image && (
        <div className="mb-6 flex aspect-video items-center justify-center rounded-2xl bg-gray-900">
          <Play size={40} className="text-white" />
        </div>
      )}

      <Card>
        <p className="whitespace-pre-line text-base leading-loose text-gray-700">{item.bodyAr}</p>
      </Card>
    </div>
  );
}
