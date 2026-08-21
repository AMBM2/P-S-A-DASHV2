"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, EmptyState } from "@/components/ui";
import { RANKS } from "@/lib/seed";
import { formatDate } from "@/lib/format";

export default function PersonnelPage() {
  const { officers, settings } = useStore();
  const lang = settings.language;
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return officers.filter((o) => {
      if (!q) return true;
      const s = (o.name + o.nameAr + o.badge + o.callsign).toLowerCase();
      return s.includes(q.toLowerCase());
    });
  }, [officers, q]);

  return (
    <div>
      <PageHeader
        title={lang === "ar" ? "صفحة الأفراد والضباط" : "Officers & Personnel"}
        subtitle={
          lang === "ar"
            ? "سجل الضباط — الافتار، الاسم، النيك نيم، الرتبة، الكود العسكري، وتاريخ الانضمام"
            : "Officer roster — avatar, name, nickname, rank, badge/callsign and date joined"
        }
      />

      <div className="mb-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 text-zinc-500 ltr:left-3 rtl:right-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "ar" ? "بحث بالاسم أو الكود..." : "Search by name or code..."}
            className="w-full rounded-lg border border-gold-400/25 bg-obsidian-900/70 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gold-400/70"
          />
        </div>
        <span className="text-sm text-zinc-400">
          {lang === "ar" ? `${filtered.length} فرد` : `${filtered.length} personnel`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={lang === "ar" ? "لا يوجد أفراد مطابقون" : "No matching personnel"} />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gold-400/20 bg-obsidian-900/60 text-xs uppercase tracking-wider text-zinc-400">
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "الافتار" : "Avatar"}</th>
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "الاسم" : "Name"}</th>
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "النيك نيم" : "Nickname"}</th>
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "الرتبة" : "Rank"}</th>
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "الكود العسكري" : "Badge / Call Sign"}</th>
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "نقاط الميدان" : "Field Points"}</th>
                  <th className="px-5 py-4 text-right">{lang === "ar" ? "تاريخ الانضمام" : "Date Joined"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-400/15">
                {filtered.map((o) => {
                  const rank = RANKS.find((r) => r.id === o.rankId);
                  const avatar = o.discordAvatar || "";
                  const initials = (o.nameAr || o.name || "؟").trim().slice(0, 2);
                  const joined = o.joinedAt.includes("T")
                    ? o.joinedAt
                    : o.joinedAt + "T00:00:00";
                  return (
                    <tr key={o.id} className="transition-colors hover:bg-gold-400/5">
                      <td className="px-5 py-3">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={o.nameAr || o.name}
                            className="h-10 w-10 rounded-full border border-gold-400/40 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/40 bg-obsidian-900 text-xs font-bold text-gold-300">
                            {initials}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white" dir="ltr">
                        {o.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        <div>{o.nameAr || "—"}</div>
                        {o.discordId && (
                          <div className="mt-0.5 font-mono text-[11px] text-zinc-500" dir="ltr">
                            ID: {o.discordId}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {rank ? (lang === "ar" ? rank.titleAr : rank.title) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-gold-300">{o.badge}</span>
                        <span className="mx-1 text-zinc-600">·</span>
                        <span className="font-mono text-gray-600">{o.callsign}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-full border border-gold-300/40 bg-gold-400/10 px-2 py-0.5 font-bold text-gold-200">
                          {o.fieldPoints ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400">{formatDate(joined, lang)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
