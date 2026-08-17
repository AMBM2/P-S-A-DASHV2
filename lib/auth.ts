import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// Server-verified identity for admin writes. After a successful login/verify
// the server sets an httpOnly cookie (psa_sess) containing an HMAC-signed,
// expiring token bound to the verified Discord ID. Every sensitive route reads
// the actor from THIS cookie — never from the client-supplied body — so an
// attacker can no longer impersonate the Master Super Admin by pasting
// "897450827353063505" as the actor.

export const SESSION_COOKIE = "psa_sess";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  const s = process.env.AUTH_SESSION_SECRET || process.env.PATROL_BOT_SECRET || "";
  if (!s) {
    throw new Error("Missing AUTH_SESSION_SECRET (or PATROL_BOT_SECRET) — cannot sign sessions");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueSessionToken(discordId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ id: discordId, exp: Date.now() + SESSION_TTL_MS })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof data?.id !== "string" ||
      typeof data?.exp !== "number" ||
      data.exp < Date.now()
    ) {
      return null;
    }
    return data.id;
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: NextResponse, discordId: string): NextResponse {
  const token = issueSessionToken(discordId);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

// Read + verify the actor from the request's psa_sess cookie.
export function actorFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const part = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`));
  if (!part) return null;
  return verifySessionToken(decodeURIComponent(part.slice(SESSION_COOKIE.length + 1)));
}

// Gate: returns { ok: true, actor } with the VERIFIED cookie identity, or a
// NextResponse denial. `bodyActor` is the client-claimed identity — it must
// match the cookie identity (or be absent); a mismatch is treated as a
// spoofing attempt and rejected with 403.
export async function requireActor(
  req: Request,
  bodyActor?: string
): Promise<{ ok: true; actor: string } | NextResponse> {
  const actor = actorFromRequest(req);
  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "unauthenticated — سجّل الدخول أولاً" },
      { status: 401 }
    );
  }
  if (bodyActor && bodyActor !== actor) {
    return NextResponse.json({ ok: false, error: "identity mismatch" }, { status: 403 });
  }
  return { ok: true, actor };
}
