"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Check,
  X,
  Loader2,
  Search,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { Button, Card, Badge, Modal, Field, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { ExamPanel } from "./ExamPanel";
import { cn } from "@/lib/format";
import type { Application } from "@/lib/types";

const STATUS_TONE: Record<string, any> = {
  pending: "amber",
  approved: "green",
  denied: "rose",
};

export function RecruitmentManager() {
  const { session } = useStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "denied">("pending");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState<Application | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let apps: Application[] = [];
    try {
      const r = await fetch(`/api/applications?actor=${encodeURIComponent(session?.discordId || "")}`, { cache: "no-store" });
      const d = await r.json();
      if (r.ok && d.ok && Array.isArray(d.applications)) apps = d.applications as Application[];
    } catch {
      // fall through to client read
    }
    if (apps.length === 0) {
      const appsRes = await supabase.from("applications").select("*").order("createdAt", { ascending: false });
      if (appsRes.data) apps = appsRes.data as Application[];
    }
    if (apps.length) setApplications(apps);
    try {
      const rolesRes = await fetch("/api/discord/roles", { cache: "no-store" });
      const d = await rolesRes.json();
      if (d.ok && Array.isArray(d.roles)) {
        const map: Record<string, string> = {};
        for (const r of d.roles) map[r.id] = r.rankAr || r.name;
        setRoles(map);
      }
    } catch {
      // roles map stays empty — fall back to raw IDs
    }
    setLoading(false);
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-applications")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const decide = async (app: Application, decision: "approved" | "denied") => {
    setBusy(true);
    try {
      const r = await fetch("/api/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app.id, decision }),
      });
      await r.json();
      await load();
      if (viewing?.id === app.id) setViewing({ ...viewing, status: decision });
    } finally {
      setBusy(false);
    }
  };

  const filtered = applications.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (!q) return true;
    const s = (a.name + a.nameAr + a.discordId).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const rankTitles = (app: Application) =>
    (app.ranks || []).map((id) => roles[id] || id).join("، ") || "—";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">طلبات التجنيد</h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gold-400/15 bg-obsidian-900/60 p-1">
            {(["pending", "approved", "denied", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  filter === f ? "bg-gold-400/15 text-gold-200" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {f === "pending" ? "قيد المراجعة" : f === "approved" ? "مقبول" : f === "denied" ? "مرفوض" : "الكل"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 text-zinc-500 ltr:left-3 rtl:right-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث..."
              className="w-40 rounded-lg border border-gold-400/20 bg-obsidian-900/60 py-2 pl-8 pr-3 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
            />
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="لا توجد طلبات" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-white">{a.nameAr || a.name}</div>
                  <div className="font-mono text-xs text-zinc-400">{a.discordId}</div>
                </div>
                <Badge tone={STATUS_TONE[a.status]}>
                  {a.status === "pending" ? "قيد المراجعة" : a.status === "approved" ? "مقبول" : "مرفوض"}
                </Badge>
              </div>
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span className="truncate">{rankTitles(a)}</span>
              </div>
              <div className="mb-1 text-xs text-zinc-500">
                الاختبار: <span className="font-bold text-gold-200">{a.examScore || 0}</span>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                {a.status === "pending" && (
                  <>
                    <Button variant="outline" onClick={() => decide(a, "denied")} disabled={busy} className="px-3 py-1.5 text-xs">
                      <X size={14} /> رفض
                    </Button>
                    <Button variant="success" onClick={() => decide(a, "approved")} disabled={busy} className="px-3 py-1.5 text-xs">
                      <Check size={14} /> قبول
                    </Button>
                  </>
                )}
                <Button onClick={() => setViewing(a)} className="px-3 py-1.5 text-xs">
                  <Eye size={14} /> مراجعة
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="مراجعة الطلب" wide>
        {viewing && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم">
                <div className="rounded-lg border border-gold-400/15 bg-obsidian-900/60 px-3 py-2 text-sm text-white">
                  {viewing.nameAr || viewing.name}
                </div>
              </Field>
              <Field label="Discord ID">
                <div className="rounded-lg border border-gold-400/15 bg-obsidian-900/60 px-3 py-2 font-mono text-sm text-white">
                  {viewing.discordId}
                </div>
              </Field>
              <Field label="الرتب المطلوبة">
                <div className="rounded-lg border border-gold-400/15 bg-obsidian-900/60 px-3 py-2 text-sm text-white">
                  {rankTitles(viewing)}
                </div>
              </Field>
              {viewing.reviewedBy && (
                <Field label="تمت المراجعة بواسطة">
                  <div className="rounded-lg border border-gold-400/15 bg-obsidian-900/60 px-3 py-2 font-mono text-sm text-white">
                    {viewing.reviewedBy}
                  </div>
                </Field>
              )}
            </div>

            <div className="rounded-xl border border-gold-400/20 bg-obsidian-900/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardCheck size={16} className="text-gold-300" />
                <span className="font-display text-sm font-bold gold-text">الاختبار التحريري</span>
              </div>
              <ExamPanel
                applicationId={viewing.id}
                onScored={(score) => {
                  const updated = { ...viewing, examScore: score };
                  setViewing(updated);
                  setApplications((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                }}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-gold-400/15 pt-4">
              {viewing.status === "pending" ? (
                <>
                  <Button variant="danger" onClick={() => decide(viewing, "denied")} disabled={busy}>
                    <X size={16} /> رفض الطلب
                  </Button>
                  <Button variant="success" onClick={() => decide(viewing, "approved")} disabled={busy}>
                    <Check size={16} /> قبول وتجنيد في الكلية
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setViewing(null)}>إغلاق</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}