"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Loader2, RefreshCw } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types";

const ACTION_TONE: Record<string, "gold" | "rose" | "green" | "slate" | "amber" | "indigo"> = {
  "recruitment.approved": "green",
  "recruitment.denied": "rose",
  "officer.discharged": "rose",
  "permissions.upsert": "indigo",
  "permissions.revoke": "indigo",
  "exams.completed": "amber",
  "settings.update": "gold",
};

// Centralized System Audit Logs (لوق العمليات) — automated activity feed.
export function AuditLogs() {
  const { session } = useStore();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/audit-logs?actor=${encodeURIComponent(session?.discordId || "")}`, { cache: "no-store" });
      const d = await r.json();
      if (d.ok && Array.isArray(d.entries)) setEntries(d.entries as AuditLogEntry[]);
      else setError(d.error || "تعذر التحميل");
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">لوق العمليات</h3>
        <Button variant="outline" onClick={load} disabled={loading} className="!px-3 !py-1.5 !text-xs">
          {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} تحديث
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-400/15 bg-obsidian-900/40 p-3 text-xs text-zinc-400">
        <ScrollText size={14} className="text-gold-300" />
        تسجيل آلي لكل العمليات الحساسة: التوظيف، الفصل، الاختبارات، الأخبار، الصلاحيات، والإعدادات.
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
          <Loader2 size={18} className="animate-spin" /> جارٍ تحميل السجل...
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-zinc-500">
          <ScrollText size={28} />
          <p className="text-sm">لا توجد عمليات مسجلة بعد.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex flex-col gap-2 rounded-xl border border-gold-400/12 bg-obsidian-900/40 p-3 sm:flex-row sm:items-center">
              <Badge tone={ACTION_TONE[e.action] || "slate"} className="shrink-0">
                {e.actionAr || e.action}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs text-zinc-300">
                  <span className="font-bold text-gold-200">{e.executorName || e.executor}</span>
                  {e.targetName && (
                    <>
                      {" "}← <span className="text-zinc-400">{e.targetName}</span>
                    </>
                  )}
                </div>
                {e.metadata && Object.keys(e.metadata).length > 0 && (
                  <div className="mt-0.5 truncate text-[11px] text-zinc-500">
                    {JSON.stringify(e.metadata)}
                  </div>
                )}
              </div>
              <div className={cn("shrink-0 text-[11px] text-zinc-500")}>{fmt(e.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}