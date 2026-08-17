"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, FileBadge, CheckCircle2, Eye } from "lucide-react";
import { Button, Badge, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/format";
import type { Exam, ExamQuestion } from "@/lib/types";

interface DraftQuestion {
  prompt: string;
  type: "single" | "multi";
  media: "none" | "image" | "video";
  mediaUrl: string;
  options: string[];
  correctIndex: number;
  correctIndices: number[];
  points: number;
}

const EMPTY_Q: DraftQuestion = {
  prompt: "",
  type: "single",
  media: "none",
  mediaUrl: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  correctIndices: [],
  points: 1,
};

// Military Exam Builder (بناء الاختبارات): create/edit exams with typed
// questions (single/multi choice, optional media) and activate them for the
// citizen recruitment portal.
export function ExamBuilder() {
  const { session } = useStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<null | { ok: boolean; text: string }>(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [questions, setQuestions] = useState<DraftQuestion[]>([{ ...EMPTY_Q }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/exams?actor=${encodeURIComponent(session?.discordId || "")}`, { cache: "no-store" });
      const d = await r.json();
      if (d.ok && Array.isArray(d.exams)) setExams(d.exams as Exam[]);
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

  const openNew = () => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setDurationMinutes(15);
    setQuestions([{ ...EMPTY_Q }]);
    setModal(true);
  };

  const openEdit = (exam: Exam) => {
    setEditing(exam);
    setTitle(exam.title);
    setDescription(exam.description || "");
    setDurationMinutes(exam.durationMinutes);
    setQuestions((exam.questions || []).map((q: any) => ({
      prompt: q.prompt,
      type: q.type === "multi" ? "multi" : "single",
      media: q.media || "none",
      mediaUrl: q.mediaUrl || "",
      options: Array.isArray(q.choices) ? q.choices : [],
      correctIndex: q.correctIndex,
      correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : [],
      points: q.points,
    })));
    setModal(true);
  };

  const updateQ = (i: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const save = async () => {
    if (!title.trim()) {
      setMsg({ ok: false, text: "العنوان مطلوب" });
      return;
    }
    const clean = questions
      .filter((q) => q.prompt.trim())
      .map((q) => ({
        ...q,
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()).filter((o) => o),
      }))
      .filter((q) => q.options.length >= 2);
    if (clean.length === 0) {
      setMsg({ ok: false, text: "أضف سؤالاً واحداً على الأقل بخيارين صحيحين" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(editing ? `/api/exams/${editing.id}` : "/api/exams", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          durationMinutes,
          status: "active",
          questions: clean,
          actor: session?.discordId,
        }),
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تم الحفظ" : `فشل: ${d.error || "غير مصرح"}` });
      if (d.ok) {
        setModal(false);
        await load();
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (exam: Exam) => {
    if (!confirm(`حذف اختبار "${exam.title}" نهائياً؟`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/exams/${exam.id}?actor=${encodeURIComponent(session?.discordId || "")}`, {
        method: "DELETE",
      });
      const d = await r.json();
      setMsg({ ok: d.ok, text: d.ok ? "تم الحذف" : `فشل: ${d.error || "غير مصرح"}` });
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg font-bold gold-text">بناء الاختبارات العسكرية</h3>
        <Button onClick={openNew} disabled={busy}>
          <Plus size={16} /> اختبار جديد
        </Button>
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
          <Loader2 size={18} className="animate-spin" /> جارٍ التحميل...
        </div>
      ) : exams.length === 0 ? (
        <EmptyState message="لا توجد اختبارات — أنشئ أول اختبار للتوظيف العسكري." />
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const qs = (exam.questions || []) as ExamQuestion[];
            return (
              <div key={exam.id} className="rounded-xl border border-gold-400/15 bg-obsidian-900/40 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <FileBadge size={16} className="text-gold-300" />
                    <span className="font-display font-bold text-zinc-100">{exam.title}</span>
                    <Badge tone={exam.status === "active" ? "green" : exam.status === "draft" ? "slate" : "amber"}>
                      {exam.status === "active" ? "منشور" : exam.status === "draft" ? "مسودة" : "مؤرشف"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(exam)} className="text-xs text-gold-300 hover:text-gold-200">
                      تعديل
                    </button>
                    <button onClick={() => remove(exam)} className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200" disabled={busy}>
                      <Trash2 size={12} /> حذف
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>{qs.length} سؤال</span>
                  <span>{exam.durationMinutes} دقيقة</span>
                  {exam.description && <span className="truncate">{exam.description}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "تعديل الاختبار" : "اختبار جديد"} wide>
        <div className="space-y-4">
          <Field label="العنوان">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اختبار اللياقة والجاهزية" />
          </Field>
          <Field label="الوصف (اختياري)">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          <Field label="المدة (دقائق)">
            <Input type="number" min={1} max={180} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)} dir="ltr" />
          </Field>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-300">الأسئلة ({questions.length})</span>
            <Button variant="outline" className="!px-2 !py-1 !text-xs" onClick={() => setQuestions((p) => [...p, { ...EMPTY_Q }])}>
              <Plus size={13} /> سؤال
            </Button>
          </div>

          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-gold-400/12 bg-obsidian-900/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gold-200">سؤال {i + 1}</span>
                {questions.length > 1 && (
                  <button onClick={() => setQuestions((p) => p.filter((_, idx) => idx !== i))} className="text-rose-300 hover:text-rose-200">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <Field label="النص">
                <Input value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })} placeholder="اكتب نص السؤال..." />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Select value={q.type} onChange={(e) => updateQ(i, { type: e.target.value as "single" | "multi" })}>
                  <option value="single">اختيار واحد</option>
                  <option value="multi">اختيار متعدد</option>
                </Select>
                <Select value={q.media} onChange={(e) => updateQ(i, { media: e.target.value as DraftQuestion["media"] })}>
                  <option value="none">بدون وسائط</option>
                  <option value="image">صورة</option>
                  <option value="video">فيديو</option>
                </Select>
              </div>
              {q.media !== "none" && (
                <div className="mt-2">
                  <Field label={q.media === "image" ? "رابط الصورة" : "رابط الفيديو"}>
                    <Input value={q.mediaUrl} onChange={(e) => updateQ(i, { mediaUrl: e.target.value })} dir="ltr" placeholder="https://..." />
                  </Field>
                </div>
              )}
              <div className="mt-2 space-y-1.5">
                <span className="text-xs text-zinc-400">الخيارات (ضع علامة √ على الإجابة الصحيحة)</span>
                {q.options.map((opt, oi) => {
                  const isCorrect = q.type === "multi" ? q.correctIndices.includes(oi) : q.correctIndex === oi;
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQ(i, q.type === "multi" ? { correctIndices: isCorrect ? q.correctIndices.filter((x) => x !== oi) : [...q.correctIndices, oi] } : { correctIndex: oi })
                        }
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px]",
                          isCorrect ? "border-green-400 bg-green-500/20 text-green-300" : "border-zinc-600 text-transparent"
                        )}
                      >
                        <CheckCircle2 size={13} />
                      </button>
                      <Input
                        value={opt}
                        onChange={(e) =>
                          updateQ(i, { options: q.options.map((o, idx) => (idx === oi ? e.target.value : o)) })
                        }
                        placeholder={`خيار ${oi + 1}`}
                        className="!py-1.5 !text-sm"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-zinc-400">الدرجة:</span>
                <Input type="number" min={1} max={10} value={q.points} onChange={(e) => updateQ(i, { points: Number(e.target.value) || 1 })} className="!w-20 !py-1 !text-sm" dir="ltr" />
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Eye size={13} /> العدد النهائي: {questions.filter((q) => q.prompt.trim() && q.options.filter((o) => o.trim()).length >= 2).length} سؤال صالح
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setModal(false)}>إلغاء</Button>
              <Button onClick={save} disabled={busy}>
                {busy ? <Loader2 size={16} className="ml-2 animate-spin" /> : <CheckCircle2 size={16} className="ml-2" />}
                {editing ? "حفظ التعديلات" : "إنشاء الاختبار"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}