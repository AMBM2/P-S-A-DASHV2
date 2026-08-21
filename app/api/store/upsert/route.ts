import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auditLog } from "@/lib/audit";

const ALLOWED = ["news", "officers", "leaders", "codes"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, item, actor } = body;

    if (!ALLOWED.includes(table)) {
      return NextResponse.json({ error: "invalid table" }, { status: 400 });
    }
    if (!item || !item.id) {
      return NextResponse.json({ error: "item.id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.from(table).upsert(item, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "upsert",
      actionAr: "تعديل بيانات",
      executor: actor?.discordId || "system",
      executorName: actor?.nameAr || actor?.name || "النظام",
      target: table,
      targetName: item.titleAr || item.nameAr || item.name || item.id,
      metadata: { table },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "upsert failed" }, { status: 500 });
  }
}
