import { NextResponse } from "next/server";

// Discharge an officer: the bot strips rank/recruit roles in Discord, marks the
// record discharged, optionally blacklists, and logs the discharge (defense in
// depth also exists via realtime).
export async function POST(req: Request) {
  try {
    const { officerId, type, reason, evidence, blacklist, issuer, roleIds } = await req.json();
    if (!officerId) {
      return NextResponse.json({ ok: false, error: "officerId مطلوب" }, { status: 400 });
    }
    if (!type || !["honorary", "dishonorable", "inactivity", "administrative"].includes(type)) {
      return NextResponse.json({ ok: false, error: "نوع الفصل مطلوب" }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ ok: false, error: "تفاصيل الفصل إلزامية" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const r = await fetch(`${botUrl}/discharge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({
        officerId,
        type,
        reason: reason || "",
        evidence: evidence || "",
        blacklist: blacklist === true,
        issuer: issuer || null,
        roleIds: Array.isArray(roleIds) ? roleIds : undefined,
      }),
      cache: "no-store",
    });

    let data: any = { ok: false, error: "bad response" };
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "استجابة غير متوقعة من البوت" };
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "bot unreachable" }, { status: 200 });
  }
}