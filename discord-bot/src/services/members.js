import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { getHighestRank, isOnDuty } from "../ranks.js";
import { nextBadge } from "./badge.js";
import { config } from "../config.js";

// ---- member → officer record ----
async function upsertOfficerFromMember(member) {
  if (member.user.bot) return { ok: false, reason: "bot" };
  if (config.memberRoleId && !member.roles.cache.has(config.memberRoleId)) {
    return { ok: false, reason: "no-role" };
  }
  const rank = getHighestRank(member);
  const status = isOnDuty(member) ? "on-duty" : "off-duty";
  const name = member.user.username;
  const nameAr = member.displayName || member.user.username;

  const { data: existing } = await supabase
    .from("officers")
    .select("id")
    .eq("discordId", member.id)
    .maybeSingle();

  const base = {
    discordId: member.id,
    discordName: member.displayName || member.user.username,
    discordAvatar: member.user.displayAvatarURL?.({ extension: "png" }) || null,
    rankId: rank?.id || "r-tr1",
    status,
  };

  if (existing) {
    // Keep manual portal data; only sync rank/profile/status + ensure a badge exists
    const cur = await supabase.from("officers").select("badge").eq("id", existing.id).maybeSingle();
    const patch = { ...base };
    if (!cur?.badge) patch.badge = await nextBadge(rank || (await import("../ranks.js")).findRankByLevel(0));
    await supabase.from("officers").update(patch).eq("id", existing.id);
    return { officerId: existing.id, created: false };
  }

  // Auto-create for members not yet in the portal
  const recruitRank = (await import("../ranks.js")).findRankByLevel(0);
  const badge = await nextBadge(rank || recruitRank);
  const { data: created } = await supabase
    .from("officers")
    .insert({
      badge,
      name,
      nameAr,
      callsign: "",
      discordId: member.id,
      discordName: member.displayName || member.user.username,
      discordAvatar: member.user.displayAvatarURL?.({ extension: "png" }) || null,
      rankId: rank?.id || "r-tr1",
      departmentId: "d-hq",
      status,
      specialization: [],
      medals: [],
      joinedAt: member.joinedAt?.toISOString() || new Date().toISOString(),
      activityHours: 0,
      performance: 0,
      threats: 0,
      medicalClear: false,
    })
    .select("id")
    .single();

  return { officerId: created?.id, created: true };
}

async function syncRoles(guild) {
  let count = 0;
  for (const role of guild.roles.cache.values()) {
    if (role.managed) continue;
    const rank = getHighestRank({ roles: { cache: new Map([[role.id, role]]) } });
    const rec = {
      roleId: role.id,
      name: role.name,
      nameAr: rank?.titleAr || role.name,
      type: rank ? "rank" : "functional",
      rankId: rank?.id || null,
      level: rank?.level || 0,
      color: role.hexColor || null,
      permissions: { position: role.position },
    };
    const existing = await supabase.from("roles").select("id").eq("roleId", role.id).maybeSingle();
    if (existing) {
      await supabase.from("roles").update(rec).eq("roleId", role.id);
    } else {
      await supabase.from("roles").insert(rec);
    }
    count++;
  }
  return count;
}

// Full member & role extraction (feature: pull everything into the site)
export async function extractAllMembers(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  const rolesSynced = await syncRoles(guild);
  console.log("[sync] rolesSynced:", rolesSynced, "guild:", guild.name);
  const members = await guild.members.fetch();
  console.log("[sync] members fetched:", members.size);

  let created = 0;
  let updated = 0;
  let skippedBots = 0;
  let skippedNoRole = 0;
  let failed = 0;

  let i = 0;
  for (const member of members.values()) {
    i++;
    if (member.user.bot) {
      skippedBots++;
      continue;
    }
    if (config.memberRoleId && !member.roles.cache.has(config.memberRoleId)) {
      skippedNoRole++;
      continue;
    }
    try {
      const res = await upsertOfficerFromMember(member);
      if (res.created) created++;
      else if (res.reason === "no-role") skippedNoRole++;
      else if (res.reason === "bot") skippedBots++;
      else updated++;
    } catch (e) {
      failed++;
      console.warn(`[sync] member ${member.user.tag} error:`, e.message);
    }
    if (i % 100 === 0) console.log(`[sync] progress ${i}/${members.size} created=${created}`);
  }

  console.log(`[sync] done: created=${created} updated=${updated} skippedBots=${skippedBots} skippedNoRole=${skippedNoRole} failed=${failed}`);
  return { ok: true, rolesSynced, membersTotal: members.size, created, updated, skippedBots, skippedNoRole, failed };
}

// Extract a single member (on guildMemberAdd / update)
export async function extractMember(member) {
  if (member.user.bot) return { ok: false, reason: "bot" };
  const res = await upsertOfficerFromMember(member);
  return { ok: true, ...res };
}
