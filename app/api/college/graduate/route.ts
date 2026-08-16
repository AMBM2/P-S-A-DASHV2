import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

// Graduate a Military College cadet: promote to a full officer record (realtime
// onboarding gives badge/nickname/DM; roles-sync assigns the rank role).
export async function POST(req: Request) {
  try {
    const { cadetId, rankId } = await req.json();
    if (!cadetId) {
      return NextResponse.json({ ok: false, error: "cadetId مطلوب" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: cadet } = await supabase
      .from("cadets")
      .select("*")
      .eq("id", cadetId)
      .maybeSingle();
    if (!cadet) return NextResponse.json({ ok: false, error: "الطالب غير موجود" }, { status: 404 });

    const finalRank = rankId || cadet.rankId || "r-tr1";

    await supabase
      .from("cadets")
      .update({ status: "graduated", rankId: finalRank })
      .eq("id", cadetId)
      .then(() => {});

    const { data: created, error } = await supabase
      .from("officers")
      .insert({
        badge: "",
        name: cadet.name || "",
        nameAr: cadet.nameAr || cadet.name || "",
        callsign: "",
        discordId: cadet.discordId || "",
        rankId: finalRank,
        departmentId: cadet.unit || "d-hq",
        status: "on-duty",
        specialization: [],
        medals: [],
        joinedAt: new Date().toISOString(),
        activityHours: 0,
        performance: 0,
        threats: 0,
        medicalClear: false,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Assign the rank role in Discord (keep any other rank roles the cadet
    // already holds; realtime onboarding handles badge/DM).
    if (cadet.discordId) {
      const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
      try {
        await fetch(`${botUrl}/roles-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
          },
          body: JSON.stringify({ discordId: cadet.discordId, strip: false }),
          cache: "no-store",
        });
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ ok: true, officerId: created?.id, rankId: finalRank });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}