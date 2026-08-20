import { NextResponse } from "next/server";
import { requireGrants } from "@/lib/admin-gate";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  if (checkOrigin(req)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }
  if (!rateLimit(req, { limit: 10, windowMs: 60_000 })) return tooMany();

  const body = await req.json().catch(() => ({}));
  const claimed = typeof body?.actor === "string" ? body.actor : "";

  // SECURITY: the actor is the server-verified cookie identity.
  const gateActor = await requireActor(req, claimed || undefined);
  if (gateActor instanceof NextResponse) return gateActor;
  const gate = await requireGrants(gateActor.actor, ["executive", "master"]);
  if (gate instanceof NextResponse) return gate;

  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
  try {
    const r = await fetch(`${botUrl}/sync`, {
      method: "POST",
      headers: { "x-bot-secret": process.env.PATROL_BOT_SECRET || "" },
      cache: "no-store",
    });
    const data = await r.json();
    if (data?.ok) {
      await auditLog({
        action: "officer.sync",
        executor: gateActor.actor,
        metadata: {
          created: data?.created ?? 0,
          updated: data?.updated ?? 0,
          purged: data?.purged ?? 0,
          membersTotal: data?.membersTotal ?? null,
        },
      });
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "bot unreachable" },
      { status: 200 }
    );
  }
}