import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { requireActor } from "@/lib/auth";
import { MASTER_ADMIN_ID } from "@/lib/permissions";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";

// Master-only: wipe the site collections (previously a client-side direct
// delete that ran with the public anon key — anyone could erase the DB).
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 10, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const claimed = cleanString(body?.actor || "", 40);

    // SECURITY: the actor is the server-verified cookie identity + must be master.
    const gateActor = await requireActor(req, claimed || undefined);
    if (gateActor instanceof NextResponse) return gateActor;
    const actor = gateActor.actor;
    if (actor !== MASTER_ADMIN_ID) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const gate = await requireGrants(actor, ["master"]);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const ZERO_UUID = "00000000-0000-0000-0000-000000000000";
    await supabase.from("news").delete().neq("id", ZERO_UUID);
    await supabase.from("officers").delete().neq("id", ZERO_UUID);
    await supabase.from("leaders").delete().neq("id", ZERO_UUID);
    await supabase.from("codes").delete().neq("id", ZERO_UUID);
    await supabase.from("audit").delete().neq("id", ZERO_UUID);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}