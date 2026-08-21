"use client";

import { Crown, Mail, Phone } from "lucide-react";
import { Card, Badge, SectionTitle, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function LeadershipPage() {
  const { leaders, getRankTitle, getDepartmentTitle } = useStore();
  const ordered = [...leaders].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div>
      <SectionTitle icon={Crown}>هيكل القيادة</SectionTitle>
      {ordered.length === 0 ? (
        <EmptyState message="لا يوجد قادة مضافون" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ordered.map((l) => (
            <Card key={l.id} hover className="relative">
              <span className="pointer-events-none absolute inset-0 clip-notch opacity-0 [background:radial-gradient(120%_120%_at_100%_0%,rgba(var(--accent-rgb),0.08),transparent_40%)] group-hover:opacity-100" />
              <div className="flex items-center gap-4">
                <div className="clip-hex relative flex h-16 w-16 items-center justify-center border border-accent-400/40 bg-accent-50">
                  <Crown className="h-7 w-7 text-accent-600" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold text-gray-900">{l.nameAr}</div>
                  <div className="text-xs text-accent-600">{getRankTitle(l.rankId)}</div>
                  <div className="text-xs text-gray-500">{getDepartmentTitle(l.departmentId)}</div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-gray-600">{l.bioAr}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {l.contactEmail && (
                  <span className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[11px] text-gray-500">
                    <Mail size={11} /> {l.contactEmail}
                  </span>
                )}
                {l.contactPhone && (
                  <span className="flex items-center gap-1 rounded-full border border-gray-200 px-2 py-1 text-[11px] text-gray-500">
                    <Phone size={11} /> {l.contactPhone}
                  </span>
                )}
              </div>
              {l.tags && l.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {l.tags.map((t) => (
                    <Badge key={t} tone="gold">{t}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
