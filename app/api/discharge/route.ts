import { NextResponse } from "next/server";

// Discharge an officer: the bot strips rank/recruit roles in Discord and marks
// the record discharged (defense in depth also exists via realtime).
export async function POST(req: Request) {
  try {
    const { officerId, reason, issuer } = await req.json();
    if (!officerId) {
      return NextResponse.json({ ok: false, error: "officerId مطلوب" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const r = await fetch(`${botUrl}/discharge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ officerId, reason: reason || "", issuer: issuer || null }),
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