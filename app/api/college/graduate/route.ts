import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";

// Graduate a Military College cadet: promote to a full officer record assigned
// to the main military department (realtime onboarding gives badge/nickname/DM;
// roles-sync assigns the rank role).
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 40, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const cadetId = cleanString(body?.cadetId, 64);
    const rankId = cleanString(body?.rankId, 40);
    const claimed = cleanString(body?.actor || "", 40);

    // SECURITY: the actor is the server-verified cookie identity.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;
    const grantsGate = await requireGrants(actor, ["hr", "executive", "master"]);
    const permGate = await requirePermission(actor, PERMS.RECRUITMENT_ADMIN);
    if (grantsGate instanceof NextResponse && permGate instanceof NextResponse) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    if (!cadetId) {
      return NextResponse.json({ ok: false, error: "cadetId مطلوب" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
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
        departmentId: "d-hq", // main military department
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