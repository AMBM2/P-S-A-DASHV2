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

    const participantIds: string[] = Array.isArray(participants)
      ? participants.filter((p: unknown) => typeof p === "string" && /^\d{15,20}$/.test(p))
      : [];

    // Dispatch directly to the bot (posts the alert to the patrol channel with
    // rank mentions). Works even before the patrols table exists in Supabase.
    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";
    let botResult: any = { ok: false, error: "bot unreachable", count: 0 };

    try {
      const r = await fetch(`${botUrl}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({
          name: name.trim(),
          nameAr: name.trim(),
          image: image?.trim() || null,
          participants: participantIds,
        }),
      });
      try {
        botResult = await r.json();
      } catch {
        botResult = { ok: false, error: "استجابة غير متوقعة من البوت", count: 0 };
      }
    } catch (e: any) {
      botResult = { ok: false, error: e?.message || "bot unreachable", count: 0 };
    }

    if (!botResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: botResult.error || "تعذر إرسال التنبيه",
          participants: participantIds,
          count: participantIds.length,
        },
        { status: 200 }
      );
    }

    // Best-effort persistence (ignored if the patrols table doesn't exist).
    const supabase = getSupabase();
    await supabase
      .from("patrols")
      .insert({
        name: name.trim(),
        nameAr: name.trim(),
        image: image?.trim() || null,
        participants: participantIds,
        participantCount: participantIds.length,
        status: "dispatched",
      })
      .then(() => {});

    return NextResponse.json({
      ok: true,
      bot: true,
      participants: participantIds,
      count: participantIds.length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}