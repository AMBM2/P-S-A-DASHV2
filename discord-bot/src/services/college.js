import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { supabase } from "../supabase.js";
import { getGuild, buildNickname } from "./nickname.js";
import { findRankByLevel } from "../ranks.js";

function findRoleForLevel(guild, level) {
  const rank = findRankByLevel(level);
  if (!rank) return null;
  for (const name of [rank.titleAr, rank.title, rank.id]) {
    const role = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === String(name).toLowerCase()
    );
    if (role) return role;
  }
  return null;
}

// Next free badge code (PSA-XXXX) derived from the officers table.
export async function nextBadge() {
  const { data, error } = await supabase.from("officers").select("badge");
  if (error || !Array.isArray(data)) return "PSA-1000";
  let max = 0;
  for (const row of data) {
    const m = String(row.badge || "").match(/PSA-(\d+)/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `PSA-${max + 1}`;
}

// Assign a cadet/recruit role + the selected military rank roles + notify the
// college channel when an application is approved and the applicant becomes a
// Military College cadet. `ranks` is an array of Discord role IDs (selected on
// the recruitment form) — they are granted to the member immediately.
export async function enrollCadet(client, cadet) {
  const guild = getGuild(client);
  if (!guild || !cadet?.discordId) return { ok: false, reason: "no-guild-or-discord" };

  const results = {
    roleAssigned: false,
    officialRoleAssigned: false,
    ranksGranted: 0,
    notified: false,
    dmSent: false,
  };
  const selectedRoleIds = Array.isArray(cadet.ranks) ? cadet.ranks : [];

  try {
    const member = await guild.members.fetch(cadet.discordId);

    // 1. Grant the selected rank roles immediately.
    for (const roleId of selectedRoleIds) {
      const role = guild.roles.cache.get(roleId);
      if (!role) continue;
      if (member.roles.cache.has(roleId)) continue;
      try {
        if (member.manageable) {
          await member.roles.add(roleId, "Military College enrollment");
          results.ranksGranted++;
        }
      } catch (e) {
        console.warn(`[college] rank role add failed for ${roleId}:`, e.message);
      }
    }

    // 2. Recruit role (fallback: level-0 rank role).
    const recruitRole =
      guild.roles.cache.get(config.newRecruitRoleId || "") || findRoleForLevel(guild, 0);
    if (recruitRole && !member.roles.cache.has(recruitRole.id)) {
      try {
        await member.roles.add(recruitRole.id, "Military College enrollment");
        results.roleAssigned = true;
      } catch (e) {
        console.warn("[college] role add failed:", e.message);
      }
    }

    // 2b. Official member role (العضو الرسمي) — the permanent membership role.
    const officialRole = guild.roles.cache.get(config.officialMemberRoleId || "");
    if (officialRole && !member.roles.cache.has(officialRole.id)) {
      try {
        await member.roles.add(officialRole.id, "Official member (approved application)");
        results.officialRoleAssigned = true;
      } catch (e) {
        console.warn("[college] official role add failed:", e.message);
      }
    }

    try {
      const nick = buildNickname({ nameAr: cadet.nameAr, name: cadet.name, badge: cadet.badge || "" });
      if (member.nickname !== nick && member.manageable) {
        await member.setNickname(nick, "Military College enrollment");
      }
    } catch {}

    try {
      await member.send(
        `📜 مرحباً بك في **الكلية العسكرية** — الأمن العام!\n\nتم قبول طلبك. سيتم متابعة تخرجك وتطوير رتبتك عبر البوابة الرسمية.\n${config.portalUrl}/admin`
      );
      results.dmSent = true;
    } catch {
      // DM blocked — fine
    }
  } catch {
    // member not in server — record only
  }

  const notify = await notifyCollege(client, {
    name: cadet.name,
    nameAr: cadet.nameAr,
    discordId: cadet.discordId,
    unit: cadet.unit,
    ranks: ["تم قبول المتقدم في الكلية العسكرية"],
  });
  results.notified = notify.ok;

  return { ok: true, ...results };
}

// Post a Military College notification embed to the configured college channel.
// Falls back to the patrol channel, then the first text channel in the guild.
export async function notifyCollege(client, payload) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, reason: "no-guild" };

  let channel = null;
  if (config.collegeChannelId) {
    channel = guild.channels.cache.get(config.collegeChannelId);
  }
  if (!channel && config.patrolChannelId) {
    channel = guild.channels.cache.get(config.patrolChannelId);
  }
  if (!channel) {
    channel = guild.channels.cache.find((c) => c.type === 0);
  }
  if (!channel) return { ok: false, reason: "no-channel" };

  const name = payload?.name || payload?.nameAr || "—";
  const unit = payload?.unit || "—";
  const ranks = Array.isArray(payload?.ranks) ? payload.ranks : [];
  const ranksText = ranks.length ? ranks.join(", ") : "—";

  const embed = new EmbedBuilder()
    .setColor(0xd9b45b)
    .setTitle("الكلية العسكرية — طلب تجنيد جديد")
    .setDescription("تم استلام طلب جديد وسيتم مراجعته من قبل مسؤولي التوظيف.")
    .addFields(
      { name: "الاسم", value: name, inline: true },
      { name: "Discord ID", value: payload?.discordId || "—", inline: true },
      { name: "الوحدة", value: unit, inline: true },
      { name: "الرتب المطلوبة", value: ranksText }
    )
    .setTimestamp();

  try {
    await channel.send({ content: "الكلية العسكرية — طلب تجنيد جديد", embeds: [embed] });
    return { ok: true, channelId: channel.id };
  } catch (e) {
    console.warn(`[college] send failed on channel ${channel.id} (${channel.name}) -> ${e.message}`);
    return { ok: false, reason: e.message };
  }
}