"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Pin, Eye, FileText, ImagePlus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { News } from "@/lib/types";
import { Button, Card, Badge, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { AR } from "@/lib/ar";

const PRIORITY_TONE: Record<string, any> = {
  critical: "rose",
  high: "amber",
  normal: "gold",
  low: "slate",
};

const emptyForm = (): Omit<News, "id" | "views"> => ({
  title: "",
  titleAr: "",
  body: "",
  bodyAr: "",
  category: "general",
  priority: "normal",
  author: "Admin",
  publishedAt: new Date().toISOString(),
  pinned: false,
  status: "draft",
  commentsEnabled: true,
  image: "",
  images: [],
});

export function NewsManager() {
  const { news, upsert, remove, settings } = useStore();
  const lang = settings.language;
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<News | null>(null);
  const [form, setForm] = useState(emptyForm());
  const cats = settings.newsCategories || [];

  const catLabel = (cid: string) => {
    const c = cats.find((x) => x.id === cid);
    return lang === "ar" ? c?.labelAr || AR.category[cid] || cid : c?.label || cid;
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setModal(true);
  };
  const openEdit = (n: News) => {
    setEditing(n);
    const { id: _id, views: _v, ...rest } = n;
    setForm({ ...rest, images: n.images || (n.image ? [n.image] : []) });
    setModal(true);
  };

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        setForm((f) => ({ ...f, images: [...(f.images || []), url], image: (f.images?.length ? f.image : url) || url }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => {
    setForm((f) => {
      const images = (f.images || []).filter((_, i) => i !== idx);
      return { ...f, images, image: images[0] || "" };
    });
  };

  const save = () => {
    if (editing) {
      upsert("news", { ...editing, ...form } as News);
    } else {
      upsert("news", { id: crypto.randomUUID(), views: 0, ...form } as News);
    }
    setModal(false);
  };

  const sorted = [...news].sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.publishedAt) - +new Date(a.publishedAt));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold gold-text">
          {lang === "ar" ? "إدارة الأخبار والتوجيهات" : "News & Directives"}
        </h3>
        <Button onClick={openNew}>
          <Plus size={16} /> {lang === "ar" ? "مقال جديد" : "New Article"}
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <EmptyState message={lang === "ar" ? "لا توجد أخبار" : "No news"} />
        ) : (
          sorted.map((n) => (
            <Card key={n.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {n.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-gold-400/20 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-gold-400/20 bg-obsidian-900/60">
                    <ImagePlus className="text-zinc-500" size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={PRIORITY_TONE[n.priority]}>{AR.priority[n.priority] || n.priority}</Badge>
                    <select
                      value={n.category}
                      onChange={(e) => upsert("news", { ...n, category: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-pointer rounded-full border border-gold-400/25 bg-obsidian-900/80 px-2 py-0.5 text-xs text-gold-200 outline-none focus:border-gold-400/70"
                      title="تغيير الفئة"
                    >
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {lang === "ar" ? c.labelAr : c.label}
                        </option>
                      ))}
                    </select>
                    <Badge tone={n.status === "published" ? "green" : n.status === "draft" ? "slate" : "amber"}>
                      {AR.newsStatus[n.status] || n.status}
                    </Badge>
                    {n.pinned && <Badge tone="amber"><Pin size={10} /> مثبت</Badge>}
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Eye size={12} /> {n.views}
                    </span>
                  </div>
                  <h4 className="truncate font-semibold text-white">
                    {lang === "ar" ? n.titleAr : n.title}
                  </h4>
                  <div className="mt-0.5 text-xs text-zinc-500">{formatDate(n.publishedAt, lang)}</div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" className="px-3 py-1.5" onClick={() => upsert("news", { ...n, pinned: !n.pinned })}>
                  <Pin size={15} />
                </Button>
                <Button variant="outline" className="px-3 py-1.5" onClick={() => openEdit(n)}>
                  <Pencil size={15} />
                </Button>
                <Button variant="danger" className="px-3 py-1.5" onClick={() => remove("news", n.id)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "تعديل الخبر" : "خبر جديد"} wide>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="العنوان (عربي)" className="md:col-span-2">
            <Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} />
          </Field>
          <Field label="المحتوى (عربي)" className="md:col-span-2">
            <Textarea value={form.bodyAr} onChange={(e) => setForm({ ...form, bodyAr: e.target.value })} />
          </Field>
          <Field label="الفئة" className="md:col-span-2">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "ar" ? c.labelAr : c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الأولوية">
            <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}>
              <option value="low">منخفض</option>
              <option value="normal">عادي</option>
              <option value="high">مرتفع</option>
              <option value="critical">حرج</option>
            </Select>
          </Field>
          <Field label="الحالة">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
              <option value="published">منشور</option>
            </Select>
          </Field>
          <Field label="الكاتب">
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </Field>
          <Field label="صور المقال (يمكن إضافة أكثر من صورة)" className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <label className="gold-shimmer inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-2 text-sm text-gold-200 hover:border-gold-400/70">
                <ImagePlus size={16} /> إضافة صور
                <input type="file" accept="image/*" multiple onChange={onImage} className="hidden" />
              </label>
              {(form.images || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(form.images || []).map((src, i) => (
                    <div key={i} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt=""
                        className={`h-16 w-16 rounded-lg border object-cover transition-all ${
                          i === 0 ? "border-gold-400/70 ring-1 ring-gold-400/50" : "border-gold-400/20"
                        }`}
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white transition-transform hover:scale-110"
                        aria-label="حذف الصورة"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-zinc-500">
                {form.images?.length || 0} صورة — أول صورة تظهر كغلاف في القائمة.
              </p>
            </div>
          </Field>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} className="accent-gold-400" />
            تثبيت في الأعلى
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.commentsEnabled} onChange={(e) => setForm({ ...form, commentsEnabled: e.target.checked })} className="accent-gold-400" />
            تفعيل التعليقات
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
          <Button onClick={save}><FileText size={16} /> {editing ? "حفظ التغييرات" : "إنشاء المقال"}</Button>
        </div>
      </Modal>
    </div>
  );
}
