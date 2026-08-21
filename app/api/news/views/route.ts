import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from("news").select("views").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const current = data?.views || 0;
    const { error: updErr } = await admin.from("news").update({ views: current + 1 }).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, views: current + 1 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "views failed" }, { status: 500 });
  }
}
