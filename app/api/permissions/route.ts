import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requirePermission, PERMS, ALL_PERMS } from "@/lib/permissions";
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
export async function POST(req: Request) {
  try {
    const { discordId, permissions, note, actor } = await req.json();
    const id = String(discordId || "").trim();
    if (!/^\d{15,20}$/.test(id)) {
      return NextResponse.json({ ok: false, error: "معرّف ديسكورد غير صالح" }, { status: 400 });
    }
    const permList = Array.isArray(permissions)
      ? (permissions.filter((p: unknown) => typeof p === "string" && (ALL_PERMS as string[]).includes(p)) as PermissionKey[])
      : [];

    const gate = await requirePermission(actor || "", PERMS.PERMISSIONS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    // MASTER_ADMIN can never be delegated — it is hardcoded to the owner only.
    const clean = permList.filter((p: string) => p !== PERMS.MASTER_ADMIN);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("permissions")
      .upsert(
        {
          discordId: id,
          permissions: clean,
          note: String(note || "").trim(),
          createdBy: actor || "",
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
      executor: actor || "",
      target: id,
      metadata: { permissions: clean, note: String(note || "").trim() },
    });
    return NextResponse.json({ ok: true, permissions: clean });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}

// Revoke a delegate entirely.
export async function DELETE(req: Request) {
  try {
    const { discordId, actor } = await req.json();
    const id = String(discordId || "").trim();

    const gate = await requirePermission(actor || "", PERMS.PERMISSIONS_ADMIN);
    if (gate instanceof NextResponse) return gate;

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("permissions").delete().eq("discordId", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    await auditLog({
      action: "permissions.revoke",
      actionAr: "سحب صلاحيات مستخدم",
      executor: actor || "",
      target: id,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}