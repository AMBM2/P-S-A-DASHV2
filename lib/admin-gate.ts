import { NextResponse } from "next/server";

// Resolve a Discord user's category grants via the bot's RBAC service.
// Server-side only; used to gate every admin write route.
export async function resolveGrants(actor: string): Promise<string[]> {
  if (!actor) return [];
  try {
    const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
    const r = await fetch(`${botUrl}/auth/level`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
      },
      body: JSON.stringify({ discordId: actor }),
      cache: "no-store",
    });
    const d = await r.json();
    return Array.isArray(d.grants) ? d.grants : [];
  } catch {
    return [];
  }
}

// Require one of the given category grants (master passes everything).
// Returns NextResponse (deny) or { ok, grants }.
export async function requireGrants(
  actor: string,
  needed: string[]
): Promise<{ ok: true; grants: string[] } | NextResponse> {
  if (!actor) {
    return NextResponse.json({ ok: false, error: "missing actor" }, { status: 401 });
  }
  const grants = await resolveGrants(actor);
  const allowed = grants.includes("master") || needed.some((n) => grants.includes(n));
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return { ok: true, grants };
}