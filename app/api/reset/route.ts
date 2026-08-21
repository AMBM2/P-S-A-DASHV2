import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auditLog } from "@/lib/audit";

const TABLES = ["news", "officers", "leaders", "codes"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const actor = body?.actor;

    const admin = getSupabaseAdmin();
    for (const t of TABLES) {
      const { error } = await admin.from(t).delete().neq("id", "__never__");
      if (error) {
        return NextResponse.json({ error: `failed on ${t}: ${error.message}` }, { status: 500 });
      }
    }

    await auditLog({
      action: "reset",
      actionAr: "إعادة تعيين البيانات",
      executor: actor?.discordId || "system",
      executorName: actor?.nameAr || actor?.name || "النظام",
      target: "all",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "reset failed" }, { status: 500 });
  }
}
