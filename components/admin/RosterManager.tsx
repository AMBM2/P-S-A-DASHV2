"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, Search, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Officer } from "@/lib/types";
import { Button, Card, Badge, Modal, Field, Input, Select, EmptyState } from "@/components/ui";
import { RANKS } from "@/lib/seed";
import { AR } from "@/lib/ar";

const STATUS_TONE: Record<string, any> = {
  "on-duty": "green",
  "off-duty": "slate",
  suspended: "rose",
  leave: "amber",
  discharged: "slate",
};

export function RosterManager() {
  const { officers, upsert, remove, nextBadge, nextCallsign, settings } = useStore();
  const lang = settings.language;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Officer | null>(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Partial<Officer>>({});

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      nameAr: "",
      rankId: "r-pvt",
      status: "off-duty",
      discordId: "",
      discordName: "",
      discordAvatar: "",
      specialization: [],
      medals: [],
      activityHours: 0,
      performance: 3,
      threats: 0,
      medicalClear: true,
    });
    setModal(true);
  };
  const openEdit = (o: Officer) => {
    setEditing(o);
    setForm({ ...o });
    setModal(true);
  };

  const save = () => {
    const base = {
      name: form.name || "Unknown",
      nameAr: form.nameAr || form.name,
      rankId: form.rankId || "r-pvt",
      status: form.status || "off-duty",
      discordId: form.discordId || undefined,
      discordName: form.discordName || undefined,
      discordAvatar: form.discordAvatar || undefined,
      specialization: form.specialization || [],
      medals: form.medals || [],
      activityHours: form.activityHours || 0,
      performance: form.performance || 3,
      threats: form.threats || 0,
      medicalClear: form.medicalClear !== false,
    };
    if (editing) {
      upsert("officers", { ...editing, ...base } as Officer);
    } else {
      upsert("officers", {
        id: crypto.randomUUID(),
        badge: nextBadge(),
        callsign: nextCallsign(),
        joinedAt: new Date().toISOString().slice(0, 10),
        ...base,
      } as Officer);
    }
    setModal(false);
  };

  const filtered = officers.filter((o) => {
    if (!q) return true;
    const s = (o.name + o.nameAr + o.badge + o.callsign).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  const changeStatus = (o: Officer, status: Officer["status"]) => {
    upsert("officers", { ...o, status });
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">
          {lang === "ar" ? "إدارة الأفراد والضباط" : "Roster & Personnel"}
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 text-zinc-500 ltr:left-3 rtl:right-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "ar" ? "بحث..." : "Search..."}
              className="w-44 rounded-lg border border-gold-400/20 bg-obsidian-900/60 py-2 pl-8 pr-3 text-sm text-zinc-100 outline-none focus:border-gold-400/70"
            />
          </div>
          <Button onClick={openNew}><Plus size={16} /> {lang === "ar" ? "إضافة فرد" : "Add Officer"}</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={lang === "ar" ? "لا يوجد أفراد" : "No personnel"} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gold-400/15">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-obsidian-800/60 text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">{lang === "ar" ? "الشارة" : "Badge"}</th>
                <th className="px-4 py-3">{lang === "ar" ? "الاسم" : "Name"}</th>
                <th className="px-4 py-3">{lang === "ar" ? "الرتبة" : "Rank"}</th>
                <th className="px-4 py-3">{lang === "ar" ? "الالتحاق" : "Joined"}</th>
                <th className="px-4 py-3">{lang === "ar" ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-right">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-400/15">
              {filtered.map((o) => {
                const rank = RANKS.find((r) => r.id === o.rankId);
                return (
                  <tr key={o.id} className="bg-obsidian-900/30 transition-colors hover:bg-gold-400/5">
                    <td className="px-4 py-3 font-mono font-bold text-gold-300">{o.badge}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{lang === "ar" ? o.nameAr : o.name}</div>
                      <div className="font-mono text-xs text-zinc-400">{o.callsign}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{rank ? (lang === "ar" ? rank.titleAr : rank.title) : "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{o.joinedAt}</td>
                    <td className="px-4 py-3"><Badge tone={STATUS_TONE[o.status]}>{AR.officerStatus[o.status] || o.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" className="px-2 py-1" title="ترقية" onClick={() => {
                          const idx = RANKS.findIndex((r) => r.id === o.rankId);
                          const next = RANKS[idx - 1];
                          if (next) upsert("officers", { ...o, rankId: next.id });
                        }}>
                          <ArrowUp size={14} />
                        </Button>
                        <Button variant="outline" className="px-2 py-1" title="تبديل الحالة" onClick={() => changeStatus(o, o.status === "on-duty" ? "off-duty" : "on-duty")}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="danger" className="px-2 py-1" title="حذف" onClick={() => remove("officers", o.id)}>
                          <Trash2 size={14} />
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

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "تعديل الفرد" : "إضافة فرد"}>
        <div className="grid gap-4">
          <Field label={lang === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}><Input value={form.nameAr || ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></Field>
          <Field label={lang === "ar" ? "الرتبة" : "Rank"}>
            <Select value={form.rankId || ""} onChange={(e) => setForm({ ...form, rankId: e.target.value })}>
              {RANKS.map((r) => <option key={r.id} value={r.id}>{lang === "ar" ? r.titleAr : r.title}</option>)}
            </Select>
          </Field>
          <Field label={lang === "ar" ? "تاريخ الالتحاق" : "Date joined"}>
            <div className="relative">
              <Calendar size={14} className="absolute top-1/2 -translate-y-1/2 text-zinc-500 ltr:left-3 rtl:right-3" />
              <Input type="date" value={form.joinedAt || ""} onChange={(e) => setForm({ ...form, joinedAt: e.target.value })} className="ltr:pl-9 rtl:pr-9" />
            </div>
          </Field>
          <Field label={lang === "ar" ? "الحالة" : "Status"}>
            <Select value={form.status || "off-duty"} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              {Object.keys(AR.officerStatus).map((s) => <option key={s} value={s}>{lang === "ar" ? AR.officerStatus[s] : s}</option>)}
            </Select>
          </Field>
        </div>

        <div className="mt-6 mb-1 flex items-center gap-2 border-t border-gold-400/15 pt-4">
          <span className="font-display text-sm font-bold gold-text">
            {lang === "ar" ? "بيانات Discord" : "Discord Profile"}
          </span>
        </div>
        <div className="grid gap-4">
          <Field label={lang === "ar" ? "معرّف المستخدم (USER DISCORD ID)" : "Discord User ID"}>
            <Input value={form.discordId || ""} onChange={(e) => setForm({ ...form, discordId: e.target.value })} placeholder="123456789012345678" dir="ltr" />
          </Field>
          <Field label={lang === "ar" ? "اسم المستخدم في ديسكورد" : "Discord username"}>
            <Input value={form.discordName || ""} onChange={(e) => setForm({ ...form, discordName: e.target.value })} placeholder="@username" />
          </Field>
          <Field label={lang === "ar" ? "Avatar Hash" : "Discord avatar hash"}>
            <Input value={form.discordAvatar || ""} onChange={(e) => setForm({ ...form, discordAvatar: e.target.value })} dir="ltr" placeholder="a_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
          <Button onClick={save}><Plus size={16} /> {editing ? "حفظ التغييرات" : "إضافة فرد"}</Button>
        </div>
      </Modal>
    </div>
  );
}
