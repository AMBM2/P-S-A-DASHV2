import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { getHighestRank, isOnDuty } from "../ranks.js";
import { nextBadge } from "./badge.js";

// ---- member → officer record ----
async function upsertOfficerFromMember(member) {
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

  const members = await guild.members.fetch();
  let created = 0;
  let updated = 0;
  let skippedBots = 0;

  for (const member of members.values()) {
    if (member.user.bot) {
      skippedBots++;
      continue;
    }
    const res = await upsertOfficerFromMember(member);
    if (res.created) created++;
    else updated++;
  }

  return { ok: true, rolesSynced, membersTotal: members.size, created, updated, skippedBots };
}

// Extract a single member (on guildMemberAdd / update)
export async function extractMember(member) {
  if (member.user.bot) return { ok: false, reason: "bot" };
  const res = await upsertOfficerFromMember(member);
  return { ok: true, ...res };
}
