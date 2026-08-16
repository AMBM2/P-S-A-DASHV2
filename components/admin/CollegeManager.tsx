"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Loader2,
  RefreshCw,
  Award,
  UserX,
  Search,
} from "lucide-react";
import { Button, Badge, Modal, Field, Select, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { RANKS } from "@/lib/seed";
import { cn } from "@/lib/format";
import type { Cadet } from "@/lib/types";

const STATUS_TONE: Record<string, any> = {
  pending: "amber",
  enrolled: "indigo",
  graduated: "green",
  discharged: "slate",
};

export function CollegeManager() {
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [grading, setGrading] = useState<Cadet | null>(null);
  const [rankId, setRankId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cadets")
      .select("*")
      .order("createdAt", { ascending: false });
    if (data) setCadets(data as Cadet[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-cadets")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadets" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const graduate = async () => {
    if (!grading) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/college/graduate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadetId: grading.id, rankId }),
      });
      const d = await r.json();
      setMsg({
        ok: d.ok,
        text: d.ok
          ? `تم تخرج ${grading.nameAr || grading.name} برتبة ${RANKS.find((x) => x.id === rankId)?.titleAr || rankId}`
          : `فشل التخرج: ${d.error || "خطأ"}`,
      });
      setGrading(null);
      await load();
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  const drop = async (c: Cadet) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/college/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadetId: c.id }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تم إسقاط الطالب" : `فشل: ${d.error || "خطأ"}` });
      await load();
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  const filtered = cadets.filter((c) => {
    if (!q) return true;
    const s = (c.name + c.nameAr + c.discordId).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">الكلية العسكرية</h3>
        <div className="flex items-center gap-2">
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

      {msg && (
        <div
          className={cn(
            "mb-4 rounded-lg border p-3 text-sm",
            msg.ok
              ? "border-gold-300/40 bg-gold-400/10 text-gold-100"
              : "border-red-400/30 bg-red-500/10 text-red-200"
          )}
        >
          {msg.text}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState message="لا يوجد طلاب في الكلية" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold-400/15">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-obsidian-800/60 text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الرتبة</th>
                <th className="px-4 py-3">الاختبار</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/15">
              {filtered.map((c) => {
                const rank = RANKS.find((r) => r.id === c.rankId);
                return (
                  <tr key={c.id} className="bg-obsidian-900/30 transition-colors hover:bg-gold-400/5">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{c.nameAr || c.name}</div>
                      <div className="font-mono text-xs text-zinc-400">{c.discordId}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{rank?.titleAr || "—"}</td>
                    <td className="px-4 py-3 font-bold text-gold-200">{c.examScore || 0}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[c.status]}>
                        {c.status === "pending" ? "قيد الانتظار" : c.status === "enrolled" ? "مقيد" : c.status === "graduated" ? "متخرج" : "مُسقط"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {c.status === "enrolled" && (
                          <>
                            <Button
                              variant="outline"
                              className="px-2 py-1 text-xs"
                              title="تخرج"
                              disabled={busy}
                              onClick={() => {
                                setRankId(c.rankId || "r-tr1");
                                setGrading(c);
                              }}
                            >
                              <Award size={14} /> تخرج
                            </Button>
                            <Button variant="danger" className="px-2 py-1 text-xs" title="إسقاط" disabled={busy} onClick={() => drop(c)}>
                              <UserX size={14} /> إسقاط
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!grading} onClose={() => setGrading(null)} title="تخرج طالب">
        {grading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-4">
              <GraduationCap size={20} className="text-gold-300" />
              <div>
                <div className="font-bold text-white">{grading.nameAr || grading.name}</div>
                <div className="font-mono text-xs text-zinc-400">{grading.discordId}</div>
              </div>
            </div>
            <Field label="رتبة التخرج">
              <Select value={rankId} onChange={(e) => setRankId(e.target.value)}>
                {RANKS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.titleAr} — {r.title}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setGrading(null)}>إلغاء</Button>
              <Button onClick={graduate} disabled={busy || !rankId}>
                {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <Award size={16} className="ml-2" />}
                تأكيد التخرج
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}