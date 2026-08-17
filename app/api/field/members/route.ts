import { NextResponse } from "next/server";
import { requireGrants } from "@/lib/admin-gate";

// Public Security member list (connected / offline + ranks) for the field
// dispatch UI. Gated to field command + executive + master.
export async function GET(req: Request) {
  try {
    const actor = new URL(req.url).searchParams.get("actor") || "";
    const gate = await requireGrants(actor, ["field", "executive", "master"]);
    if (gate instanceof NextResponse) return gate;

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";
    try {
      const r = await fetch(`${botUrl}/field/members`, {
        headers: { "x-bot-secret": secret },
        cache: "no-store",
      });
      const data = await r.json();
      return NextResponse.json(data, { status: r.status });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "bot unreachable", members: [] },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}