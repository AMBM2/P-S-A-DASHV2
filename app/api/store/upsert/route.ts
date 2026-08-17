import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanObject, cleanString } from "@/lib/sanitize";
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
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 60, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const table = cleanString(body?.table, 32);
    const actor = cleanString(body?.actor, 40);
    const item = cleanObject(body?.item, { maxLen: 10_000, maxKeys: 100 });
    const needed = ALLOWED[table as string];
    if (!needed || !item || !cleanString(item.id, 128)) {
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