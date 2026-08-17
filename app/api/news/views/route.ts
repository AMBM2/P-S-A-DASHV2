import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ ok: false, error: "invalid id" }, { status: 400 });
    }
    const admin = getSupabaseAdmin();
    const { data } = await admin.from("news").select("views").eq("id", id).maybeSingle();
    const next = (Number(data?.views) || 0) + 1;
    const { error } = await admin.from("news").update({ views: next }).eq("id", id);
    return NextResponse.json({ ok: !error, error: error?.message });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}