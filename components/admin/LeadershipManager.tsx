"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ImagePlus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Leader } from "@/lib/types";
import { Button, Card, Modal, Field, Input, EmptyState } from "@/components/ui";

export function LeadershipManager() {
  const { leaders, upsert, remove, settings } = useStore();
  const lang = settings.language;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [form, setForm] = useState<Partial<Leader>>({});

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", nameAr: "", title: "", titleAr: "", rank: "", badge: "", photo: "" });
    setModal(true);
  };
  const openEdit = (l: Leader) => {
    setEditing(l);
    setForm({ ...l });
    setModal(true);
  };

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (editing) {
      upsert("leaders", { ...editing, ...form } as Leader);
    } else {
      upsert("leaders", { id: crypto.randomUUID(), ...form } as Leader);
    }
    setModal(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold gold-text">
          {lang === "ar" ? "إدارة القيادة" : "Leadership Council"}
        </h3>
        <Button onClick={openNew}><Plus size={16} /> {lang === "ar" ? "إضافة قائد" : "Add Leader"}</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState message={lang === "ar" ? "لا يوجد قادة بعد" : "No leadership members"} />
          </div>
        ) : (
          leaders.map((l) => {
            return (
              <Card key={l.id} className="flex items-center gap-4">
                {l.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photo} alt="" className="h-16 w-16 shrink-0 rounded-full border-2 border-gold-400/40 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-gold-400/30 bg-obsidian-900/70">
                    <ImagePlus className="text-zinc-500" size={22} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-display font-bold text-white">{lang === "ar" ? l.nameAr : l.name}</h4>
                  <div className="text-xs text-gold-300">{l.rank || (lang === "ar" ? l.titleAr : l.title)}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button variant="outline" className="px-2 py-1" onClick={() => openEdit(l)}><Pencil size={13} /></Button>
                  <Button variant="danger" className="px-2 py-1" onClick={() => remove("leaders", l.id)}><Trash2 size={13} /></Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "تعديل القائد" : "إضافة قائد"}>
        <div className="grid gap-4">
          <Field label={lang === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}><Input value={form.nameAr || ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} /></Field>
          <Field label={lang === "ar" ? "الرتبة / المسمى" : "Rank / Title"}>
            <Input value={form.rank || ""} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder={lang === "ar" ? "مثال: مدير الأمن العام" : "e.g. Director of Public Security"} />
          </Field>
          <Field label={lang === "ar" ? "المسمى (عربي)" : "Title (AR)"}>
            <Input value={form.titleAr || ""} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
          </Field>
          <Field label={lang === "ar" ? "المسمى (إنجليزي)" : "Title (EN)"}>
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={lang === "ar" ? "الشارة" : "Badge"}>
            <Input value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="PSA-000" />
          </Field>
          <Field label={lang === "ar" ? "الصورة الشخصية" : "Photo"}>
            <div className="flex items-center gap-3">
              <label className="gold-shimmer inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-sm text-gold-200 hover:border-gold-400/70">
                <ImagePlus size={16} /> {lang === "ar" ? "رفع صورة" : "Upload photo"}
                <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              </label>
              {form.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.photo} alt="" className="h-12 w-12 rounded-full border border-gold-400/20 object-cover" />
              )}
            </div>
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
          <Button onClick={save}>{editing ? "حفظ" : "إضافة"}</Button>
        </div>
      </Modal>
    </div>
  );
}
