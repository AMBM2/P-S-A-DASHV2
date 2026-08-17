import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auditLog } from "@/lib/audit";

// Auto-grade an exam attempt for a citizen. Mandatory ID verification:
// recruiter Discord ID + citizen Discord ID. Stores the detailed score report
// in exam_attempts and writes an audit log entry.
export async function POST(req: Request) {
  try {
    const { examId, recruiterId, citizenId, citizenName, answers } = await req.json();
    if (!examId) {
      return NextResponse.json({ ok: false, error: "examId مطلوب" }, { status: 400 });
    }
    const recruiter = String(recruiterId || "").trim();
    const citizen = String(citizenId || "").trim();
    if (!/^\d{15,20}$/.test(recruiter) || !/^\d{15,20}$/.test(citizen)) {
      return NextResponse.json(
        { ok: false, error: "يجب إدخال معرّف ديسكورد صالح لكل من المجنّد والمتقدّم" },
        { status: 400 }
      );
    }

    const submitted: number[][] = Array.isArray(answers) ? answers : [];

    const supabase = getSupabaseAdmin();
    const { data: exam } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .eq("status", "active")
      .single();
    if (!exam) {
      return NextResponse.json({ ok: false, error: "الاختبار غير نشط أو غير موجود" }, { status: 404 });
    }

    const { data: questions } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("examId", examId)
      .order("sortOrder", { ascending: true });
    const qs = (questions || []).filter((q: any) => Array.isArray(q?.choices));

    let earned = 0;
    let total = 0;
    const detail: { q: string; earned: number; total: number; correct: boolean }[] = [];
    qs.forEach((q: any, i: number) => {
      const pts = Math.max(1, Number(q.points) || 1);
      total += pts;
      const given: number[] = Array.isArray(submitted[i]) ? submitted[i].map(Number) : [];
      let correct = false;
      if (q.type === "multi") {
        const want: number[] = Array.isArray(q.correctIndices)
          ? q.correctIndices.map(Number)
          : [];
        correct = want.length > 0 && given.length === want.length && want.every((w) => given.includes(w));
      } else {
        const want = Number(q.correctIndex);
        correct = given.length === 1 && given[0] === want;
      }
      if (correct) earned += pts;
      detail.push({ q: String(q.prompt || "").slice(0, 60), earned: correct ? pts : 0, total: pts, correct });
    });

    const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;
    const passed = percentage >= 50;

    const { error } = await supabase.from("exam_attempts").insert({
      examId,
      recruiterId: recruiter,
      citizenId: citizen,
      citizenName: String(citizenName || "").trim(),
      answers: submitted,
      score: earned,
      total,
      percentage,
      passed,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "exams.completed",
      actionAr: "إكمال اختبار مواطن",
      executor: recruiter,
      executorName: "المجنّد",
      target: citizen,
      targetName: String(citizenName || "").trim(),
      metadata: { examId, examTitle: exam.title, score: earned, total, percentage, passed, detail },
    });

    return NextResponse.json({
      ok: true,
      score: earned,
      total,
      percentage,
      passed,
      correctCount: detail.filter((d) => d.correct).length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}