import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, PERMS } from "@/lib/permissions";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";

// Single exam (with questions). Public fetch only for active exams; editing
// (PUT/DELETE) requires EXAMS_ADMIN.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = (await params).id;
    const actor = new URL(req.url).searchParams.get("actor") || "";
    const supabase = getSupabaseAdmin();

    const query = supabase
      .from("exams")
      .select("*, questions:exam_questions(*)")
      .eq("id", id);
    if (!actor) query.eq("status", "active");
    else {
      const gate = await requirePermission(actor, PERMS.EXAMS_ADMIN);
      if (gate instanceof NextResponse) {
        query.eq("status", "active");
      }
    }

    const { data, error } = await query.single();
    if (error || !data) {
      return NextResponse.json({ ok: false, error: error?.message || "الاختبار غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, exam: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 20, windowMs: 60_000 })) return tooMany();

    const id = (await params).id;
    const body = await req.json();
    const claimed = cleanString(body?.actor, 40);

    // SECURITY: the actor is the server-verified cookie identity.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;
    const gate = await requirePermission(actor, PERMS.EXAMS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("exams").select("title").eq("id", id).single();
    if (!existing) {
      return NextResponse.json({ ok: false, error: "الاختبار غير موجود" }, { status: 404 });
    }

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const title = cleanString(body?.title, 200);
    const description = cleanString(body?.description, 1000);
    const durationMinutes = Number(body?.durationMinutes);
    if (title) patch.title = title;
    if (typeof body?.description === "string") patch.description = description;
    if (durationMinutes > 0) patch.durationMinutes = Math.max(1, Math.min(600, durationMinutes));
    if (["draft", "active", "archived"].includes(body?.status)) patch.status = body.status;

    const { error } = await supabase.from("exams").update(patch).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Replace questions when a full question set is provided.
    if (Array.isArray(body?.questions)) {
      await supabase.from("exam_questions").delete().eq("examId", id);
      const rawQuestions = (body.questions as any[]).slice(0, 200);
      if (rawQuestions.length) {
        const rows = rawQuestions.map((q: any, i: number) => ({
          examId: id,
          prompt: cleanString(q?.prompt, 2000),
          choices: Array.isArray(q?.options)
            ? q.options.map((o: unknown) => cleanString(o, 500)).slice(0, 8)
            : [],
          type: q?.type === "multi" ? "multi" : "single",
          media: ["image", "video"].includes(q?.media) ? q?.media : "none",
          mediaUrl: cleanString(q?.mediaUrl, 2048),
          correctIndex: Number(q?.correctIndex) || 0,
          correctIndices: Array.isArray(q?.correctIndices) ? q.correctIndices.map(Number).slice(0, 8) : [],
          points: Math.max(1, Math.min(100, Number(q?.points) || 1)),
          sortOrder: i,
          active: true,
        }));
        const { error: qErr } = await supabase.from("exam_questions").insert(rows);
        if (qErr) {
          return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
        }
      }
    }

    await auditLog({
      action: "exams.update",
      actionAr: "تعديل اختبار عسكري",
      executor: actor,
      target: id,
      targetName: patch.title as string,
      metadata: { status: patch.status },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 20, windowMs: 60_000 })) return tooMany();

    const id = (await params).id;
    const claimed = cleanString(new URL(req.url).searchParams.get("actor"), 40);

    // SECURITY: the actor is the server-verified cookie identity.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;
    const gate = await requirePermission(actor, PERMS.EXAMS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase.from("exams").select("title").eq("id", id).single();
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "exams.delete",
      actionAr: "حذف اختبار عسكري",
      executor: actor,
      target: id,
      targetName: existing?.title || "",
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}