import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth";
import { MASTER_ADMIN_ID } from "@/lib/permissions";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";

// Master-only: grant or update an admin entry (delegation).
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 30, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const discordId = cleanString(body?.discordId, 40);
    const role = cleanString(body?.role, 24);
    const note = cleanString(body?.note, 300);
    const active = body?.active !== false;
    const claimed = cleanString(body?.actor, 40);

    // SECURITY: the actor is the server-verified cookie identity + must be master.
    const gate = await requireActor(req, claimed || undefined);
    if (gate instanceof NextResponse) return gate;
    const actor = gate.actor;
    if (actor !== MASTER_ADMIN_ID) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

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
      body: JSON.stringify({ discordId, role, note: note || "", active }),
      cache: "no-store",
    });

    let data: any = { ok: false, error: "bad response" };
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "استجابة غير متوقعة من البوت" };
    }
    if (data?.ok) {
      await auditLog({
        action: "admins.upsert",
        executor: actor,
        target: discordId,
        metadata: { role, active, note: note || "" },
      });
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "bot unreachable" }, { status: 200 });
  }
}