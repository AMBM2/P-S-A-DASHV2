"use client";

import { Radio, Hash } from "lucide-react";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function FieldPage() {
  const { codes } = useStore();
  const ordered = [...codes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div>
      <SectionTitle icon={Radio}>أوامر وأكواد الميدان</SectionTitle>
      {ordered.length === 0 ? (
        <EmptyState message="لا توجد أكواد ميدانية مضافة" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((c) => (
            <Card key={c.id} hover className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="clip-notch-sm flex h-9 w-9 items-center justify-center border border-accent-500/30 bg-accent-500/10 text-accent-300">
                    <Hash size={15} />
                  </span>
                  <span className="font-display text-lg font-bold text-slate-50">{c.code}</span>
                </div>
                <Badge tone={c.type === "emergency" ? "rose" : c.type === "tactical" ? "amber" : "gold"}>
                  {c.type === "emergency" ? "طوارئ" : c.type === "tactical" ? "تكتيكي" : "عام"}
                </Badge>
              </div>
              <div>
                <div className="font-semibold text-slate-50">{c.titleAr}</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{c.bodyAr}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

