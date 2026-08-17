import { NextResponse } from "next/server";
import { requireGrants } from "@/lib/admin-gate";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString, isSafeHttpUrl, isSafeDataImage } from "@/lib/sanitize";

// Field Patrol Live Dispatch: the portal collects the patrol location + the
// selected member IDs; the bot builds the rich ANSI/fix payload mentioning
// those members (with ranks) and posts it to PATROL_CHANNEL_ID.
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 20, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const claimed = cleanString(body?.actor || "", 40);

    // SECURITY: the actor is the server-verified cookie identity.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;

    const gate = await requireGrants(actor, ["field", "executive", "master"]);
    if (gate instanceof NextResponse) return gate;

    const location = cleanString(body?.location, 200);
    const memberIds: string[] = Array.isArray(body?.memberIds)
      ? body.memberIds.filter((m: unknown) => typeof m === "string" && /^\d{15,20}$/.test(String(m))).slice(0, 50)
      : [];
    const imageUrl = isSafeHttpUrl(body?.imageUrl) ? cleanString(body?.imageUrl, 2048) : "";
    const imageData = isSafeDataImage(body?.imageData) ? String(body?.imageData) : "";
    const imageName = cleanString(body?.imageName, 120);

    if (!location) {
      return NextResponse.json({ ok: false, error: "موقع السيناريو مطلوب" }, { status: 400 });
    }

    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const secret = process.env.PATROL_BOT_SECRET || "";

    try {
      const r = await fetch(`${botUrl}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({
          location,
          memberIds,
          ...(imageUrl ? { imageUrl } : {}),
          ...(imageData ? { imageData, imageName: imageName || "field-image.png" } : {}),
        }),
        cache: "no-store",
      });
      let botResult: any = { ok: false, error: "bad response" };
      try {
        botResult = await r.json();
      } catch {
        botResult = { ok: false, error: "استجابة غير متوقعة من البوت" };
      }
      return NextResponse.json(botResult, { status: r.status });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e?.message || "bot unreachable" },
        { status: 200 }
      );
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}