"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyRound, Plus, Trash2, Loader2, UserCheck } from "lucide-react";
import { Button, Badge, Modal, Field, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import type { AdminUser } from "@/lib/types";

const ROLE_TONE: Record<string, any> = {
  master: "rose",
  admin: "gold",
  recruitment: "indigo",
};

const ROLE_LABEL: Record<string, string> = {
  master: "سوبر أدمن",
  admin: "أدمن",
  recruitment: "توظيف فقط",
};

export function AdminsManager() {
  const { session } = useStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AdminUser["role"]>("recruitment");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admins").select("*").order("createdAt", { ascending: true });
    if (data) setAdmins(data as AdminUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upsert = async () => {
    if (!/^\d{15,20}$/.test(userId.trim())) {
      setMsg({ ok: false, text: "معرّف ديسكورد غير صالح" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admins/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: userId.trim(), role, note, actor: session?.discordId }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تم منح الصلاحية بنجاح" : `فشل: ${d.error || "غير مصرح"}` });
      if (d.ok) {
        setModal(false);
        setUserId("");
        setNote("");
        await load();
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: AdminUser) => {
    if (!confirm(`إزالة صلاحيات ${a.userId}؟`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admins/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: a.userId, actor: session?.discordId }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تمت الإزالة" : `فشل: ${d.error || "غير مصرح"}` });
      await load();
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (a: AdminUser) => {
    await upsertRow(a.userId, a.role, a.note, !a.active);
  };

  const upsertRow = async (id: string, r: AdminUser["role"], n: string, active: boolean) => {
    setBusy(true);
    try {
      await fetch("/api/admins/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId: id, role: r, note: n, active, actor: session?.discordId }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">صلاحيات الوصول (RBAC)</h3>
        <Button onClick={() => setModal(true)} disabled={busy}>
          <Plus size={16} /> منح صلاحية
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-400/15 bg-obsidian-900/40 p-3 text-xs text-zinc-400">
        <UserCheck size={14} className="text-gold-300" />
        السوبر أدمن فقط يمكنه إدارة الصلاحيات. حاملو رول التوظيف (Recruitment Officer) على ديسكورد يحصلون تلقائياً على صلاحية التوظيف.
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

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
          <Loader2 size={18} className="animate-spin" /> جارٍ التحميل...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold-400/15">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-obsidian-800/60 text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Discord ID</th>
                <th className="px-4 py-3">الصلاحية</th>
                <th className="px-4 py-3">ملاحظة</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/15">
              {admins.map((a) => (
                <tr key={a.id} className="bg-obsidian-900/30 transition-colors hover:bg-gold-400/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-mono text-zinc-100">
                      <KeyRound size={14} className="text-gold-300" />
                      {a.userId}
                      {a.role === "master" && <Badge tone="rose">السوبر أدمن</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[a.role]}>{ROLE_LABEL[a.role] || a.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{a.note || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.active ? "green" : "slate"}>{a.active ? "نشط" : "موقوف"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" className="px-2 py-1 text-xs" disabled={busy} onClick={() => toggleActive(a)}>
                        {a.active ? "إيقاف" : "تفعيل"}
                      </Button>
                      {a.role !== "master" && (
                        <Button variant="danger" className="px-2 py-1 text-xs" disabled={busy} onClick={() => remove(a)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="منح صلاحية">
        <div className="space-y-4">
          <Field label="Discord ID للمستخدم">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="123456789012345678"
              dir="ltr"
            />
          </Field>
          <Field label="الصلاحية">
            <Select value={role} onChange={(e) => setRole(e.target.value as AdminUser["role"])}>
              <option value="admin">أدمن (كل اللوحات عدا إدارة الصلاحيات)</option>
              <option value="recruitment">توظيف فقط (قسم التوظيف والكلية العسكرية)</option>
            </Select>
          </Field>
          <Field label="ملاحظة">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختياري" dir="rtl" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
            <Button onClick={upsert} disabled={busy}>
              {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <Plus size={16} className="ml-2" />}
              منح الصلاحية
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}