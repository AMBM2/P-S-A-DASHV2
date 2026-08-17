import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, PERMS, ALL_PERMS, MASTER_ADMIN_ID } from "@/lib/permissions";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";
import type { PermissionKey } from "@/lib/types";

// Manage permission delegates (مسؤول الصلاحيات).
export async function GET(req: Request) {
  try {
    const actor = new URL(req.url).searchParams.get("actor") || "";
    const gate = await requirePermission(actor, PERMS.PERMISSIONS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("createdAt", { ascending: true });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, delegates: [] }, { status: 200 });
    }
    return NextResponse.json({ ok: true, delegates: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error", delegates: [] }, { status: 200 });
  }
}

// Assign or update a delegate's sub-permissions (by pasted Discord ID).
// SECURITY: only the hardcoded MASTER_ADMIN_ID may modify permissions.
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 30, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const actor = cleanString(body?.actor, 40);
    if (actor !== MASTER_ADMIN_ID) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const discordId = cleanString(body?.discordId, 40);
    const note = cleanString(body?.note, 300);
    if (!/^\d{15,20}$/.test(discordId)) {
      return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
    }
    const permList = Array.isArray(body?.permissions)
      ? (body.permissions.filter((p: unknown) => typeof p === "string" && (ALL_PERMS as string[]).includes(p)) as PermissionKey[])
      : [];

    // MASTER_ADMIN can never be delegated — it is hardcoded to the owner only.
    const clean = permList.filter((p: string) => p !== PERMS.MASTER_ADMIN);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("permissions")
      .upsert(
        {
          discordId,
          permissions: clean,
          note,
          createdBy: actor,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "discordId" }
      );
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "permissions.upsert",
      actionAr: "تحديث صلاحيات مستخدم",
      executor: actor,
      target: discordId,
      metadata: { permissions: clean, note },
    });
    return NextResponse.json({ ok: true, permissions: clean });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}

// Revoke a delegate entirely.
export async function DELETE(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 30, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const actor = cleanString(body?.actor, 40);
    if (actor !== MASTER_ADMIN_ID) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const discordId = cleanString(body?.discordId, 40);
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("permissions").delete().eq("discordId", discordId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "permissions.revoke",
      actionAr: "سحب صلاحيات مستخدم",
      executor: actor,
      target: discordId,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}