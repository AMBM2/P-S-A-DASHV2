import { NextResponse } from "next/server";

export async function GET() {
  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
  try {
    const r = await fetch(`${botUrl}/roles`, {
      headers: { "x-bot-secret": process.env.PATROL_BOT_SECRET || "" },
      cache: "no-store",
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "bot unreachable" },
      { status: 200 }
    );
  }
}