import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";

// Master-only: wipe the site collections (previously a client-side direct
// delete that ran with the public anon key — anyone could erase the DB).
export async function POST(req: Request) {
  try {
    const { actor } = await req.json();
    const gate = await requireGrants(actor || "", ["master"]);
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