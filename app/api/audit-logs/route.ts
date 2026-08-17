import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, PERMS } from "@/lib/permissions";

// Centralized System Audit Logs (لوق العمليات) — read-only dashboard feed.
export async function GET(req: Request) {
  try {
    const actor = new URL(req.url).searchParams.get("actor") || "";
    const limit = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 200, 500);
    const gate = await requirePermission(actor, PERMS.SITE_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, entries: [] }, { status: 200 });
    }
    return NextResponse.json({ ok: true, entries: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error", entries: [] }, { status: 200 });
  }
}