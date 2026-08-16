import { NextResponse } from "next/server";

// Master-only: grant or update an admin entry (delegation).
export async function POST(req: Request) {
  try {
    const { discordId, role, note, active, actor } = await req.json();
    if (!discordId || !["master", "admin", "recruitment"].includes(role)) {
      return NextResponse.json({ ok: false, error: "معاملات غير صالحة" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const r = await fetch(`${botUrl}/admins/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
        "x-bot-actor": actor || "",
      },
      body: JSON.stringify({ discordId, role, note: note || "", active: active !== false }),
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