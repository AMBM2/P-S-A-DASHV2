import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { RANKS } from "../ranks.js";

// Handles a Field Patrol submission (from the portal's جدول الميدان page).
// Posts to the patrol alert channel (config.patrolChannelId) with the scenario
// image + mentions of the participants labeled with their military ranks.
// No points are awarded — participation only.
export async function dispatchPatrol(client, patrol) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  // Preferred target: PATROL_CHANNEL_ID (the dedicated alert room).
  const target =
    (config.patrolChannelId && guild.channels.cache.get(config.patrolChannelId)) ||
    guild.channels.cache.find((c) => c.isTextBased());
  if (!target || !target.isTextBased()) {
    return { ok: false, error: "text-channel-not-found" };
  }

  // Participants: the ones selected on the portal (fallback: voice channel).
  let memberIds = Array.isArray(patrol.participants) ? patrol.participants : [];
  let fromVoice = false;
  if (!memberIds.length && patrol.roomId) {
    const vc = guild.channels.cache.get(patrol.roomId);
    if (vc && vc.isVoiceBased()) {
      memberIds = [...vc.members.keys()];
      fromVoice = true;
    }
  }
  const count = memberIds.length;

  // Resolve each participant's officer + military rank for the mentions.
  const rankByDiscord = new Map();
  const displayByDiscord = new Map();
  if (memberIds.length) {
    const { data: officers } = await supabase
      .from("officers")
      .select("discordId, nameAr, rankId")
      .in("discordId", memberIds);
    for (const o of officers || []) {
      if (!o.discordId) continue;
      displayByDiscord.set(o.discordId, o.nameAr || o.discordId);
      const rank = RANKS.find((r) => r.id === o.rankId);
      if (rank) rankByDiscord.set(o.discordId, rank.titleAr);
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0xd9b45b)
    .setTitle("🚨 تنبيه ميداني — الأمن العام")
    .setDescription(
      `**اسم السيناريو:** ${patrol.nameAr || patrol.name || "—"}\n**عدد المشاركين:** ${count}`
    )
    .setTimestamp()
    .setFooter({ text: "Field Patrol Dispatch" });
  if (patrol.image) embed.setImage(patrol.image);

  // Mentions labeled with each participant's military rank (e.g. @عقيد / @عميد).
  const mentions = memberIds.map((id) => {
    const name = displayByDiscord.get(id) || `<@${id}>`;
    const rank = rankByDiscord.get(id);
    return rank ? `${name} **(${rank})**` : name;
  });
  const body = mentions.length
    ? `${mentions.join("\n")}\n\n**تنبيه ميداني جديد — يرجى الانتباه**`
    : "**تنبيه ميداني جديد**";

  await target.send({ content: body, embeds: [embed] });

  // Persist detected participants on the patrol record
  await supabase
    .from("patrols")
    .update({ participants: memberIds, participantCount: count, status: "dispatched" })
    .eq("id", patrol.id);

  return { ok: true, count, sentTo: target.id, memberIds, fromVoice };
}