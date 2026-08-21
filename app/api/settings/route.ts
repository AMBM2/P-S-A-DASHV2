import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { value, actor } = body;

    if (!value) {
      return NextResponse.json({ error: "value required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from("settings")
      .upsert({ key: "settings", value }, { onConflict: "key" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "update_settings",
      actionAr: "تحديث الإعدادات",
      executor: actor?.discordId || "system",
      executorName: actor?.nameAr || actor?.name || "النظام",
      target: "settings",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "settings failed" }, { status: 500 });
  }
}
