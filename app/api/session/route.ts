import { NextResponse } from "next/server";
import { requireActor } from "@/lib/auth";

// Lightweight session probe: returns the VERIFIED cookie identity (or 401).
// The client uses this to detect a stale/expired httpOnly session cookie so it
// can gracefully log out and prompt for a fresh login instead of showing
// confusing "unauthenticated" errors on every admin action.
export async function GET(req: Request) {
  const gate = await requireActor(req);
  if (gate instanceof NextResponse) return gate;
  return NextResponse.json({ ok: true, actor: gate.actor });
}