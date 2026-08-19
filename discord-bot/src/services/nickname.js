import { config } from "../config.js";
import { supabase } from "../supabase.js";

export function getGuild(client) {
  if (config.guildId) {
    const g = client.guilds.cache.get(config.guildId);
    if (g) return g;
  }
  return client.guilds.cache.first() || null;
}

// Strip a leading [XXX] code prefix so re-running never doubles the bracket.
export function stripBadgePrefix(nick) {
  return String(nick || "").replace(/^\s*\[[^\]]*\]\s*/, "").trim();
}

// [Badge ID] DisplayName  =>  e.g. [NH-120] F7M
// Non-destructive: prefers an explicit displayName and preserves it exactly.
export function buildNickname({ badge, nameAr, name, displayName } = {}) {
  const badgeText = String(badge || "").trim();
  const base = stripBadgePrefix(displayName || nameAr || name || "");
  const nick = badgeText ? `[${badgeText}] ${base}` : base;
  return nick.trim();
}

// Non-destructive Discord nickname sync: prepends [code] to the member's
// EXISTING server nickname / display name without ever overwriting it with
// their real first/last name. setNickname is wrapped so higher-privilege
// members (Owner/Admins) log a warning without breaking the flow.
export async function applyBadgeNickname(guildMember, badge, reason = "Badge assignment") {
  if (!guildMember) return { ok: false, reason: "no-member" };
  const base = stripBadgePrefix(guildMember.nickname || guildMember.displayName || "");
  const nick = badge ? `[${badge}] ${base}` : base;
  if (guildMember.nickname === nick) return { ok: true, changed: false, nick };
  if (!guildMember.manageable) {
    console.warn(`[nickname] skipped ${guildMember.id} — member is not manageable (higher privilege).`);
    return { ok: false, reason: "not-manageable" };
  }
  try {
    await guildMember.setNickname(nick, reason);
    return { ok: true, changed: true, nick };
  } catch (e) {
    console.warn(`[nickname] rename failed for ${guildMember.id} (${reason}): ${e?.message}`);
    return { ok: false, reason: e?.message };
  }
}

// Auto-rename an officer's Discord nickname from their portal record.
// Non-destructive: preserves the member's existing server nickname.
export async function syncNickname(client, officer) {
  const guild = getGuild(client);
  if (!guild || !officer.discordId) return { ok: false, reason: "no-guild-or-discord" };
  let member;
  try {
    member = await guild.members.fetch(officer.discordId);
  } catch {
    return { ok: false, reason: "member-not-in-server" };
  }
  if (!member.manageable) return { ok: false, reason: "not-manageable" };

  const nick = buildNickname({
    badge: officer.badge,
    displayName: member.nickname || member.displayName,
  });
  if (member.nickname === nick) return { ok: true, changed: false };

  try {
    await member.setNickname(nick, "Sync from Public Security Portal");
    return { ok: true, changed: true, nick };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// Upsert the officer's Discord profile fields (name/avatar) into Supabase.
export async function syncProfileToDb(discordId, discordName, discordAvatar) {
  const { data: existing } = await supabase
    .from("officers")
    .select("id")
    .eq("discordId", discordId)
    .maybeSingle();
  if (!existing) return { ok: false, reason: "not-linked" };

  await supabase
    .from("officers")
    .update({
      discordName,
      discordAvatar,
      name: discordName || existing.name,
    })
    .eq("id", existing.id);
  return { ok: true };
}
