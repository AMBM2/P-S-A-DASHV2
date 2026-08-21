"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useTable,
  flexRender,
  stockFeatures,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { ScrollText, Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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

const columns = [
  {
    id: "action",
    accessorKey: "action",
    header: "العملية",
    cell: ({ row }: { row: { original: AuditLogEntry } }) => (
      <Badge tone={ACTION_TONE[row.original.action] || "slate"} className="shrink-0">
        {row.original.actionAr || row.original.action}
      </Badge>
    ),
  },
  {
    id: "executor",
    accessorKey: "executor",
    header: "المنفّذ ← الهدف",
    cell: ({ row }: { row: { original: AuditLogEntry } }) => (
      <div className="min-w-0">
        <div className="truncate text-xs text-gray-700">
          <span className="font-bold text-gold-200">{row.original.executorName || row.original.executor}</span>
          {row.original.targetName && (
            <>
              {" "}← <span className="text-zinc-400">{row.original.targetName}</span>
            </>
          )}
        </div>
        {row.original.metadata && Object.keys(row.original.metadata).length > 0 && (
          <div className="mt-0.5 truncate text-[11px] text-zinc-500">{JSON.stringify(row.original.metadata)}</div>
        )}
      </div>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "الوقت",
    cell: ({ row }: { row: { original: AuditLogEntry } }) => (
      <span className="whitespace-nowrap text-[11px] text-zinc-500">
        {new Date(row.original.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
      </span>
    ),
  },
];

// Centralized System Audit Logs (لوق العمليات) — TanStack table, paginated,
// dark zebra-striped rows, Sonner notifications.
export function AuditLogs() {
  const { session } = useStore();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError("");
      try {
        const r = await fetch(`/api/audit-logs?actor=${encodeURIComponent(session?.discordId || "")}`, { cache: "no-store" });
        const d = await r.json();
        if (d.ok && Array.isArray(d.entries)) {
          setEntries(d.entries as AuditLogEntry[]);
          if (silent) toast.success("تم تحديث السجل");
        } else setError(d.error || "تعذر التحميل");
      } catch {
        setError("تعذر الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    },
    [session?.discordId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    load();
  }, [load]);

  const table = useTable({
    features: Object.keys(stockFeatures) as any,
    data: entries,
    columns: columns as any,
    state: { pagination: { pageIndex: page, pageSize: 8 } },
    onPaginationChange: (updater) => {
      setPage(typeof updater === "function" ? updater({ pageIndex: page, pageSize: 8 }).pageIndex : updater.pageIndex);
    },
  });

  const { pageIndex, pageSize } = table.state.pagination;
  const pageCount = Math.max(1, Math.ceil(entries.length / pageSize));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">لوق العمليات</h3>
        <Button
          variant="outline"
          onClick={() => load(true)}
          disabled={loading}
          className="!px-3 !py-1.5 !text-xs"
        >
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
        <div className="clip-notch overflow-hidden border border-gold-400/15">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-gold-400/15 bg-obsidian-900/60">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold-300/80"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-white/5 transition-colors last:border-0 hover:bg-gold-400/[0.04]",
                      i % 2 === 1 && "bg-white/[0.02]"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gold-400/15 bg-obsidian-900/50 px-4 py-2.5 text-xs text-zinc-400">
            <span>
              الصفحة {pageIndex + 1} من {Math.max(1, pageCount)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                className="!px-2 !py-1 !text-xs"
                disabled={pageIndex === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronRight size={14} /> السابق
              </Button>
              <Button
                variant="ghost"
                className="!px-2 !py-1 !text-xs"
                disabled={pageIndex >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                التالي <ChevronLeft size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}