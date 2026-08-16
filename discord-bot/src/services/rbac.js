import { supabase } from "../supabase.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";

const LEVEL_ORDER = { none: 0, recruitment: 1, admin: 2, master: 3 };

// Categorized admin permissions. A user can hold several grants at once.
//   master     — full control (settings, resets, discharge approvals, permissions)
//   executive  — Executive Command / القيادة العليا
//   field      — Field Command / قيادة الميدان (live rooms, patrol dispatch, points)
//   hr         — HR & Recruitment / التوظيف والرقابة (applicants, codes, leaves, strikes)
//   personnel  — Personnel / الأفراد والضباط (read-only registries)
export const CATEGORIES = ["executive", "field", "hr", "personnel"];

export const masterIds = () =>
  config.masterAdminIds.length
    ? config.masterAdminIds
    : config.masterAdminId
      ? [config.masterAdminId]
      : [];

// Resolve the access level + category grants for a Discord user ID:
//  1. Explicit grant in the `admins` table (master > category)
//  2. Discord roles mapped to categories (executive / field / hr / personnel)
//  3. Configured MASTER_ADMIN_IDS fallback -> master
export async function resolveAccessLevel(client, discordId) {
  if (!discordId) return { level: "none", role: null, admin: null, grants: [] };

  let admin = null;
  try {
    const { data } = await supabase
      .from("admins")
      .select("*")
      .eq("userId", discordId)
      .maybeSingle();
    admin = data || null;
  } catch (e) {
    console.warn("[rbac] admins lookup failed:", e.message);
  }

  const grants = new Set();
  if (admin && admin.active) {
    if (admin.role === "master") grants.add("master");
    else if (CATEGORIES.includes(admin.role)) grants.add(admin.role);
  }

  const guild = getGuild(client);
  if (guild) {
    try {
      const member = await guild.members.fetch(discordId);
      const has = (id) => id && member.roles.cache.has(id);
      if (has(config.hrRoleId) || has(config.recruitmentRoleId)) grants.add("hr");
      if (has(config.fieldRoleId)) grants.add("field");
      if (has(config.personnelRoleId)) grants.add("personnel");
      if (has(config.executiveRoleId) || has(config.commandRoleId)) grants.add("executive");
    } catch {
      // member not in server / roles unreadable
    }
  }

  if (masterIds().includes(discordId)) grants.add("master");

  let level = "none";
  if (grants.has("master")) level = "master";
  else if (grants.has("executive")) level = "admin";
  else if (grants.has("field") || grants.has("hr") || grants.has("personnel")) level = "recruitment";

  return { level, role: level, admin, grants: [...grants] };
}

// Ensure the configured master admins have admins rows (idempotent bootstrap).
export async function bootstrapMaster(discordId) {
  if (!discordId) return;
  const masters = masterIds();
  if (!masters.includes(discordId)) return;
  for (const id of masters) {
    try {
      await supabase.from("admins").upsert(
        { userId: id, role: "master", note: "Master Super Admin" },
        { onConflict: "userId" }
      );
    } catch (e) {
      console.warn("[rbac] bootstrap master failed:", e.message);
    }
  }
}

export const canViewRecruitment = (level) => (LEVEL_ORDER[level] || 0) >= LEVEL_ORDER.recruitment;
export const canViewAll = (level) => (LEVEL_ORDER[level] || 0) >= LEVEL_ORDER.admin;
export const canManageAdmins = (level) => (LEVEL_ORDER[level] || 0) >= LEVEL_ORDER.master;
export const hasGrant = (grants, cat) =>
  Array.isArray(grants) && (grants.includes("master") || grants.includes(cat));