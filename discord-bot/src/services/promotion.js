import { supabase } from "../supabase.js";
import { getGuild, buildNickname } from "./nickname.js";
import { RANKS, findRoleByRank } from "../ranks.js";
import { nextBadge, matchesPool } from "./badge.js";

function rankById(id) {
  return RANKS.find((r) => r.id === id) || null;
}

// Feature 3: Smart Promotion & Dynamic Badge Management.
export async function handlePromotion(client, officer, prevRankId) {
  const guild = getGuild(client);
  if (!guild || !officer.discordId) return { ok: false, reason: "no-guild-or-discord" };

  const newRank = rankById(officer.rankId);
  if (!newRank) return { ok: false, reason: "rank-not-found" };

  let member;
  try {
    member = await guild.members.fetch(officer.discordId);
  } catch {
    return { ok: false, reason: "member-not-in-server" };
  }

  const results = { badgeChanged: false, roleChanged: false };

  // 1. Re-assign badge code from the new rank's pool
  if (!matchesPool(officer.badge, newRank)) {
    const newBadge = await nextBadge(newRank);
    await supabase.from("officers").update({ badge: newBadge }).eq("id", officer.id);
    officer.badge = newBadge;
    results.badgeChanged = true;
  }

  // 2. Swap rank role (requires Manage Roles)
  const newRole = findRoleByRank(guild, newRank);
  const oldRank = prevRankId ? rankById(prevRankId) : null;
  const oldRole = oldRank ? findRoleByRank(guild, oldRank) : null;

  if (newRole && member.manageable) {
    if (oldRole && oldRole.id !== newRole.id && member.roles.cache.has(oldRole.id)) {
      await member.roles.remove(oldRole.id, "Promotion: rank role swap");
    }
    if (!member.roles.cache.has(newRole.id)) {
      await member.roles.add(newRole.id, "Promotion via portal");
    }
    results.roleChanged = true;
  }

  // 3. Update nickname
  try {
    const nick = buildNickname(officer);
    if (member.nickname !== nick && member.manageable) {
      await member.setNickname(nick, "Promotion badge sync");
    }
  } catch (e) {
    console.warn("[promo] nickname failed:", e.message);
  }

  return { ok: true, ...results };
}
