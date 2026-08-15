import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, nameAr, image, roomId, points } = body || {};

    if (!roomId || !name) {
      return NextResponse.json(
        { ok: false, error: "اسم السيناريو وآيدي الروم الصوتية مطلوبان" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const pts = Math.max(0, Number(points) || 0);

    const { data: patrol, error: pErr } = await supabase
      .from("patrols")
      .insert({
        name,
        nameAr: nameAr || "",
        image: image || null,
        roomId,
        points: pts,
      })
      .select()
      .single();

    if (pErr) {
      return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
    }

    // Dispatch to the Discord bot
    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";
    let botResult: any = { ok: false, error: "bot unreachable", memberIds: [], count: 0 };

    try {
      const r = await fetch(`${botUrl}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({ roomId, points: pts, name, nameAr, image: image || null }),
      });
      botResult = await r.json();
    } catch (e: any) {
      botResult = { ok: false, error: e?.message || "bot unreachable", memberIds: [], count: 0 };
    }

    const memberIds: string[] = botResult.memberIds || [];

    // Award points to detected officers
    let awarded = 0;
    if (botResult.ok && memberIds.length && pts > 0) {
      const { data: officers, error: oErr } = await supabase
        .from("officers")
        .select("id, fieldPoints")
        .in("discordId", memberIds);
      if (!oErr && officers) {
        for (const off of officers) {
          const nv = (off.fieldPoints || 0) + pts;
          await supabase.from("officers").update({ fieldPoints: nv }).eq("id", off.id);
          awarded++;
        }
      }
    }

    await supabase
      .from("patrols")
      .update({ participants: memberIds, participantCount: memberIds.length })
      .eq("id", patrol.id);

    return NextResponse.json({
      ok: true,
      patrolId: patrol.id,
      bot: botResult.ok,
      botError: botResult.error,
      participants: memberIds,
      count: memberIds.length,
      awarded,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}
