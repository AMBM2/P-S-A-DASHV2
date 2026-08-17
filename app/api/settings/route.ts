import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { auditLog } from "@/lib/audit";

// Server-side site settings update (executive / master only).
export async function POST(req: Request) {
  try {
    const { value, actor } = await req.json();
    if (!value || typeof value !== "object") {
      return NextResponse.json({ ok: false, error: "معاملات غير صالحة" }, { status: 400 });
    }

    const gate = await requireGrants(actor || "", ["executive"]);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "settings", value });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "settings.update",
      actionAr: "تحديث إعدادات الموقع",
      executor: actor || "",
      metadata: { keys: Object.keys(value) },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}