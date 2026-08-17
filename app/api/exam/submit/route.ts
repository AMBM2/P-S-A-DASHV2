import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";

// Score an exam: compare the submitted answers to the questions' correctIndex,
// persist the score on the application + cadet records.
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 60, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const applicationId = cleanString(body?.applicationId, 64);
    const submitted: number[] = Array.isArray(body?.answers)
      ? body.answers.filter((a: unknown) => typeof a === "number").slice(0, 300)
      : [];

    // Exam scoring is an admin-only write to recruitment records.
    const grantsGate = await requireGrants(cleanString(body?.actor || "", 40), ["hr", "executive", "master"]);
    const permGate = await requirePermission(cleanString(body?.actor || "", 40), PERMS.RECRUITMENT_ADMIN);
    if (grantsGate instanceof NextResponse && permGate instanceof NextResponse) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    if (!applicationId) {
      return NextResponse.json({ ok: false, error: "applicationId مطلوب" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: questions, error } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("active", true);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const qs = (questions || []).filter((q: any) => Array.isArray(q?.choices));
    let earned = 0;
    let total = 0;
    qs.forEach((q: any, i: number) => {
      total += Number(q.points || 1);
      if (submitted[i] === q.correctIndex) earned += Number(q.points || 1);
    });

    await supabase
      .from("applications")
      .update({ examScore: earned, examAnswers: submitted })
      .eq("id", applicationId)
      .then(() => {});

    await supabase
      .from("cadets")
      .update({ examScore: earned })
      .eq("applicationId", applicationId)
      .then(() => {});

    return NextResponse.json({ ok: true, score: earned, total, answers: submitted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}