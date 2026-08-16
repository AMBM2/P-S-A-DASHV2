import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

// Score an exam: compare the submitted answers to the questions' correctIndex,
// persist the score on the application + cadet records.
export async function POST(req: Request) {
  try {
    const { applicationId, answers } = await req.json();
    if (!applicationId) {
      return NextResponse.json({ ok: false, error: "applicationId مطلوب" }, { status: 400 });
    }
    const submitted: number[] = Array.isArray(answers) ? answers : [];

    const supabase = getSupabase();
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