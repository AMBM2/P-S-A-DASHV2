import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, PERMS } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

// List active exams (public) — or all exams for EXAMS_ADMIN.
export async function GET(req: Request) {
  try {
    const actor = new URL(req.url).searchParams.get("actor") || "";
    const supabase = getSupabaseAdmin();

    let query = supabase.from("exams").select("*, questions:exam_questions(*)");
    if (actor) {
      const gate = await requirePermission(actor, PERMS.EXAMS_ADMIN);
      if (!(gate instanceof NextResponse)) query = query.order("createdAt", { ascending: false });
      else query = query.eq("status", "active");
    } else {
      query = query.eq("status", "active");
    }

    const { data, error } = await query.order("createdAt", { ascending: false });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, exams: [] }, { status: 200 });
    }
    return NextResponse.json({ ok: true, exams: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error", exams: [] }, { status: 200 });
  }
}

// Create a new exam with its questions (EXAMS_ADMIN).
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const actor = String(body?.actor || "");
    const gate = await requirePermission(actor, PERMS.EXAMS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const { title, description, durationMinutes, status, questions } = body;
    if (!title || !String(title).trim()) {
      return NextResponse.json({ ok: false, error: "عنوان الاختبار مطلوب" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: exam, error } = await supabase
      .from("exams")
      .insert({
        title: String(title).trim(),
        description: String(description || "").trim(),
        durationMinutes: Math.max(1, Number(durationMinutes) || 15),
        status: status === "active" ? "active" : "draft",
        createdBy: actor,
        updatedAt: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error || !exam) {
      return NextResponse.json({ ok: false, error: error?.message || "فشل الإنشاء" }, { status: 500 });
    }

    if (Array.isArray(questions) && questions.length) {
      const rows = questions.map((q: any, i: number) => ({
        examId: exam.id,
        prompt: String(q.prompt || "").trim(),
        choices: Array.isArray(q.options) ? q.options : [],
        type: q.type === "multi" ? "multi" : "single",
        media: ["image", "video"].includes(q.media) ? q.media : "none",
        mediaUrl: String(q.mediaUrl || ""),
        correctIndex: Number(q.correctIndex) || 0,
        correctIndices: Array.isArray(q.correctIndices) ? q.correctIndices : [],
        points: Math.max(1, Number(q.points) || 1),
        sortOrder: i,
        active: true,
      }));
      const { error: qErr } = await supabase.from("exam_questions").insert(rows);
      if (qErr) {
        return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
      }
    }

    await auditLog({
      action: "exams.create",
      actionAr: "إنشاء اختبار عسكري",
      executor: actor,
      targetName: exam.title,
      metadata: { examId: exam.id, durationMinutes: exam.durationMinutes, questions: questions?.length || 0 },
    });
    return NextResponse.json({ ok: true, exam });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}