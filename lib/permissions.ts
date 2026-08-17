import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { PermissionKey } from "@/lib/types";

// The single Master Super Admin — absolute, non-revokable ownership.
export const MASTER_ADMIN_ID = "897450827353063505";

export const PERMS: Record<PermissionKey, PermissionKey> = {
  MASTER_ADMIN: "MASTER_ADMIN",
  NEWS_ADMIN: "NEWS_ADMIN",
  SITE_ADMIN: "SITE_ADMIN",
  RECRUITMENT_ADMIN: "RECRUITMENT_ADMIN",
  DISCHARGE_ADMIN: "DISCHARGE_ADMIN",
  INQUIRIES_ADMIN: "INQUIRIES_ADMIN",
  PERMISSIONS_ADMIN: "PERMISSIONS_ADMIN",
  EXAMS_ADMIN: "EXAMS_ADMIN",
};

export const ALL_PERMS = Object.values(PERMS);

export const PERMISSION_DEFS: {
  key: PermissionKey;
  label: string;
  labelEn: string;
  desc: string;
}[] = [
  { key: PERMS.MASTER_ADMIN, label: "التحكم المطلق (سوبر أدمن)", labelEn: "Master Super Admin", desc: "صلاحية شاملة على كل الأنظمة — مقصورة على المالك فقط" },
  { key: PERMS.NEWS_ADMIN, label: "إدارة الأخبار", labelEn: "News Admin", desc: "إنشاء وتعديل وحذف المقالات الإخبارية" },
  { key: PERMS.SITE_ADMIN, label: "إدارة الموقع", labelEn: "Site Admin", desc: "إدارة القوانين واللوحات والإعدادات العامة" },
  { key: PERMS.RECRUITMENT_ADMIN, label: "مسؤول التوظيف", labelEn: "Recruitment Admin", desc: "الوصول إلى بوابة التوظيف والتسجيل" },
  { key: PERMS.DISCHARGE_ADMIN, label: "مسؤول الفصل", labelEn: "Discharge Admin", desc: "معالجة الفصل وإنهاء الخدمة" },
  { key: PERMS.INQUIRIES_ADMIN, label: "مسؤول الاستعلامات", labelEn: "Inquiries Admin", desc: "الوصول لسجلات الأفراد والاستعلام" },
  { key: PERMS.PERMISSIONS_ADMIN, label: "مسؤول الصلاحيات", labelEn: "Permissions Admin", desc: "إدارة تفويض الصلاحيات للمستخدمين" },
  { key: PERMS.EXAMS_ADMIN, label: "مسؤول الاختبارات", labelEn: "Exams Admin", desc: "إنشاء وإدارة الاختبارات العسكرية" },
];

export const permissionLabel = (p: string) =>
  PERMISSION_DEFS.find((d) => d.key === p)?.label || p;

// Resolve a Discord user's effective permissions.
// MASTER_ADMIN_ID is hardcoded and always receives everything.
export async function resolvePermissions(discordId: string): Promise<string[]> {
  if (!discordId) return [];
  if (discordId === MASTER_ADMIN_ID) return [...ALL_PERMS];
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("permissions")
      .select("permissions")
      .eq("discordId", discordId)
      .maybeSingle();
    return Array.isArray(data?.permissions) ? (data.permissions as string[]) : [];
  } catch {
    return [];
  }
}

export function hasPermission(permissions: string[], perm: PermissionKey) {
  return permissions.includes(perm) || permissions.includes(PERMS.MASTER_ADMIN);
}

// Gate a server route: only MASTER_ADMIN_ID or a delegate holding `perm`.
export async function requirePermission(
  actor: string,
  perm: PermissionKey
): Promise<{ ok: true; permissions: string[] } | NextResponse> {
  if (!actor) {
    return NextResponse.json({ ok: false, error: "missing actor" }, { status: 401 });
  }
  const permissions = await resolvePermissions(actor);
  if (!hasPermission(permissions, perm)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  return { ok: true, permissions };
}