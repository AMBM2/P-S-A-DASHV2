import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

// Public recruitment survey submit. Creates a pending application + a Military
// College cadet record. The bot's realtime listener posts the college embed.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const nameAr = String(body?.nameAr || "").trim();
    const discordId = String(body?.discordId || "").trim();
    const unit = String(body?.unit || "").trim();
    const ranks: string[] = Array.isArray(body?.ranks)
      ? body.ranks.filter((r: unknown) => typeof r === "string")
      : [];

    if (!name && !nameAr) {
      return NextResponse.json({ ok: false, error: "الاسم مطلوب" }, { status: 400 });
    }
    if (!/^\d{15,20}$/.test(discordId)) {
      return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
    }
    if (!unit) {
      return NextResponse.json({ ok: false, error: "الوحدة مطلوبة" }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: app, error } = await supabase
      .from("applications")
      .insert({
        name,
        nameAr,
        discordId,
        unit,
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
        rankId: ranks[0] || "r-tr1",
        unit,
        status: "pending",
        examScore: 0,
      })
      .then(() => {});

    return NextResponse.json({ ok: true, id: app?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}