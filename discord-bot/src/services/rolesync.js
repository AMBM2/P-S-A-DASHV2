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
//  - when strip=true: remove every military rank role that does not match
//    officer.rankId (rank changed), then ensure the matching role is present
//  - when strip=false: only ensure the matching rank role is present, keep all
//    other rank roles (used when graduating a cadet who holds several ranks)
export async function reconcileMemberRoles(client, officer, { strip = true } = {}) {
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

  if (strip) {
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