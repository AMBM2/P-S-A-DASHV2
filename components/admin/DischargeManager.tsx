"use client";

import { useEffect, useState } from "react";
import { UserX, Loader2, Search, ShieldAlert, Loader } from "lucide-react";
import { Button, Badge, Modal, Field, Textarea, Select, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { RANKS, DEPARTMENTS } from "@/lib/seed";
import { cn } from "@/lib/format";

type MemberRole = { id: string; name: string; rankAr?: string | null };

export function DischargeManager() {
  const { officers, session, logout } = useStore();
  const [q, setQ] = useState("");
  const [discharging, setDischarging] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [blacklist, setBlacklist] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);
  const [memberRoles, setMemberRoles] = useState<MemberRole[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingRoles, setLoadingRoles] = useState(false);

  const target = officers.find((o) => o.id === discharging) || null;

  const DISCHARGE_TYPES = [
    { value: "honorary", label: "فصل شرفي (Honorary)" },
    { value: "dishonorable", label: "فصل غير شرفي (Dishonorable)" },
    { value: "inactivity", label: "الخمول وعدم النشاط (Inactivity)" },
    { value: "administrative", label: "مخالفة إدارية (Administrative Violation)" },
  ];

  useEffect(() => {
    if (!target?.discordId) {
      setMemberRoles([]);
      setSelected(new Set());
      return;
    }
    let cancelled = false;
    setLoadingRoles(true);
    fetch(`/api/discord/member/${target.discordId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.ok && d.found && Array.isArray(d.roles)) {
          const roles = d.roles as MemberRole[];
          setMemberRoles(roles);
          setSelected(new Set(roles.map((x) => x.id)));
        } else {
          setMemberRoles([]);
          setSelected(new Set());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMemberRoles([]);
          setSelected(new Set());
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [discharging, target?.discordId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = officers.filter((o) => {
    if (o.status === "discharged") return false;
    if (!q) return true;
    const s = (o.name + o.nameAr + o.badge + o.callsign + (o.discordId || "")).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const doDischarge = async () => {
    if (!target) return;
    if (!type) {
      setMsg({ ok: false, text: "يرجى اختيار نوع الفصل" });
      return;
    }
    if (!reason.trim()) {
      setMsg({ ok: false, text: "التفاصيل/السبب إلزامي" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/discharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officerId: target.id,
          type,
          reason,
          evidence,
          blacklist,
          issuer: session?.discordId || null,
          roleIds: Array.from(selected),
        }),
      });
      const d = await r.json();
      if (r.status === 401) {
        // Session cookie expired/invalid — force a fresh login instead of
        // leaving the user staring at a confusing "unauthenticated" error.
        logout();
        setMsg({ ok: false, text: "انتهت الجلسة — سجّل الدخول من جديد" });
        return;
      }
      setMsg({
        ok: d.ok,
        text: d.ok
          ? `تم فصل ${target.nameAr || target.name} — سُلبت ${d.rolesRemoved ?? 0} رول من ديسكورد${d.blacklisted ? " وأُضيف للقائمة السوداء" : ""}`
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
            className="w-52 rounded-lg border border-gold-400/20 bg-obsidian-900/60 py-2 pl-8 pr-3 text-sm text-gray-900 outline-none focus:border-gold-400/70"
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
                    <td className="px-4 py-3 text-gray-600">{rank?.titleAr || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{dep?.nameAr || o.departmentId}</td>
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
            <Field label="نوع الفصل (إلزامي)">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">— اختر نوع الفصل —</option>
                {DISCHARGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="التفاصيل / سبب الفصل (إلزامي)">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="تفاصيل الفصل — إلزامي"
                dir="rtl"
              />
            </Field>
            <Field label="الأدلة / روابط التوثيق">
              <Textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="روابط أو مستندات (اختياري)"
                dir="ltr"
                className="min-h-[60px] text-left"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-rose-400/25 bg-obsidian-900/50 p-3">
              <input
                type="checkbox"
                checked={blacklist}
                onChange={(e) => setBlacklist(e.target.checked)}
                className="h-4 w-4 accent-rose-500"
              />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-white">إضافة إلى القائمة السوداء</span>
                <span className="block text-xs text-zinc-400">
                  يمنع هذا الشخص من التقديم للتوظيف مستقبلاً
                </span>
              </span>
            </label>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold text-gray-600">
                  <ShieldAlert size={15} className="text-rose-300" />
                  الرتب/الرولات المسحوبة من ديسكورد
                </span>
                <span className="text-xs text-zinc-400">
                  المحددة: <span className="font-bold text-rose-200">{selected.size}</span>
                </span>
              </div>
              {loadingRoles ? (
                <div className="flex items-center gap-2 rounded-xl border border-gold-400/15 bg-obsidian-900/40 px-4 py-3 text-sm text-zinc-400">
                  <Loader size={15} className="animate-spin" /> جلب رولات العضو من ديسكورد...
                </div>
              ) : memberRoles.length === 0 ? (
                <div className="rounded-xl border border-gold-400/15 bg-obsidian-900/40 px-4 py-3 text-sm text-zinc-400">
                  لم يتم العثور على رولات للعضو في ديسكورد (قد يكون خارج السيرفر) — سيتم الاكتفاء بتحديث السجل.
                </div>
              ) : (
                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-rose-400/20 bg-obsidian-900/40 p-2">
                  {memberRoles.map((r) => {
                    const on = selected.has(r.id);
                    return (
                      <label
                        key={r.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                          on ? "bg-rose-500/15 text-rose-100" : "bg-transparent text-zinc-400 hover:bg-obsidian-800/60"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(r.id)}
                          className="h-4 w-4 accent-rose-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {r.rankAr || r.name}
                          </span>
                          {r.rankAr && r.rankAr !== r.name && (
                            <span className="block truncate text-xs text-zinc-500">{r.name}</span>
                          )}
                        </span>
                        {r.rankAr && (
                          <Badge tone="rose" className="shrink-0">
                            رتبة
                          </Badge>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDischarging(null)}>إلغاء</Button>
              <Button variant="danger" onClick={doDischarge} disabled={busy}>
                {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <UserX size={16} className="ml-2" />}
                تأكيد الفصل وسحب الرولات
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}