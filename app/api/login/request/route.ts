import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let userId = "";
  try {
    const body = await req.json();
    userId = String(body?.userId || "").trim();
  } catch {}

  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");

  try {
    const r = await fetch(`${botUrl}/login/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ userId }),
      cache: "no-store",
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "البوت غير متصل" },
      { status: 200 }
    );
  }
}