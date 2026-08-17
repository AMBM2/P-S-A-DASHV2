import { NextResponse } from "next/server";

const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");

// Role categories (الفرز التلقائي): list every Discord role with its explicit
// / detected category, and update role -> officer/enlisted mappings.
export async function GET(req: Request) {
  try {
    const actor = req.headers.get("x-bot-actor") || "";
    const r = await fetch(`${botUrl}/role-categories`, {
      headers: {
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
        "x-bot-actor": actor,
      },
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

export async function POST(req: Request) {
  try {
    const { roleId, category, actor } = await req.json();
    if (!roleId) {
      return NextResponse.json({ ok: false, error: "معاملات غير صالحة" }, { status: 400 });
    }
    const r = await fetch(`${botUrl}/role-categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
        "x-bot-actor": actor || "",
      },
      body: JSON.stringify({ roleId, category }),
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