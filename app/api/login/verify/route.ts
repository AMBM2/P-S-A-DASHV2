import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let userId = "";
  let code = "";
  try {
    const body = await req.json();
    userId = String(body?.userId || "").trim();
    code = String(body?.code || "").trim();
  } catch {}

  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");

  try {
    const r = await fetch(`${botUrl}/login/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ userId, code }),
      cache: "no-store",
    });
    let data: any;
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "استجابة غير متوقعة من البوت — تأكد أنه متصل" };
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "البوت غير متصل" },
      { status: 200 }
    );
  }
}
