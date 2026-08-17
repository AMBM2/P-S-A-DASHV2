import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";

const ALLOWED: Record<string, string[]> = {
  news: ["executive"],
  officers: ["executive"],
  leaders: ["executive"],
  codes: ["hr", "executive"],
};

export async function POST(req: Request) {
  try {
    const { table, id, actor } = await req.json();
    const needed = ALLOWED[table as string];
    if (!needed || !id) {
      return NextResponse.json({ ok: false, error: "معاملات غير صالحة" }, { status: 400 });
    }

    const gate = await requireGrants(actor || "", needed);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}