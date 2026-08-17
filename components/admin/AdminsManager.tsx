"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyRound, Plus, Trash2, Loader2, UserCheck, Crown, Radio, UserPlus, Users } from "lucide-react";
import { Button, Badge, Modal, Field, Input, Select } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import type { AdminUser, AdminRole } from "@/lib/types";

// Categorized admin permissions (Discord role IDs). A user may hold several.
const CATEGORIES: {
  role: AdminRole;
  title: string;
  desc: string;
  features: string[];
  icon: any;
  tone: string;
}[] = [
  {
    role: "executive",
    title: "القيادة العليا (Executive Command)",
    desc: "تحكم كامل في الإعدادات، إعادة تعيين البيانات، اعتماد الفصل، ومنح الصلاحيات.",
    features: ["الإعدادات وإعادة تعيين البيانات", "اعتماد قرارات الفصل", "إدارة الصلاحيات"],
    icon: Crown,
    tone: "rose",
  },
  {
    role: "field",
    title: "قيادة الميدان (Field Command)",
    desc: "متابعة الغرف المباشرة، إرسال التنبيهات الميدانية، وتسجيل النقاط.",
    features: ["تتبع الغرف المباشرة", "إرسال تنبيهات الميدان", "تسجيل نقاط الميدان"],
    icon: Radio,
    tone: "amber",
  },
  {
    role: "hr",
    title: "التوظيف والرقابة (HR & Recruitment)",
    desc: "مراجعة طلبات المتقدمين، توزيع الأكواد العسكرية، الإجازات، وسجل الإنذارات.",
    features: ["مراجعة طلبات التوظيف", "توزيع الأكواد العسكرية", "الإجازات (LOA) وسجل الإنذارات"],
    icon: UserPlus,
    tone: "indigo",
  },
  {
    role: "personnel",
    title: "الأفراد والضباط (Personnel)",
    desc: "عرض السجلات العسكرية والجداول الميدانية والإحصائيات الشخصية للاطلاع فقط.",
    features: ["سجلات الأفراد للاطلاع", "الجداول الميدانية", "الإحصائيات الشخصية"],
    icon: Users,
    tone: "slate",
  },
];

const ROLE_LABEL: Record<string, string> = {
  master: "سوبر أدمن",
  executive: "القيادة العليا",
  field: "قيادة الميدان",
  hr: "التوظيف والرقابة",
  personnel: "الأفراد",
  admin: "أدمن",
  recruitment: "توظيف فقط",
};

export function AdminsManager() {
  const { session } = useStore();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AdminRole>("executive");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admins?actor=${encodeURIComponent(session?.discordId || "")}`, { cache: "no-store" });
      const d = await r.json();
      if (r.ok && d.ok && Array.isArray(d.admins)) {
        setAdmins(d.admins as AdminUser[]);
        setLoading(false);
        return;
      }
    } catch {
      // fall through to client read
    }
    const { data } = await supabase.from("admins").select("*").order("createdAt", { ascending: true });
    if (data) setAdmins(data as AdminUser[]);
    setLoading(false);
  }, [session?.discordId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setBusy(true);
    try {
      await fetch("/api/admins/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discordId: a.userId,
          role: a.role,
          note: a.note,
          active: !a.active,
          actor: session?.discordId,
        }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const masters = admins.filter((a) => a.role === "master" && a.active);
  const byCategory = (role: AdminRole) => admins.filter((a) => a.role === role && a.active);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">الصلاحيات المصنّفة</h3>
        <Button onClick={() => setModal(true)} disabled={busy}>
          <Plus size={16} /> منح صلاحية
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold-400/15 bg-obsidian-900/40 p-3 text-xs text-zinc-400">
        <UserCheck size={14} className="text-gold-300" />
        الصلاحيات تُصنّف حسب رولات ديسكورد المحددة في البوت (EXECUTIVE / FIELD / HR / PERSONNEL). السوبر أدمن فقط يملك إدارة هذا القسم.
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
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-200">
              <KeyRound size={15} className="text-rose-300" />
              السوبر أدمن (تحكم كامل)
            </div>
            <div className="flex flex-wrap gap-2">
              {masters.length === 0 && <span className="text-xs text-zinc-500">لا يوجد — يجب أن يكون هناك سوبر أدمن واحد على الأقل</span>}
              {masters.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2">
                  <span className="font-mono text-xs text-rose-100">{a.userId}</span>
                  <Badge tone="rose">السوبر أدمن</Badge>
                  <button onClick={() => toggleActive(a)} className="text-[11px] text-zinc-400 hover:text-white" disabled={busy}>
                    {a.active ? "إيقاف" : "تفعيل"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const members = byCategory(cat.role);
              return (
                <div
                  key={cat.role}
                  className={cn(
                    "rounded-2xl border p-4",
                    cat.tone === "rose"
                      ? "border-rose-400/25"
                      : cat.tone === "amber"
                        ? "border-amber-400/25"
                        : cat.tone === "indigo"
                          ? "border-indigo-400/25"
                          : "border-zinc-500/25"
                  )}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon size={18} className={cn("shrink-0", cat.tone === "rose" ? "text-rose-300" : cat.tone === "amber" ? "text-amber-300" : cat.tone === "indigo" ? "text-indigo-300" : "text-zinc-300")} />
                    <span className="font-bold text-white">{cat.title}</span>
                    <Badge tone={cat.tone as any}>{members.length}</Badge>
                  </div>
                  <p className="mb-3 text-xs text-zinc-400">{cat.desc}</p>
                  <ul className="mb-4 space-y-1">
                    {cat.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="h-1 w-1 rounded-full bg-gold-300" /> {f}
                      </li>
                    ))}
                  </ul>
                  {members.length === 0 ? (
                    <p className="text-xs text-zinc-600">لا يوجد أعضاء بهذه الصلاحية — حاملو رول ديسكورد المطابق يتحصلون عليها تلقائياً.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {members.map((a) => (
                        <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-gold-400/10 bg-obsidian-900/40 px-2.5 py-1.5">
                          <span className="truncate font-mono text-xs text-zinc-200">{a.userId}</span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button onClick={() => toggleActive(a)} className="text-[11px] text-zinc-400 hover:text-white" disabled={busy}>
                              {a.active ? "إيقاف" : "تفعيل"}
                            </button>
                            <button onClick={() => remove(a)} className="text-[11px] text-rose-300 hover:text-rose-200" disabled={busy}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
            <Select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}>
              <option value="executive">القيادة العليا (Executive Command)</option>
              <option value="field">قيادة الميدان (Field Command)</option>
              <option value="hr">التوظيف والرقابة (HR & Recruitment)</option>
              <option value="personnel">الأفراد والضباط (Personnel)</option>
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