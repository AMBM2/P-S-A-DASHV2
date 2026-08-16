import { supabase } from "../supabase.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";

const LEVEL_ORDER = { none: 0, recruitment: 1, admin: 2, master: 3 };

export const masterIds = () =>
  config.masterAdminIds.length
    ? config.masterAdminIds
    : config.masterAdminId
      ? [config.masterAdminId]
      : [];

// Resolve the access level for a Discord user ID:
//  1. Explicit grant in the `admins` table (master > admin > recruitment)
//  2. Recruitment Officer Discord role -> recruitment
//  3. Configured MASTER_ADMIN_ID fallback -> master
export async function resolveAccessLevel(client, discordId) {
  if (!discordId) return { level: "none", role: null, admin: null };

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

  if (admin && admin.active) {
    return { level: admin.role, role: admin.role, admin };
  }

  if (masterIds().includes(discordId)) {
    return { level: "master", role: "master", admin: null };
  }

  const guild = getGuild(client);
  if (guild && config.recruitmentRoleId) {
    try {
      const member = await guild.members.fetch(discordId);
      if (member.roles.cache.has(config.recruitmentRoleId)) {
        return { level: "recruitment", role: "recruitment", admin: null };
      }
    } catch {
      // member not in server / roles unreadable
    }
  }

  return { level: "none", role: null, admin: null };
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