"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileQuestion,
  Award,
  ShieldCheck,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/format";
import type { Exam, ExamQuestion } from "@/lib/types";
import { isYoutubeUrl } from "@/lib/upload";

interface Selections {
  single: number[];
  multi: number[][];
}

// Interactive Military Exam Engine — enforced timer, animated feedback,
// auto-grading with a pass/fail verdict.
export default function ExamEnginePage() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const recruiterId = params.get("recruiterId") || "";
  const citizenId = params.get("citizenId") || "";
  const citizenName = params.get("name") || "";

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [sel, setSel] = useState<Selections>({ single: [], multi: [] });
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { score: number; total: number; percentage: number; passed: boolean; correctCount: number }>(null);
  const [submitError, setSubmitError] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch(`/api/exams/${id}`, { cache: "no-store" });
        const d = await r.json();
        if (!active) return;
        if (d.ok && d.exam) {
          setExam(d.exam as Exam);
          const qs = ((d.exam.questions || []) as any[]).map((q: any) => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : Array.isArray(q.choices) ? q.choices : [],
          }));
          setQuestions(qs as ExamQuestion[]);
          setSel({
            single: new Array(qs.length).fill(-1),
            multi: new Array(qs.length).fill([]),
          });
          setSecondsLeft(Number(d.exam.durationMinutes) * 60);
        } else {
          setLoadError(d.error || "الاختبار غير موجود");
        }
      } catch {
        if (active) setLoadError("تعذر الاتصال بالخادم");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const totalPts = useMemo(() => questions.reduce((s, q) => s + Math.max(1, Number(q.points) || 1), 0), [questions]);

  useEffect(() => {
    if (finished || loading || !exam || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [finished, loading, exam, secondsLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  const chooseSingle = (qi: number, ci: number) =>
    setSel((p) => ({ ...p, single: p.single.map((v, i) => (i === qi ? ci : v)) }));

  const toggleMulti = (qi: number, ci: number) =>
    setSel((p) => {
      const cur = p.multi[qi] || [];
      const next = cur.includes(ci) ? cur.filter((x) => x !== ci) : [...cur, ci];
      return { ...p, multi: p.multi.map((v, i) => (i === qi ? next : v)) };
    });

  const answeredCount = questions.filter((q, i) =>
    q.type === "multi" ? (sel.multi[i] || []).length > 0 : sel.single[i] >= 0
  ).length;

  const submit = async (force = false) => {
    if (submittedRef.current || submitting) return;
    if (!force && answeredCount === 0) {
      setSubmitError("أجب عن سؤال واحد على الأقل قبل الإرسال");
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      const answers = questions.map((q, i) =>
        q.type === "multi" ? (sel.multi[i] || []) : sel.single[i] >= 0 ? [sel.single[i]] : []
      );
      const r = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: id, recruiterId, citizenId, citizenName, answers }),
      });
      const d = await r.json();
      if (!d.ok) {
        setSubmitError(d.error || "فشل الإرسال");
        submittedRef.current = false;
        setSubmitting(false);
        return;
      }
      setResult({ score: d.score, total: d.total, percentage: d.percentage, passed: d.passed, correctCount: d.correctCount });
      setFinished(true);
    } catch {
      setSubmitError("تعذر الاتصال بالخادم");
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-zinc-400">
        <Loader2 size={20} className="animate-spin" /> جارٍ تحميل الاختبار...
      </div>
    );
  }

  if (loadError || !exam) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-xl items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-8 text-center text-red-200">
          <AlertTriangle size={28} />
          <p className="font-bold">{loadError || "الاختبار غير متوفر"}</p>
        </div>
      </div>
    );
  }

  if (finished && result) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="w-full"
        >
          <Card className="text-center">
            <div className="mb-4 flex justify-center">
              <motion.div
                initial={{ rotate: -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full border-2",
                  result.passed ? "border-emerald-400 bg-emerald-500/15 text-emerald-300" : "border-rose-400 bg-rose-500/15 text-rose-300"
                )}
              >
                {result.passed ? <ShieldCheck size={36} /> : <XCircle size={36} />}
              </motion.div>
            </div>

            <h1 className="font-display text-2xl font-black gold-text">{result.passed ? "تم القبول" : "لم يجتز الاختبار"}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {result.passed
                ? "النتيجة مؤهلة — سيتم التواصل معك عبر ديسكورد لاستكمال التوظيف."
                : "الدرجة أقل من الحد الأدنى المطلوب. يمكنك إعادة المحاولة لاحقاً."}
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="font-display text-3xl font-black text-white">{result.percentage}%</div>
                  <div className="text-[11px] text-zinc-500">النسبة</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-black text-white">
                    {result.score} <span className="text-base text-zinc-500">/ {result.total}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500">الدرجة</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-black text-white">{result.correctCount}</div>
                  <div className="text-[11px] text-zinc-500">إجابات صحيحة</div>
                </div>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-obsidian-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.percentage}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                  className={cn("h-full rounded-full", result.passed ? "bg-emerald-400" : "bg-rose-400")}
                />
              </div>

              <div className={cn("rounded-lg border p-3 text-sm", result.passed ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200")}>
                {result.passed ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} /> الحد الأدنى للنجاح 50%
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <AlertTriangle size={16} /> الحد الأدنى للنجاح 50% — حاول مرة أخرى
                  </span>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-black gold-text">{exam.title}</h1>
          {exam.description && <p className="mt-1 text-sm text-zinc-400">{exam.description}</p>}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-bold",
            secondsLeft <= 60 ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : "border-gold-400/25 bg-obsidian-900/60 text-gold-200"
          )}
        >
          <Clock size={15} />
          <span className="tabular-nums" dir="ltr">
            {mm}:{ss.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-lg border border-gold-400/15 bg-obsidian-900/40 px-4 py-2 text-xs text-zinc-400">
        <span>
          أجبت عن <span className="font-bold text-gold-200">{answeredCount}</span> من <span className="font-bold">{questions.length}</span>
        </span>
        <span>المجموع: {totalPts} نقطة</span>
      </div>

      <div className="space-y-5">
        <AnimatePresence initial={false}>
          {questions.map((q, qi) => {
            const isMulti = q.type === "multi";
            const chosen = isMulti ? sel.multi[qi] || [] : [sel.single[qi]];
            return (
              <motion.div
                key={q.id || qi}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.05 }}
              >
                <Card className="!p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      <span className="ml-1 text-gold-300">{qi + 1}.</span>
                      {q.prompt}
                      {isMulti && <span className="mr-1 text-[10px] text-amber-300">(اختيار متعدد)</span>}
                    </p>
                    <span className="shrink-0 rounded-full border border-gold-400/25 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold text-gold-200">
                      {Math.max(1, Number(q.points) || 1)} نقطة
                    </span>
                  </div>

                  {q.media !== "none" && q.mediaUrl && (
                    <div className="mb-3 overflow-hidden rounded-lg bg-black">
                      {q.media === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={q.mediaUrl} alt="" className="max-h-64 w-full object-contain" />
                      ) : isYoutubeUrl(q.mediaUrl) ? (
                        <iframe
                          src={`${q.mediaUrl}?controls=0&autoplay=0&rel=0`}
                          title="سؤال"
                          className="aspect-video w-full"
                          allow="autoplay; encrypted-media; picture-in-picture"
                        />
                      ) : (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video src={q.mediaUrl} controls className="max-h-64 w-full" />
                      )}
                    </div>
                  )}

                  <div className="grid gap-2">
                    {(q.options || []).map((opt, ci) => {
                      const active = chosen.includes(ci);
                      return (
                        <button
                          key={ci}
                          onClick={() => (isMulti ? toggleMulti(qi, ci) : chooseSingle(qi, ci))}
                          className={cn(
                            "flex items-center gap-2 rounded-lg border p-2.5 text-right text-sm transition-all",
                            active
                              ? "border-gold-300/70 bg-gold-400/15 text-gold-100"
                              : "border-gold-400/15 bg-obsidian-800/60 text-gray-600 hover:border-gold-400/40"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                              active ? "border-gold-300 bg-gold-300 text-obsidian-900" : "border-zinc-600 text-zinc-500"
                            )}
                          >
                            {isMulti && active ? <CheckCircle2 size={11} /> : ci + 1}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {submitError && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          <AlertTriangle size={16} /> {submitError}
        </div>
      )}

      <Button onClick={() => submit()} disabled={submitting} className="mt-6 w-full py-3 text-base font-bold">
        {submitting ? (
          <Loader2 size={18} className="ml-2 animate-spin" />
        ) : (
          <Award size={18} className="ml-2" />
        )}
        {submitting ? "جارٍ التصحيح..." : `تسليم الإجابات (${answeredCount} / ${questions.length})`}
      </Button>
    </div>
  );
}