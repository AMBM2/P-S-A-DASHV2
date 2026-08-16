"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Shield, Loader2, Users } from "lucide-react";
import { Button, Card, EmptyState } from "@/components/ui";
import { RANKS, DEPARTMENTS } from "@/lib/seed";
import { cn } from "@/lib/format";

type RoleRow = {
  id: string;
  name: string;
  position: number;
  color: string;
  members: number;
};

function normalize(name: string) {
  return String(name || "")
    .toLowerCase()
    .replace(/[\u0640]/g, "")
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff\u0660-\u0669]+/g, " ")
    .trim();
}

function matchRank(name: string) {
  const norm = normalize(name);
  if (!norm) return null;
  let exact: { rank: any; n: string } | null = null;
  for (const r of RANKS) {
    const names = [r.id, r.title, r.titleAr].map(normalize).filter(Boolean);
    if (names.includes(norm) && (!exact || r.level > exact.rank.level)) exact = { rank: r, n: norm };
  }
  if (exact) return exact.rank;
  let best: any = null;
  for (const r of RANKS) {
    const names = [r.id, r.title, r.titleAr].map(normalize).filter(Boolean);
    if (names.some((n) => n.length >= 4 && norm.includes(n)) && (!best || r.level > best.level)) best = r;
  }
  return best;
}

function matchDepartment(name: string) {
  const norm = normalize(name);
  if (!norm) return null;
  for (const d of DEPARTMENTS) {
    const targets = [d.id, d.name, d.nameAr].map(normalize).filter(Boolean);
    if (targets.includes(norm) || targets.some((t) => t.length >= 4 && norm.includes(t))) return d;
  }
  return null;
}

export function RolesManager() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [guild, setGuild] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/discord/roles", { cache: "no-store" });
      const d = await r.json();
      if (d.ok && Array.isArray(d.roles)) {
        setRoles(d.roles);
        setGuild(d.guild || "");
      } else {
        setError(d.error || "تعذر جلب الرولات من البوت");
      }
    } catch {
      setError("تعذر الوصول للبوت");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-display text-lg font-bold gold-text">
            <Shield size={18} /> رولات ديسكورد ({guild && `— ${guild}`})
          </h3>
          <p className="text-xs text-zinc-500">مباشرة من سيرفر ديسكورد — مرتبة حسب التسلسل مع عدد الأعضاء</p>
        </div>
        <Button onClick={refresh} disabled={refreshing} variant="outline">
          {refreshing ? <Loader2 size={16} className="ml-2 animate-spin" /> : <RefreshCw size={16} className="ml-2" />}
          تحديث
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
      )}

      {loading ? (
        <div className="py-10 text-center text-zinc-500">جارٍ التحميل...</div>
      ) : roles.length === 0 ? (
        <EmptyState message="لا توجد رولات — تأكد من ربط البوت بالسيرفر" />
      ) : (
        <Card className="p-0">
          <div className="max-h-[560px] divide-y divide-gold-400/10 overflow-y-auto scrollbar-thin">
            {roles.map((r) => {
              const rank = matchRank(r.name);
              const dept = matchDepartment(r.name);
              const isRank = !!rank;
              const bg = r.color && r.color !== "#000000" ? r.color : "#99aab5";
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gold-400/5"
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/30"
                    style={{ background: bg, boxShadow: `0 0 8px ${bg}55` }}
                  />
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-sm font-semibold",
                      isRank ? "text-gold-100" : "text-zinc-200"
                    )}
                  >
                    {r.name}
                  </span>
                  {isRank && (
                    <span className="rounded border border-gold-400/30 bg-gold-400/10 px-1.5 py-0.5 text-[10px] font-bold text-gold-200">
                      رتبة · {rank.titleAr}
                    </span>
                  )}
                  {dept && !isRank && (
                    <span className="rounded border border-gold-400/25 bg-gold-400/5 px-1.5 py-0.5 text-[10px] font-bold text-gold-300/80">
                      إدارة · {dept.nameAr}
                    </span>
                  )}
                  <span className="mr-auto flex items-center gap-1 font-mono text-xs text-zinc-500">
                    <Users size={12} /> {r.members}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}