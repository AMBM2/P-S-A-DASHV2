import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";

// Public recruitment survey submit. Creates a pending application + a Military
// College cadet record assigned to the main military department (d-hq).
// `ranks` = Discord role IDs selected on the form; the bot grants them to the
// member on approval. Blacklisted users are rejected automatically.
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    // Anti-spam: 5 submissions per IP per minute.
    if (!rateLimit(req, { limit: 5, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const name = cleanString(body?.name, 120);
    const nameAr = cleanString(body?.nameAr, 120);
    const discordId = cleanString(body?.discordId, 40);
    const primaryRankId = cleanString(body?.primaryRankId, 40);
    const ranks: string[] = Array.isArray(body?.ranks)
      ? body.ranks.filter((r: unknown) => typeof r === "string").slice(0, 10)
      : [];

    if (!name && !nameAr) {
      return NextResponse.json({ ok: false, error: "الاسم مطلوب" }, { status: 400 });
    }
    if (!/^\d{15,20}$/.test(discordId)) {
      return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

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

    // Announce the new application in the recruitment room (توظيف مواطن).
    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";
    if (botUrl && secret) {
      const who = (name || nameAr || "").trim();
      const lines = [
        "📋 **توظيف مواطن — تقديم جديد**",
        `المتقدّم: **${who}**`,
        `ديسكورد: <@${discordId}>`,
        `الحالة: قيد المراجعة (بانتظار الاختبار العسكري)`,
      ];
      fetch(`${botUrl}/announce`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({ message: lines.join("\n") }),
        signal: AbortSignal.timeout(4000),
      }).catch((e) => console.warn(`[recruit] announce failed: ${e?.message}`));
    }

    return NextResponse.json({ ok: true, id: app?.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}