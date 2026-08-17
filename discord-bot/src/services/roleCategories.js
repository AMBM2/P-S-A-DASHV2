import { config } from "../config.js";
import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { findRankByRoleName } from "../ranks.js";

// Maps Discord role IDs to the two patrol groups:
//   "officer"  — قسم الضباط (command + officer division ranks)
//   "enlisted" — قسم الأفراد (troop division ranks)
//
// Priority: role_categories table (managed from the Web Dashboard settings
// tab) > OFFICER_ROLE_IDS / ENLISTED_ROLE_IDS env seed > auto-detected ranks.

// Auto-detect the category for a role by its matched military rank.
export function detectCategory(role) {
  const rank = findRankByRoleName(role.name);
  if (!rank) return null;
  if (rank.division === "command" || rank.division === "officer") return "officer";
  if (rank.division === "troop") return "enlisted";
  return null;
}

// Effective roleId -> category map used for live member sorting.
// Table rows win; unconfigured ranks fall back to auto-detection so the
// dispatch keeps working before any admin configuration exists.
export async function loadRoleCategories(client) {
  const guild = getGuild(client);

  const map = new Map();
  for (const id of config.officerRoleIds) map.set(id, "officer");
  for (const id of config.enlistedRoleIds) map.set(id, "enlisted");

  try {
    const { data } = await supabase.from("role_categories").select("roleId, category");
    for (const row of data || []) {
      map.set(row.roleId, row.category === "enlisted" ? "enlisted" : "officer");
    }
  } catch (e) {
    console.warn(`[role-categories] DB load failed (${e.message}) — using env/auto-detect`);
  }

  if (guild) {
    for (const role of guild.roles.cache.values()) {
      const detected = detectCategory(role);
      if (detected && !map.has(role.id)) map.set(role.id, detected);
    }
  }

  return map;
}

// Categorize the members currently connected to a voice channel.
export async function scanVoiceRoom(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  const roomId = config.voiceRoomId || config.voiceRoomIds[0] || "";
  if (!roomId) return { ok: false, error: "no-voice-room" };

  const room = guild.channels.cache.get(roomId);
  if (!room || !room.isVoiceBased()) {
    return { ok: false, error: "voice-channel-not-found" };
  }

  const categoryMap = await loadRoleCategories(client);

  let officers = [];
  let enlisted = [];
  for (const member of room.members.values()) {
    let cat = null;
    for (const roleId of member.roles.cache.keys()) {
      const c = categoryMap.get(roleId);
      if (c === "officer") {
        cat = "officer";
        break;
      }
      if (c === "enlisted" && !cat) cat = "enlisted";
    }
    if (cat === "officer") officers.push(member);
    else if (cat === "enlisted") enlisted.push(member);
  }

  // Preserve voice order (most recently joined = end of collection).
  return {
    ok: true,
    roomId: room.id,
    roomName: room.name,
    total: officers.length + enlisted.length,
    officers: officers.map((m) => ({
      id: m.id,
      name: m.displayName || m.user.username,
      mention: `<@${m.id}>`,
    })),
    enlisted: enlisted.map((m) => ({
      id: m.id,
      name: m.displayName || m.user.username,
      mention: `<@${m.id}>`,
    })),
  };
}

// Full role listing for the settings UI: every guild role with its rank info,
// explicit category (table) and detected category (auto).
export async function getRoleCategories(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  let rows = [];
  try {
    const { data } = await supabase.from("role_categories").select("roleId, category");
    rows = data || [];
  } catch (e) {
    console.warn(`[role-categories] DB load failed (${e.message})`);
  }
  const explicit = new Map(rows.map((r) => [r.roleId, r.category]));

  const roles = guild.roles.cache
    .filter((r) => !r.managed && r.id !== guild.id)
    .map((r) => {
      const rank = findRankByRoleName(r.name);
      return {
        id: r.id,
        name: r.name,
        position: r.position,
        rankId: rank?.id || null,
        rankAr: rank?.titleAr || null,
        detected: detectCategory(r),
        category: explicit.get(r.id) || null,
      };
    })
    .sort((a, b) => b.position - a.position);

  const officer = rows.filter((r) => r.category === "officer").map((r) => r.roleId);
  const enlisted = rows.filter((r) => r.category === "enlisted").map((r) => r.roleId);

  return { ok: true, guild: guild.name, officer, enlisted, roles };
}

// Upsert an explicit category for a role. category null removes the mapping.
export async function setRoleCategory(roleId, category) {
  const cat = category === "enlisted" ? "enlisted" : category === "officer" ? "officer" : null;
  if (!cat) {
    const { error } = await supabase.from("role_categories").delete().eq("roleId", roleId);
    if (error) return { ok: false, error: error.message };
    return { ok: true, removed: true };
  }
  const { error } = await supabase
    .from("role_categories")
    .upsert({ roleId, category: cat, updatedAt: new Date().toISOString() }, { onConflict: "roleId" });
  if (error) return { ok: false, error: error.message };
  return { ok: true, category: cat };
}

// Auto-configure: persist the auto-detected category for every role that has one.
export async function syncDetectedCategories(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  let added = 0;
  for (const role of guild.roles.cache.values()) {
    const detected = detectCategory(role);
    if (detected) {
      const res = await setRoleCategory(role.id, detected);
      if (res.ok) added++;
    }
  }
  return { ok: true, added };
}