import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { attachSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  if (checkOrigin(req)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }
  // Brute-force guard: 10 attempts/min per IP.
  if (!rateLimit(req, { limit: 10, windowMs: 60_000 })) return tooMany();

  let userId = "";
  let code = "";
  try {
    const body = await req.json();
    userId = cleanString(body?.userId, 40);
    code = cleanString(body?.code, 16);
  } catch {}
  if (!/^\d{15,20}$/.test(userId)) {
    return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: "رمز غير صالح" }, { status: 400 });
  }

  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");

  try {
    const r = await fetch(`${botUrl}/login/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ userId, code }),
      cache: "no-store",
    });
    let data: any;
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "استجابة غير متوقعة من البوت — تأكد أنه متصل" };
    }
    // On success, mint a server-signed httpOnly session cookie bound to the
    // verified Discord ID. Sensitive routes now trust THIS cookie as the actor
    // identity instead of the client-supplied body field.
    const res = NextResponse.json(data, { status: r.status });
    if (data?.ok && userId) {
      attachSessionCookie(res, userId);
    }
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "البوت غير متصل" },
      { status: 200 }
    );
  }
}
