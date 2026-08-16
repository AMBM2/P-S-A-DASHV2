"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, AlertTriangle, FileQuestion } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/format";
import type { ExamQuestion } from "@/lib/types";

// Military College entrance exam — reviewer selects the applicant's answers,
// submission computes the score server-side and persists it.
export function ExamPanel({
  applicationId,
  onScored,
}: {
  applicationId: string;
  onScored?: (score: number, total: number) => void;
}) {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; score: number; total: number; error?: string }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/exam/questions", { cache: "no-store" });
      const d = await r.json();
      setQuestions(d.questions || []);
      setAnswers(new Array((d.questions || []).length).fill(-1));
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const choose = (qi: number, ci: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = ci;
      return next;
    });
  };

  const submit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, answers }),
      });
      const d = await r.json();
      setResult({ ok: d.ok, score: d.score ?? 0, total: d.total ?? 0, error: d.error });
      if (d.ok) onScored?.(d.score ?? 0, d.total ?? 0);
    } catch {
      setResult({ ok: false, score: 0, total: 0, error: "تعذر الاتصال بالخادم" });
    } finally {
      setSubmitting(false);
    }
  };

  const answered = answers.filter((a) => a >= 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
        <Loader2 size={18} className="animate-spin" /> جارٍ تحميل الأسئلة...
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-zinc-400">
        <FileQuestion size={28} />
        <p>لا توجد أسئلة اختبار بعد.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          أجيب عن {answered} من {questions.length}
        </span>
        <Badge tone="gold">اختبار الكلية العسكرية</Badge>
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-gold-400/15 bg-obsidian-900/50 p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              <span className="ml-1 text-gold-300">{qi + 1}.</span>
              {q.prompt}
            </p>
            <Badge tone="slate">{q.points} نقطة</Badge>
          </div>
          <div className="grid gap-2">
            {q.choices.map((c, ci) => {
              const active = answers[qi] === ci;
              return (
                <button
                  key={ci}
                  onClick={() => choose(qi, ci)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-right text-sm transition-all",
                    active
                      ? "border-gold-300/70 bg-gold-400/15 text-gold-100"
                      : "border-gold-400/15 bg-obsidian-800/60 text-zinc-300 hover:border-gold-400/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                      active ? "border-gold-300 bg-gold-300 text-obsidian-900" : "border-zinc-600 text-zinc-500"
                    )}
                  >
                    {ci + 1}
                  </span>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Button onClick={submit} disabled={submitting || answered === 0} className="w-full py-3 font-bold">
        {submitting ? <Loader2 size={18} className="ml-2 animate-spin" /> : <CheckCircle2 size={18} className="ml-2" />}
        حفظ النتيجة ({answered} / {questions.length})
      </Button>

      {result && (
        <div
          className={cn(
            "rounded-lg border p-4 text-sm",
            result.ok
              ? "border-gold-300/40 bg-gold-400/10 text-gold-100"
              : "border-red-400/30 bg-red-500/10 text-red-200"
          )}
        >
          {result.ok ? (
            <div className="font-bold">
              تم حفظ النتيجة: {result.score} / {result.total}
            </div>
          ) : (
            <div className="font-bold">فشل الحفظ: {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
}