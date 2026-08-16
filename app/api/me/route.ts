import { NextResponse } from "next/server";

// Resolve a Discord user's access level (master / admin / recruitment / none)
// via the bot's RBAC service (admins table + Discord recruitment role).
export async function POST(req: Request) {
  try {
    const { discordId } = await req.json();
    if (!discordId) {
      return NextResponse.json({ ok: false, error: "missing discordId", level: "none" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const r = await fetch(`${botUrl}/auth/level`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ discordId }),
      cache: "no-store",
    });
    let data: any = { ok: false, error: "bad response", level: "none" };
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "bad response", level: "none" };
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "bot unreachable", level: "none" },
      { status: 200 }
    );
  }
}