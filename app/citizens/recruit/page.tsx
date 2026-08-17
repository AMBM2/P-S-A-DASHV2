"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileBadge, ClipboardList, Loader2, AlertTriangle, ArrowRight, Clock, UserCheck } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { cn } from "@/lib/format";
import type { Exam } from "@/lib/types";

// توظيف مواطن — citizen job portal: pick the recruitment exam, verify the
// recruiter (المجنّد) + citizen Discord IDs, then sit the exam.
export default function CitizensRecruitPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruiterId, setRecruiterId] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [picked, setPicked] = useState<Exam | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await fetch("/api/exams", { cache: "no-store" });
        const d = await r.json();
        if (!active) return;
        if (d.ok && Array.isArray(d.exams)) setExams(d.exams as Exam[]);
        else setError(d.error || "تعذر جلب الاختبارات");
      } catch {
        if (active) setError("تعذر الاتصال بالخادم");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const start = () => {
    setError("");
    if (!/^\d{15,20}$/.test(recruiterId.trim()) || !/^\d{15,20}$/.test(citizenId.trim())) {
      setError("يجب إدخال معرّف ديسكورد صالح (15–20 رقماً) للمجنّد والمتقدّم");
      return;
    }
    if (!citizenName.trim()) {
      setError("أدخل اسم المتقدّم");
      return;
    }
    const q = new URLSearchParams({
      recruiterId: recruiterId.trim(),
      citizenId: citizenId.trim(),
      name: citizenName.trim(),
    });
    router.push(`/exam/${picked!.id}?${q.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-black gold-text">توظيف مواطن</h1>
        <p className="mt-2 text-sm text-zinc-400">اختر الوظيفة، تحقق من الهوية، وأدِّ الاختبار العسكري إلكترونياً.</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center gap-2 border-b border-gold-400/15 pb-3">
            <FileBadge size={18} className="text-gold-300" />
            <h2 className="font-display font-bold text-white">الوظائف المتاحة</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-zinc-400">
              <Loader2 size={18} className="animate-spin" /> جارٍ تحميل الوظائف...
            </div>
          ) : exams.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-500">لا توجد وظائف مفتوحة حالياً.</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const active = picked?.id === exam.id;
                const qCount = (exam.questions || []).length;
                return (
                  <button
                    key={exam.id}
                    onClick={() => setPicked(exam)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-right transition-all",
                      active
                        ? "border-gold-300/70 bg-gold-400/15"
                        : "border-gold-400/15 bg-obsidian-900/50 hover:border-gold-400/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{exam.title}</span>
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                          active ? "border-gold-300 bg-gold-300 text-obsidian-900" : "border-zinc-600 text-transparent"
                        )}
                      >
                        <ArrowRight size={12} />
                      </span>
                    </div>
                    {exam.description && <p className="mt-1 text-xs text-zinc-400">{exam.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <ClipboardList size={11} /> {qCount} سؤال
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {exam.durationMinutes} دقيقة
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2 border-b border-gold-400/15 pb-3">
            <UserCheck size={18} className="text-gold-300" />
            <h2 className="font-display font-bold text-white">التحقق من الهوية</h2>
          </div>

          <div className="space-y-4">
            <Field label="معرّف المجنّد (Discord ID)">
              <Input value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} dir="ltr" placeholder="123456789012345678" className="text-left" />
            </Field>
            <Field label="معرّف المتقدّم (Discord ID)">
              <Input value={citizenId} onChange={(e) => setCitizenId(e.target.value)} dir="ltr" placeholder="123456789012345678" className="text-left" />
            </Field>
            <Field label="اسم المتقدّم">
              <Input value={citizenName} onChange={(e) => setCitizenName(e.target.value)} dir="rtl" placeholder="الاسم الثلاثي" />
            </Field>

            <Button onClick={start} disabled={!picked || loading} className="w-full py-3 text-base font-bold">
              {!picked ? "اختر وظيفة أولاً" : `ابدأ الاختبار`}
            </Button>
            <p className="text-center text-[11px] text-zinc-500">
              للعثور على معرّفك: ديسكورد ← كليك يمين على اسمك ← نسخ المعرّف.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}