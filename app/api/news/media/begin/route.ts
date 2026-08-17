import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import type { PermissionKey } from "@/lib/types";

// Issue a one-time upload token for news media (images/videos). The browser
// then uploads the file DIRECTLY to the bot (see /api/news/media/upload client
// helper), so 100MB videos never pass through the Vercel function body limit.
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 30, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const actor = cleanString(body?.actor, 40);
    const filename = cleanString(body?.filename, 120);
    const contentType = cleanString(body?.contentType, 128);

    const legacy = await requireGrants(actor || "", ["executive"]);
    const delegated =
      legacy instanceof NextResponse
        ? await requirePermission(actor || "", PERMS.NEWS_ADMIN as PermissionKey)
        : legacy;
    if (delegated instanceof NextResponse) return delegated;

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";
    if (!botUrl || !secret) {
      return NextResponse.json({ ok: false, error: "البوت غير مهيأ" }, { status: 500 });
    }

    const r = await fetch(`${botUrl}/media/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bot-secret": secret },
      body: JSON.stringify({ filename, contentType }),
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    if (!d.ok) {
      return NextResponse.json({ ok: false, error: d.error || "تعذر بدء الرفع" }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      token: d.token,
      maxBytes: d.maxBytes || 100 * 1024 * 1024,
      uploadUrl: `${botUrl}/media/upload?token=${encodeURIComponent(d.token)}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}