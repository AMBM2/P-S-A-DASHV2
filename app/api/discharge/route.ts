import { NextResponse } from "next/server";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";

// Discharge an officer: the bot strips rank/recruit roles in Discord, marks the
// record discharged, optionally blacklists, and logs the discharge (defense in
// depth also exists via realtime).
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 40, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const officerId = cleanString(body?.officerId, 40);
    const type = cleanString(body?.type, 24);
    const reason = cleanString(body?.reason, 1000);
    const evidence = cleanString(body?.evidence, 1000);
    const blacklist = body?.blacklist === true;
    const claimed = cleanString(body?.issuer, 40);
    const roleIds = Array.isArray(body?.roleIds)
      ? body.roleIds.filter((r: unknown) => typeof r === "string").slice(0, 20)
      : [];

    // SECURITY: identity comes from the server-verified session cookie, NOT the
    // client-supplied body. A body issuer that mismatches the cookie is rejected.
    const gate = await requireActor(req, claimed || undefined);
    if (gate instanceof NextResponse) return gate;
    const issuer = gate.actor;

    // Discharge is a destructive, irreversible action: Executive/Command
    // category grant OR an explicit DISCHARGE_ADMIN permission is required.
    const grantsGate = await requireGrants(issuer, ["executive", "master"]);
    const permGate = await requirePermission(issuer, PERMS.DISCHARGE_ADMIN);
    if (grantsGate instanceof NextResponse && permGate instanceof NextResponse) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    if (!officerId) {
      return NextResponse.json({ ok: false, error: "officerId مطلوب" }, { status: 400 });
    }
    if (!type || !["honorary", "dishonorable", "inactivity", "administrative"].includes(type)) {
      return NextResponse.json({ ok: false, error: "نوع الفصل مطلوب" }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ ok: false, error: "تفاصيل الفصل إلزامية" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const r = await fetch(`${botUrl}/discharge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({
        officerId,
        type,
        reason: reason || "",
        evidence: evidence || "",
        blacklist,
        issuer: issuer || null,
        roleIds: roleIds.length ? roleIds : undefined,
      }),
      cache: "no-store",
    });

    let data: any = { ok: false, error: "bad response" };
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "استجابة غير متوقعة من البوت" };
    }
    if (data.ok) {
      await auditLog({
        action: "officer.discharged",
        actionAr: "فصل ضابط",
        executor: issuer || "",
        target: officerId,
        metadata: { type, reason, blacklist },
      });
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "bot unreachable" }, { status: 200 });
  }
}