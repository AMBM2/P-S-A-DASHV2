"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Hash, CircleDot } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/format";

type Pool = {
  prefix: string;
  start: number;
  end: number;
  used: number;
  available?: number;
  next: string | null;
  rankId?: string;
};

type Stats = {
  pools: Pool[];
  N: Pool;
  NT: Pool;
  NH?: Pool[];
};

export function BadgeCodesManager() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/badges", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setStats(d);
      else setError(d.error || "تعذر جلب حالة الأكواد");
    } catch {
      setError("تعذر الاتصال بالبوت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const PoolCard = ({ title, desc, p }: { title: string; desc: string; p: Pool }) => (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-sm font-bold gold-text">{title}</span>
        <Badge tone={p.available === 0 ? "rose" : "green"}>
          {p.used} مستخدم
        </Badge>
      </div>
      <p className="mb-3 text-xs text-zinc-400">{desc}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
        <span className="rounded-lg border border-gold-400/20 bg-obsidian-900/50 px-2 py-1 font-mono">
          {p.prefix}-{p.start} ← {p.prefix}-{p.end}
        </span>
        <span className="inline-flex items-center gap-1">
          <CircleDot size={12} className="text-gold-300" />
          التالي المتاح: <span className="font-mono font-bold text-gold-200">{p.next || "لا يوجد"}</span>
        </span>
      </div>
    </Card>
  );

  return (
    <div className="mb-6 rounded-2xl border border-gold-400/15 bg-obsidian-900/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-200">
          <Hash size={15} className="text-gold-300" />
          الأكواد العسكرية (الشارات) — توليد تلقائي وإعادة تدوير
        </h4>
        <button onClick={load} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-gold-200" disabled={loading}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          تحديث
        </button>
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}

      {loading && !stats ? (
        <p className="py-4 text-center text-sm text-zinc-400">جارٍ جلب حالة الأكواد...</p>
      ) : stats ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <PoolCard
              title="رتب الضباط والقيادة (C-)"
              desc="من رئيس الوزراء حتى ملازم — كل رتبة بنطاقها المخصص"
              p={{
                prefix: "C",
                start: 0,
                end: Math.max(...stats.pools.map((x) => x.end)),
                used: stats.pools.reduce((s, x) => s + x.used, 0),
                available: stats.pools.reduce((s, x) => s + (x.available || 0), 0),
                next: stats.pools.map((x) => x.next).find(Boolean) || null,
              }}
            />
            <PoolCard title="رتب الصف من رئيس رقباء إلى رقيب (N-)" desc="تسلسلي يبدأ من N-1 فصاعداً" p={stats.N} />
          </div>
          <PoolCard
            title="وكيل رقيب حتى جندي + تحت التدريب (NT-)"
            desc="يبدأ من NT-100 ويتصاعد؛ تُعاد تدوير الأكواد تلقائياً عند الترقية أو الفصل"
            p={stats.NT}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.NH?.map((p: any) => (
              <PoolCard
                key={p.rankId}
                title={`جندي الأمن العام — ${p.labelAr} (${p.prefix}-)`}
                desc={`نطاق صارم NH-${p.start} إلى NH-${p.end} بشرط رول الأمن العام + رتبة ${p.labelAr}`}
                p={p}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stats.pools.map((p) => (
              <span key={p.rankId} className={cn("rounded-md px-2 py-0.5 font-mono text-[11px]", p.available === 0 ? "bg-rose-500/10 text-rose-300" : "bg-gold-400/10 text-gold-200")}>
                {p.rankId}: {p.used}/{(p.available ?? 0) + p.used}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}