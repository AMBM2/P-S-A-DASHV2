import { getGuild } from "./nickname.js";
import { RANKS, findRoleByRank, findRankByRoleName } from "../ranks.js";

function rankRoleIds(guild) {
  const ids = new Set();
  for (const role of guild.roles.cache.values()) {
    if (findRankByRoleName(role.name)) ids.add(role.id);
  }
  return ids;
}

// Reconcile a member's Discord roles against their portal record:
//  - removes every military rank role that does not match officer.rankId
//  - ensures the matching rank role is present
export async function reconcileMemberRoles(client, officer) {
  const guild = getGuild(client);
  if (!guild || !officer?.discordId) return { ok: false, reason: "no-guild-or-discord" };

  let member;
  try {
    member = await guild.members.fetch(officer.discordId);
  } catch {
    return { ok: false, reason: "member-not-in-server" };
  }

  const newRank = RANKS.find((r) => r.id === officer.rankId);
  const targetRole = newRank ? findRoleByRank(guild, newRank) : null;
  const military = rankRoleIds(guild);

  const results = { removed: 0, added: 0 };

  for (const roleId of member.roles.cache.keys()) {
    if (!military.has(roleId)) continue;
    if (targetRole && roleId === targetRole.id) continue;
    try {
      if (member.manageable) {
        await member.roles.remove(roleId, "Role reconciliation via portal");
        results.removed++;
      }
    } catch {
      // not manageable — skip
    }
  }

  if (targetRole && !member.roles.cache.has(targetRole.id)) {
    try {
      if (member.manageable) {
        await member.roles.add(targetRole.id, "Role reconciliation via portal");
        results.added++;
      }
    } catch {
      // not manageable — skip
    }
  }

  return { ok: true, ...results };
}