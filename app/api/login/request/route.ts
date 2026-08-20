import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";

export async function POST(req: Request) {
  if (checkOrigin(req)) {
    return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
  }
  if (!rateLimit(req, { limit: 10, windowMs: 60_000 })) return tooMany();

  let userId = "";
  try {
    const body = await req.json();
    userId = cleanString(body?.userId, 40);
  } catch {}
  if (!/^\d{15,20}$/.test(userId)) {
    return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
  }

  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");

  try {
    const r = await fetch(`${botUrl}/login/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ userId }),
      cache: "no-store",
    });
    let data: any;
    try {
      data = await r.json();
    } catch {
      data = { ok: false, error: "استجابة غير متوقعة من البوت — تأكد أنه متصل" };
    }
    if (data?.ok) {
      await auditLog({
        action: "login.request",
        executor: "",
        target: userId,
      });
    }
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "البوت غير متصل" },
      { status: 200 }
    );
  }
}