"use client";

import { useStore } from "@/lib/store";

export function Ticker() {
  const { news } = useStore();
  const urgent = news.filter((n) => n.priority === "critical" || n.priority === "high");

  if (urgent.length === 0) return null;

  const items = urgent.map((n) => n.titleAr + " • " + n.title).join("  ///  ");

  return (
    <div className="relative z-10 overflow-hidden border-b border-gold-400/30 bg-[rgba(var(--glass),0.85)] backdrop-blur">
      <div className="flex whitespace-nowrap py-1.5">
        <div className="flex min-w-full shrink-0 animate-ticker items-center gap-8 px-4">
          <span className="text-sm font-semibold text-gold-200">{items}</span>
          <span className="text-sm font-semibold text-gold-200">{items}</span>
        </div>
      </div>
    </div>
  );
}
