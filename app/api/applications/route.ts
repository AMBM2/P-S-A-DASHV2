import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";

// Server-side applications list read (hr / executive / master only).
export async function GET(req: Request) {
  try {
    const actor = new URL(req.url).searchParams.get("actor") || "";
    const gate = await requireGrants(actor, ["hr", "executive", "master"]);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, applications: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}