import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";

// Handles a Field Patrol submission (from the portal's جدول الميدان page).
// Scans the voice channel, posts an embed with mentions, and awards points.
export async function dispatchPatrol(client, patrol) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  const roomId = patrol.roomId;
  const vc = roomId ? guild.channels.cache.get(roomId) : null;
  if (!vc || !vc.isVoiceBased()) {
    return { ok: false, error: `voice-channel-not-found:${roomId}` };
  }

  const memberIds = [...vc.members.keys()];
  const count = memberIds.length;
  const points = Number(patrol.points) || 0;

  const embed = new EmbedBuilder()
    .setColor(0xd9b45b)
    .setTitle("🚨 تنبيه ميداني — الأمن العام")
    .setDescription(
      `**اسم السيناريو:** ${patrol.nameAr || patrol.name || "—"}\n**النقاط الممنوحة:** ${points}\n**عدد المشاركين:** ${count}`
    )
    .setTimestamp()
    .setFooter({ text: "Field Patrol Dispatch" });
  if (patrol.image) embed.setImage(patrol.image);

  const mentions = memberIds.map((id) => `<@${id}>`).join(" ");
  const body = mentions
    ? `${mentions}\n**تنبيه ميداني جديد — يرجى الانتباه**`
    : "**تنبيه ميداني جديد**";

  let sentTo = null;
  const target =
    (config.patrolChannelId && guild.channels.cache.get(config.patrolChannelId)) ||
    guild.channels.cache.find((c) => c.isTextBased());

  if (target && target.isTextBased()) {
    await target.send({ content: body, embeds: [embed] });
    sentTo = target.id;
  }

  // Award points to officers linked to the detected Discord IDs
  let awarded = 0;
  if (memberIds.length && points > 0) {
    const { data: officers } = await supabase
      .from("officers")
      .select("id, fieldPoints")
      .in("discordId", memberIds);

    if (officers) {
      for (const off of officers) {
        const nv = (off.fieldPoints || 0) + points;
        await supabase.from("officers").update({ fieldPoints: nv }).eq("id", off.id);
        awarded++;
      }
    }
  }

  // Persist detected participants on the patrol record
  await supabase
    .from("patrols")
    .update({ participants: memberIds, participantCount: count, status: "dispatched" })
    .eq("id", patrol.id);

  return { ok: true, count, awarded, sentTo, memberIds };
}
