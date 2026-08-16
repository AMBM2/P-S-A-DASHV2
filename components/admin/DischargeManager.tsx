"use client";

import { useState } from "react";
import { UserX, Loader2, Search } from "lucide-react";
import { Button, Badge, Modal, Field, Textarea, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { RANKS, DEPARTMENTS } from "@/lib/seed";
import { cn } from "@/lib/format";

export function DischargeManager() {
  const { officers, session } = useStore();
  const [q, setQ] = useState("");
  const [discharging, setDischarging] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  const target = officers.find((o) => o.id === discharging) || null;

  const filtered = officers.filter((o) => {
    if (o.status === "discharged") return false;
    if (!q) return true;
    const s = (o.name + o.nameAr + o.badge + o.callsign + (o.discordId || "")).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const doDischarge = async () => {
    if (!target) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/discharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officerId: target.id,
          reason,
          issuer: session?.discordId || null,
        }),
      });
      const d = await r.json();
      setMsg({
        ok: d.ok,
        text: d.ok
          ? `تم فصل ${target.nameAr || target.name} — سُلبت ${d.rolesRemoved ?? 0} رول من ديسكورد`
          : `فشل الفصل: ${d.error || "البوت غير متصل"}`,
      });
      if (d.ok) setDischarging(null);
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">الفصل والتسريح</h3>
        <div className="relative">
          <Search size={15} className="absolute top-1/2 -translate-y-1/2 text-zinc-500 ltr:left-3 rtl:right-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث..."
            className="w-52 rounded-lg border border-gold-400/20 bg-obsidian-900/60 py-2 pl-8 pr-3 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
          />
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
        <EmptyState message="لا يوجد أفراد نشطون" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold-400/15">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-obsidian-800/60 text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">الشارة</th>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">الرتبة</th>
                <th className="px-4 py-3">الوحدة</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/15">
              {filtered.map((o) => {
                const rank = RANKS.find((r) => r.id === o.rankId);
                const dep = DEPARTMENTS.find((d) => d.id === o.departmentId);
                return (
                  <tr key={o.id} className="bg-obsidian-900/30 transition-colors hover:bg-gold-400/5">
                    <td className="px-4 py-3 font-mono font-bold text-gold-300">{o.badge}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{o.nameAr || o.name}</div>
                      <div className="font-mono text-xs text-zinc-400">{o.callsign}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{rank?.titleAr || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{dep?.nameAr || o.departmentId}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setDischarging(o.id)}>
                          <UserX size={14} /> فصل
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!target} onClose={() => setDischarging(null)} title="فصل وتسريح">
        {target && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-rose-400/25 bg-obsidian-900/50 p-4">
              <UserX size={20} className="text-rose-300" />
              <div>
                <div className="font-bold text-white">{target.nameAr || target.name}</div>
                <div className="font-mono text-xs text-zinc-400">
                  {target.badge} · {target.discordId || "بدون ديسكورد"}
                </div>
              </div>
              <Badge tone="rose">عملية حساسة</Badge>
            </div>
            <Field label="سبب الفصل">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اختياري — يُسجل في سجل الفرد" dir="rtl" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDischarging(null)}>إلغاء</Button>
              <Button variant="danger" onClick={doDischarge} disabled={busy}>
                {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <UserX size={16} className="ml-2" />}
                تأكيد الفصل
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}