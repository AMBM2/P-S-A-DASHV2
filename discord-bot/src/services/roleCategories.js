import { config } from "../config.js";
import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { findRankByRoleName, getHighestRank } from "../ranks.js";

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

// Short-lived cache so the field UI doesn't hammer Discord's members.fetch
// (large guild → opcode 8 rate limits). 25s TTL keeps presence reasonably fresh.
let fieldCache = { at: 0, data: null };
const FIELD_CACHE_TTL_MS = 25_000;

// Full Public Security member list for the field dispatch UI: every guild
// member holding an officer/enlisted category role, with rank + presence
// (connected = online/idle/dnd, plus whether they are in a voice channel).
export async function getFieldMembers(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  if (fieldCache.data && Date.now() - fieldCache.at < FIELD_CACHE_TTL_MS) {
    return fieldCache.data;
  }

  const categoryMap = await loadRoleCategories(client);

  let members;
  try {
    members = await guild.members.fetch();
  } catch (e) {
    if (fieldCache.data) return fieldCache.data;
    return { ok: false, error: e.message };
  }

  const voiceIds = new Set();
  for (const ch of guild.channels.cache.filter((c) => c.isVoiceBased()).values()) {
    for (const m of ch.members.values()) voiceIds.add(m.id);
  }

  const list = [];
  for (const member of members.values()) {
    // Only Public Security role holders (the field dispatch target group).
    if (config.fieldMemberRoleId && !member.roles.cache.has(config.fieldMemberRoleId)) continue;

    let cat = null;
    const rank = getHighestRank(member);
    if (rank && (rank.division === "command" || rank.division === "officer")) cat = "officer";
    else if (rank && rank.division === "troop") cat = "enlisted";
    if (!cat) {
      for (const roleId of member.roles.cache.keys()) {
        const c = categoryMap.get(roleId);
        if (c === "officer") {
          cat = "officer";
          break;
        }
        if (c === "enlisted" && !cat) cat = "enlisted";
      }
    }
    if (!cat) continue;

    const status = member.presence?.status || "offline";
    list.push({
      id: member.id,
      name: member.displayName || member.user.username,
      avatar: member.user.displayAvatarURL({ size: 128 }),
      rankAr: rank?.titleAr || "",
      rankLevel: rank?.level ?? -1,
      category: cat,
      connected: status !== "offline",
      inVoice: voiceIds.has(member.id),
    });
  }

  list.sort(
    (a, b) => (b.rankLevel ?? -1) - (a.rankLevel ?? -1) || a.name.localeCompare(b.name)
  );

  const result = { ok: true, members: list };
  fieldCache = { at: Date.now(), data: result };
  return result;
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