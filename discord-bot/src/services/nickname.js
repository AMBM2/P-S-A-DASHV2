import { config } from "../config.js";
import { supabase } from "../supabase.js";

export function getGuild(client) {
  if (config.guildId) {
    const g = client.guilds.cache.get(config.guildId);
    if (g) return g;
  }
  return client.guilds.cache.first() || null;
}

// [Badge ID] Name  =>  e.g. [A-101] عبدالكريم
export function buildNickname(officer) {
  const badge = (officer.badge || "").trim();
  const name = (officer.nameAr || officer.name || "").trim();
  const nick = badge ? `[${badge}] ${name}` : name;
  return nick.trim();
}

// Auto-rename an officer's Discord nickname from their portal record.
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

  const nick = buildNickname(officer);
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
