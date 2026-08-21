import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auditLog } from "@/lib/audit";

const ALLOWED = ["news", "officers", "leaders", "codes"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { table, id, actor } = body;

    if (!ALLOWED.includes(table)) {
      return NextResponse.json({ error: "invalid table" }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.from(table).delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "remove",
      actionAr: "حذف بيانات",
      executor: actor?.discordId || "system",
      executorName: actor?.nameAr || actor?.name || "النظام",
      target: table,
      targetName: id,
      metadata: { table },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "remove failed" }, { status: 500 });
  }
}
