import { NextResponse } from "next/server";
import { requireGrants } from "@/lib/admin-gate";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";

const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");

// Role categories (الفرز التلقائي): list every Discord role with its explicit
// / detected category, and update role -> officer/enlisted mappings.
export async function GET(req: Request) {
  try {
    const claimed = req.headers.get("x-bot-actor") || "";
    const gate = await requireActor(req, claimed || undefined);
    if (gate instanceof NextResponse) return gate;
    const actor = gate.actor;

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
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 30, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const roleId = cleanString(body?.roleId, 40);
    const category = cleanString(body?.category, 24);
    const claimed = cleanString(body?.actor || "", 40);

    // SECURITY: the actor is the server-verified cookie identity.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;
    const grantsGate = await requireGrants(actor, ["executive", "master"]);
    if (grantsGate instanceof NextResponse) return grantsGate;

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
    if (data?.ok) {
      await auditLog({
        action: "role_categories.upsert",
        executor: actor,
        target: roleId,
        metadata: { category: category || "إزالة التصنيف" },
      });
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "bot unreachable" }, { status: 200 });
  }
}