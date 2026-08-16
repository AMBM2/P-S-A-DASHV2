import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { getHighestRank, isOnDuty, findDepartment } from "../ranks.js";
import { nextBadge, matchesPool } from "./badge.js";
import { config } from "../config.js";

// ---- member → officer record ----
async function upsertOfficerFromMember(member) {
  if (member.user.bot) return { ok: false, reason: "bot" };
  if (config.memberRoleId && !member.roles.cache.has(config.memberRoleId)) {
    return { ok: false, reason: "no-role" };
  }
  const rank = getHighestRank(member);
  const status = isOnDuty(member) ? "on-duty" : "off-duty";
  const username = member.user.username; // الاسم (username)
  const nameAr = member.displayName || member.user.username; // النيك نيم (server nickname)
  const department = findDepartment(member);

  const { data: existing } = await supabase
    .from("officers")
    .select("id")
    .eq("discordId", member.id)
    .maybeSingle();

  const base = {
    discordId: member.id,
    name: username,
    nameAr,
    discordName: username,
    discordAvatar: member.user.displayAvatarURL?.({ extension: "png", size: 256 }) || null,
    rankId: rank?.id || "r-tr1",
    status,
    joinedAt: member.joinedAt?.toISOString() || new Date().toISOString(),
  };

  if (existing) {
    // Keep manual portal data; sync rank/profile/status, and assign a badge that
    // matches the member's CURRENT rank (fixes stale codes from older syncs).
    const cur = await supabase.from("officers").select("badge, departmentId").eq("id", existing.id).maybeSingle();
    const patch = { ...base };
    if (department) patch.departmentId = department.id;
    const effectiveRank = rank || (await import("../ranks.js")).findRankByLevel(0);
    if (!cur?.badge || !matchesPool(cur.badge, effectiveRank)) {
      patch.badge = await nextBadge(effectiveRank);
    }
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
      name: username,
      nameAr,
      callsign: "",
      discordId: member.id,
      discordName: username,
      discordAvatar: member.user.displayAvatarURL?.({ extension: "png", size: 256 }) || null,
      rankId: rank?.id || "r-tr1",
      departmentId: department?.id || "d-hq",
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

  // Purge officers who are guild members but no longer hold the sync role
  // (removes stale records created before the role filter was added).
  let purged = 0;
  if (config.memberRoleId) {
    for (const member of members.values()) {
      if (member.user.bot) continue;
      if (!member.roles.cache.has(config.memberRoleId)) {
        const { error } = await supabase.from("officers").delete().eq("discordId", member.id);
        if (!error) purged++;
      }
    }
    console.log(`[sync] purged ${purged} officers without the role`);
  }

  return { ok: true, rolesSynced, membersTotal: members.size, created, updated, skippedBots, skippedNoRole, failed, purged };
}

// Extract a single member (on guildMemberAdd / update)
export async function extractMember(member) {
  if (member.user.bot) return { ok: false, reason: "bot" };
  const res = await upsertOfficerFromMember(member);
  return { ok: true, ...res };
}
