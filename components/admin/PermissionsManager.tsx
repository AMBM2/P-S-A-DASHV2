"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, Loader2, ShieldCheck, KeyRound, Users } from "lucide-react";
import { Button, Badge, Modal, Field, Input } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import { MASTER_ADMIN_ID, PERMISSION_DEFS } from "@/lib/permissions";
import type { PermissionDelegate, PermissionKey } from "@/lib/types";

// Manage Delegates (مسؤول الصلاحيات): the Master Super Admin assigns/revokes
// granular sub-permissions to users by pasting their Discord User ID.
export function PermissionsManager() {
  const { session } = useStore();
  const [delegates, setDelegates] = useState<PermissionDelegate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);
  const [modal, setModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Set<PermissionKey>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/permissions?actor=${encodeURIComponent(session?.discordId || "")}`, { cache: "no-store" });
      const d = await r.json();
      if (d.ok && Array.isArray(d.delegates)) setDelegates(d.delegates as PermissionDelegate[]);
      else setMsg({ ok: false, text: d.error || "تعذر التحميل" });
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const togglePerm = (p: PermissionKey) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const save = async () => {
    if (!/^\d{15,20}$/.test(userId.trim())) {
      setMsg({ ok: false, text: "معرّف ديسكورد غير صالح" });
      return;
    }
    if (picked.size === 0) {
      setMsg({ ok: false, text: "اختر صلاحية واحدة على الأقل" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: userId.trim(), permissions: [...picked], note, actor: session?.discordId }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تم حفظ الصلاحيات" : `فشل: ${d.error || "غير مصرح"}` });
      if (d.ok) {
        setModal(false);
        setUserId("");
        setNote("");
        setPicked(new Set());
        await load();
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (d: PermissionDelegate) => {
    if (!confirm(`سحب كل الصلاحيات من ${d.discordId}؟`)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: d.discordId, actor: session?.discordId }),
      });
      const res = await r.json();
      setMsg({ ok: res.ok, text: res.ok ? "تم السحب" : `فشل: ${res.error || "غير مصرح"}` });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">إدارة الصلاحيات التفويضية</h3>
        <Button onClick={() => setModal(true)} disabled={busy}>
          <UserPlus size={16} /> إضافة مفوَّض
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-500/5 p-3 text-xs text-gray-600">
        <KeyRound size={14} className="shrink-0 text-rose-300" />
        <span>
          السوبر أدمن الوحيد هو <span className="font-mono text-rose-100">{MASTER_ADMIN_ID}</span> — يملك تحكماً مطلقاً
          وغير قابل للإلغاء. الصلاحيات التفويضية تُمنح للأعضاء الآخرين بصق معرّف ديسكورد.
        </span>
      </div>

      {msg && (
        <div
          className={cn(
            "mb-4 rounded-lg border p-3 text-sm",
            msg.ok ? "border-gold-300/40 bg-gold-400/10 text-gold-100" : "border-red-400/30 bg-red-500/10 text-red-200"
          )}
        >
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
          <Loader2 size={18} className="animate-spin" /> جارٍ تحميل المفوَّضين...
        </div>
      ) : delegates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-zinc-400">
          <Users size={28} />
          <p>لا يوجد مفوَّضون بعد — أضف أول مفوَّض بالزر أعلاه.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {delegates.map((d) => (
            <div key={d.id} className="rounded-xl border border-gold-400/15 bg-obsidian-900/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-gold-300" />
                  <span className="font-mono text-sm text-gray-900">{d.discordId}</span>
                  {d.note && <Badge tone="slate">{d.note}</Badge>}
                </div>
                <button onClick={() => revoke(d)} className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200" disabled={busy}>
                  <Trash2 size={13} /> سحب الكل
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {d.permissions.length === 0 && <span className="text-xs text-zinc-600">لا صلاحيات</span>}
                {(d.permissions as PermissionKey[]).map((p) => (
                  <Badge key={p} tone="gold">
                    {PERMISSION_DEFS.find((x) => x.key === p)?.label || p}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="إضافة مفوَّض صلاحيات">
        <div className="space-y-4">
          <Field label="Discord User ID (من المنسوخ)">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="123456789012345678"
              dir="ltr"
            />
          </Field>
          <Field label="الصلاحيات">
            <div className="grid gap-2">
              {PERMISSION_DEFS.filter((p) => p.key !== "MASTER_ADMIN").map((p) => {
                const active = picked.has(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => togglePerm(p.key)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-2.5 text-right text-sm transition-all",
                      active ? "border-gold-300/70 bg-gold-400/15" : "border-gold-400/12 bg-obsidian-900/50 hover:border-gold-400/40"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        active ? "border-gold-300 bg-gold-300 text-obsidian-900" : "border-zinc-600"
                      )}
                    >
                      {active && <ShieldCheck size={11} />}
                    </span>
                    <span>
                      <span className={cn("block text-xs font-bold", active ? "text-gold-100" : "text-gray-700")}>
                        {p.label}
                      </span>
                      <span className="block text-[11px] text-zinc-400">{p.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="ملاحظة (اختياري)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} dir="rtl" placeholder="مثال: مسؤول التوظيف" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <ShieldCheck size={16} className="ml-2" />}
              حفظ الصلاحيات
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}