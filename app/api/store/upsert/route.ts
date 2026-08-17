import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import type { PermissionKey } from "@/lib/types";

// Server-side upsert for the store collections (news / officers / leaders /
// codes). Replaces the old direct client write with the anon key.
const ALLOWED: Record<string, string[]> = {
  news: ["executive"],
  officers: ["executive"],
  leaders: ["executive"],
  codes: ["hr", "executive"],
};
const ALLOWED_PERM: Record<string, string> = {
  news: PERMS.NEWS_ADMIN,
  officers: PERMS.SITE_ADMIN,
  leaders: PERMS.SITE_ADMIN,
  codes: PERMS.SITE_ADMIN,
};

export async function POST(req: Request) {
  try {
    const { table, item, actor } = await req.json();
    const needed = ALLOWED[table as string];
    if (!needed || !item || !item.id) {
      return NextResponse.json({ ok: false, error: "معاملات غير صالحة" }, { status: 400 });
    }

    const legacy = await requireGrants(actor || "", needed);
    const delegated = legacy instanceof NextResponse
      ? await requirePermission(actor || "", (ALLOWED_PERM[table as string] || PERMS.SITE_ADMIN) as PermissionKey)
      : legacy;
    if (delegated instanceof NextResponse) return delegated;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(table).upsert(item);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: `store.upsert`,
      actionAr: table === "news" ? "نشر/تعديل خبر" : "تحديث سجل",
      executor: actor || "",
      target: item.id,
      targetName: item.titleAr || item.nameAr || item.title || item.name || "",
      metadata: { table, id: item.id },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}