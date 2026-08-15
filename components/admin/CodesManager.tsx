"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { MilitaryCode } from "@/lib/types";
import { Button, Card, Badge, Modal, Field, Input, Select, EmptyState } from "@/components/ui";
import { AR } from "@/lib/ar";

const TYPE_TONE: Record<string, any> = {
  "10-code": "gold",
  signal: "amber",
  channel: "slate",
  protocol: "rose",
  callsign: "gold",
};

export function CodesManager() {
  const { codes, upsert, remove, settings } = useStore();
  const lang = settings.language;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MilitaryCode | null>(null);
  const [form, setForm] = useState<Partial<MilitaryCode>>({});

  const openNew = () => {
    setEditing(null);
    setForm({ type: "10-code", code: "", meaning: "", meaningAr: "" });
    setModal(true);
  };
  const openEdit = (c: MilitaryCode) => {
    setEditing(c);
    setForm({ ...c });
    setModal(true);
  };
  const save = () => {
    if (editing) upsert("codes", { ...editing, ...form } as MilitaryCode);
    else upsert("codes", { id: crypto.randomUUID(), ...form } as MilitaryCode);
    setModal(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold gold-text">
          {lang === "ar" ? "إدارة الأكواد العسكرية" : "Military Codes Registry"}
        </h3>
        <Button onClick={openNew}><Plus size={16} /> {lang === "ar" ? "إضافة كود" : "Add Code"}</Button>
      </div>

      <div className="space-y-2.5">
        {codes.length === 0 ? (
          <EmptyState message={lang === "ar" ? "لا توجد أكواد" : "No codes"} />
        ) : (
          codes.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <Badge tone={TYPE_TONE[c.type]}>{AR.codeType[c.type] || c.type}</Badge>
                <span className="font-display font-bold text-gold-200">{c.code}</span>
                <span className="hidden text-sm text-zinc-300 sm:inline">
                  {lang === "ar" ? c.meaningAr : c.meaning}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" className="px-2 py-1" onClick={() => openEdit(c)}><Pencil size={14} /></Button>
                <Button variant="danger" className="px-2 py-1" onClick={() => remove("codes", c.id)}><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "تعديل الكود" : "إضافة كود"}>
        <div className="grid gap-4">
          <Field label={lang === "ar" ? "الكود" : "Code"}><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label={lang === "ar" ? "النوع" : "Type"}>
            <Select value={form.type || "10-code"} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="10-code">{lang === "ar" ? "كود 10" : "10-Code"}</option>
              <option value="signal">{lang === "ar" ? "إشارة" : "Signal"}</option>
              <option value="channel">{lang === "ar" ? "قناة" : "Channel"}</option>
              <option value="protocol">{lang === "ar" ? "بروتوكول" : "Protocol"}</option>
              <option value="callsign">{lang === "ar" ? "نداء" : "Callsign"}</option>
            </Select>
          </Field>
          <Field label="المعنى"><Input value={form.meaningAr || ""} onChange={(e) => setForm({ ...form, meaningAr: e.target.value })} /></Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
          <Button onClick={save}>{editing ? "حفظ" : "إضافة"}</Button>
        </div>
      </Modal>
    </div>
  );
}
