import { NextResponse } from "next/server";

// Field Patrol Live Dispatch: the portal only collects the patrol location;
// the bot builds the rich ANSI/fix payload and posts it to PATROL_CHANNEL_ID.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const location = String(body?.location || "").trim();

    if (!location) {
      return NextResponse.json({ ok: false, error: "موقع السيناريو مطلوب" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";

    try {
      const r = await fetch(`${botUrl}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({ location }),
        cache: "no-store",
      });
      let botResult: any = { ok: false, error: "bad response" };
      try {
        botResult = await r.json();
      } catch {
        botResult = { ok: false, error: "استجابة غير متوقعة من البوت" };
      }
      return NextResponse.json(botResult, { status: r.status });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "bot unreachable" },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}