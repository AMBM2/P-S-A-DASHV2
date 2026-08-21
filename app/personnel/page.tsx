"use client";

import { useMemo, useState } from "react";
import { Search, Users, BadgeCheck, Clock, UserX } from "lucide-react";
import { Card, Badge, EmptyState, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import { AR } from "@/lib/ar";
import { cn } from "@/lib/format";

export default function PersonnelPage() {
  const { officers, getRankTitle, getDepartmentTitle } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  const list = useMemo(() => {
    return officers
      .filter((o) => (status === "all" ? true : o.status === status))
      .filter((o) =>
        q.trim()
          ? [o.nameAr, o.name, o.badge, o.callsign, o.discordId, o.discordTag]
              .join(" ")
              .toLowerCase()
              .includes(q.trim().toLowerCase())
          : true
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [officers, q, status]);

  const counts = {
    all: officers.length,
    "on-duty": officers.filter((o) => o.status === "on-duty").length,
    "off-duty": officers.filter((o) => o.status === "off-duty").length,
    suspended: officers.filter((o) => o.status === "suspended").length,
  };

  return (
    <div>
      <SectionTitle icon={Users}>Ø³Ø¬Ù„ Ø§Ù„Ø£ÙØ±Ø§Ø¯</SectionTitle>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { k: "all", label: "Ø§Ù„ÙƒÙ„", icon: Users },
            { k: "on-duty", label: "ÙÙŠ Ø§Ù„Ø®Ø¯Ù…Ø©", icon: BadgeCheck },
            { k: "off-duty", label: "Ø®Ø§Ø±Ø¬ Ø§Ù„Ø®Ø¯Ù…Ø©", icon: Clock },
            { k: "suspended", label: "Ù…ÙˆÙ‚ÙˆÙ", icon: UserX },
          ].map((s) => (
            <button
              key={s.k}
              onClick={() => setStatus(s.k)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                status === s.k
                  ? "border-accent-400/60 bg-accent-50 text-accent-700"
                  : "border-gray-200 text-gray-500 hover:border-accent-400/40 hover:text-accent-600"
              )}
            >
              <s.icon size={13} /> {s.label} <span className="opacity-70">{counts[s.k as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-gray-400 ltr:left-3 rtl:right-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… / Ø§Ù„Ø±ØªØ¨Ø© / Ø§Ù„Ø±Ù‚Ù…"
            className="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 outline-none focus:border-accent-500"
          />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState message="Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ø£ÙØ±Ø§Ø¯ Ù…Ø·Ø§Ø¨Ù‚ÙˆÙ†" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((o) => (
            <Card key={o.id} hover className="flex items-center gap-4">
              <div className="clip-hex flex h-14 w-14 shrink-0 items-center justify-center border border-accent-400/30 bg-accent-50 font-display text-lg font-bold text-accent-600">
                {o.nameAr.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-gray-900">{o.nameAr}</div>
                <div className="truncate text-xs text-gray-500">{getRankTitle(o.rankId)} Â· {getDepartmentTitle(o.departmentId)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={o.status === "on-duty" ? "green" : o.status === "suspended" ? "rose" : "slate"}>
                    {AR.status[o.status]}
                  </Badge>
                  {o.callsign && <span className="text-[11px] text-gray-400">#{o.callsign}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

