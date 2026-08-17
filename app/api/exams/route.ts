import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, PERMS } from "@/lib/permissions";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString, cleanObject } from "@/lib/sanitize";
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
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 20, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const claimed = cleanString(body?.actor, 40);

    // SECURITY: the actor is the server-verified cookie identity.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;
    const gate = await requirePermission(actor, PERMS.EXAMS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const title = cleanString(body?.title, 200);
    const description = cleanString(body?.description, 1000);
    const durationMinutes = Math.max(1, Math.min(600, Number(body?.durationMinutes) || 15));
    const status = body?.status === "active" ? "active" : "draft";
    const rawQuestions = Array.isArray(body?.questions) ? body.questions.slice(0, 200) : [];
    const questions = rawQuestions.map((q: any) => ({
      prompt: cleanString(q?.prompt, 2000),
      options: Array.isArray(q?.options)
        ? q.options.map((o: unknown) => cleanString(o, 500)).slice(0, 8)
        : [],
      type: q?.type === "multi" ? "multi" : "single",
      media: ["image", "video"].includes(q?.media) ? q?.media : "none",
      mediaUrl: cleanString(q?.mediaUrl, 2048),
      correctIndex: Number(q?.correctIndex) || 0,
      correctIndices: Array.isArray(q?.correctIndices) ? q.correctIndices.map(Number).slice(0, 8) : [],
      points: Math.max(1, Math.min(100, Number(q?.points) || 1)),
    }));

    if (!title) {
      return NextResponse.json({ ok: false, error: "عنوان الاختبار مطلوب" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: exam, error } = await supabase
      .from("exams")
      .insert({
        title,
        description,
        durationMinutes,
        status,
        createdBy: actor,
        updatedAt: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error || !exam) {
      return NextResponse.json({ ok: false, error: error?.message || "فشل الإنشاء" }, { status: 500 });
    }

    if (questions.length) {
      const rows = questions.map((q: any, i: number) => ({
        examId: exam.id,
        prompt: q.prompt,
        choices: q.options,
        type: q.type,
        media: q.media,
        mediaUrl: q.mediaUrl,
        correctIndex: q.correctIndex,
        correctIndices: q.correctIndices,
        points: q.points,
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
      metadata: { examId: exam.id, durationMinutes: exam.durationMinutes, questions: questions.length },
    });
    return NextResponse.json({ ok: true, exam });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}