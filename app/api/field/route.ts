import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, nameAr, image, participants } = body || {};

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "اسم السيناريو مطلوب" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const participantIds: string[] = Array.isArray(participants)
      ? participants.filter((p: unknown) => typeof p === "string" && /^\d{15,20}$/.test(p))
      : [];

    const { data: patrol, error: pErr } = await supabase
      .from("patrols")
      .insert({
        name,
        nameAr: nameAr || "",
        image: image || null,
        participants: participantIds,
        participantCount: participantIds.length,
        status: "pending",
      })
      .select()
      .single();

    if (pErr) {
      return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
    }

    // The bot listens for patrol INSERTs via Realtime and posts the alert
    // to the patrol channel (config.patrolChannelId) with rank mentions.
    return NextResponse.json({
      ok: true,
      patrolId: patrol.id,
      participants: participantIds,
      count: participantIds.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}