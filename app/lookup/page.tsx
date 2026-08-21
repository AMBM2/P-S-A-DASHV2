"use client";

import { useMemo, useState } from "react";
import { Search, Fingerprint, BadgeCheck } from "lucide-react";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AR } from "@/lib/ar";

export default function LookupPage() {
  const { officers, getRankTitle, getDepartmentTitle } = useStore();
  const [q, setQ] = useState("");

  const result = useMemo(() => {
    if (!q.trim()) return null;
    const term = q.trim().toLowerCase();
    return officers
      .filter((o) =>
        [o.nameAr, o.name, o.badge, o.callsign, o.discordId, o.discordTag]
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [q, officers]);

  return (
    <div>
      <SectionTitle icon={Fingerprint}>استعلام ميداني</SectionTitle>
      <Card className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-gray-400 ltr:left-4 rtl:right-4" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="أدخل الاسم · الرقم التعريفي · النداء · معرّف Discord"
            className="w-full rounded-lg border-2 border-gray-300 bg-white py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-accent-500"
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">تُظهر نتائج فورية لأفراد الأمن العام المسجلين.</p>
      </Card>

      {!q.trim() && <EmptyState message="ابدأ الكتابة للبحث عن فرد" />}
      {q.trim() && result && result.length === 0 && <EmptyState message="لا يوجد فرد مطابق" />}

      {result && result.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.map((o) => (
            <Card key={o.id} hover className="flex items-center gap-4">
              <div className="clip-hex flex h-14 w-14 shrink-0 items-center justify-center border border-accent-400/30 bg-accent-50 font-display text-lg font-bold text-accent-600">
                {o.nameAr.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-gray-900">{o.nameAr}</div>
                <div className="truncate text-xs text-gray-500">{o.badge} · #{o.callsign}</div>
                <div className="mt-1">
                  <Badge tone={o.status === "on-duty" ? "green" : o.status === "suspended" ? "rose" : "slate"}>
                    {AR.status[o.status]}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-400">
                <div>{getRankTitle(o.rankId)}</div>
                <div>{getDepartmentTitle(o.departmentId)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
