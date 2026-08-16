import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

// Public recruitment survey submit. Creates a pending application + a Military
// College cadet record assigned to the main military department (d-hq).
// `ranks` = Discord role IDs selected on the form; the bot grants them to the
// member on approval. Blacklisted users are rejected automatically.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const nameAr = String(body?.nameAr || "").trim();
    const discordId = String(body?.discordId || "").trim();
    const primaryRankId = String(body?.primaryRankId || "").trim();
    const ranks: string[] = Array.isArray(body?.ranks)
      ? body.ranks.filter((r: unknown) => typeof r === "string")
      : [];

    if (!name && !nameAr) {
      return NextResponse.json({ ok: false, error: "الاسم مطلوب" }, { status: 400 });
    }
    if (!/^\d{15,20}$/.test(discordId)) {
      return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Reject applicants on the blacklist (القائمة السوداء).
    const { data: blocked } = await supabase
      .from("blacklist")
      .select("id")
      .eq("discordId", discordId)
      .maybeSingle();
    if (blocked) {
      return NextResponse.json(
        { ok: false, error: "لا يمكنك التقديم — حسابك مدرج في القائمة السوداء" },
        { status: 200 }
      );
    }

    const { data: app, error } = await supabase
      .from("applications")
      .insert({
        name,
        nameAr,
        discordId,
        ranks,
        status: "pending",
        examScore: 0,
        examAnswers: [],
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await supabase
      .from("cadets")
      .insert({
        applicationId: app?.id || null,
        discordId,
        name,
        nameAr,
        rankId: primaryRankId || "r-tr1",
        status: "pending",
        examScore: 0,
      })
      .then(() => {});

    return NextResponse.json({ ok: true, id: app?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}