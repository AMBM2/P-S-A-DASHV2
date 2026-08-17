import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";

// Embed color by audit action family.
const COLOR_BY_ACTION = [
  { keys: ["recruitment.approved"], color: 0x34d399 },
  { keys: ["recruitment.denied", "officer.discharged", "store.remove"], color: 0xf87171 },
  { keys: ["permissions.upsert", "permissions.revoke"], color: 0x818cf8 },
  { keys: ["exams.create", "exams.update", "exams.delete", "exams.completed"], color: 0xfbbf24 },
  { keys: ["settings.update", "store.upsert"], color: 0xd9b45b },
];

const actionColor = (action) => {
  const hit = COLOR_BY_ACTION.find((g) => g.keys.includes(action));
  return hit ? hit.color : 0x94a3b8;
};

const MAX_META = 900;

// Send a single audit log entry as an embed to the dedicated audit-log channel.
// Falls back to the patrol channel, then the first text channel in the guild —
// including when the preferred channel refuses the send (Missing Access).
export async function sendAuditLog(client, entry) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, reason: "no-guild" };

  const candidates = [];
  const add = (c) => {
    if (c && c.isTextBased && c.isTextBased() && !candidates.some((x) => x.id === c.id)) candidates.push(c);
  };
  if (config.auditChannelId) add(guild.channels.cache.get(config.auditChannelId));
  if (config.patrolChannelId) add(guild.channels.cache.get(config.patrolChannelId));
  add(guild.channels.cache.find((c) => c.type === 0));
  if (candidates.length === 0) return { ok: false, reason: "no-channel" };

  const meta = entry?.metadata;
  let metaText = "—";
  if (meta && typeof meta === "object") {
    const s = JSON.stringify(meta);
    metaText = s.length > MAX_META ? `${s.slice(0, MAX_META)}…` : s;
  }

  const embed = new EmbedBuilder()
    .setColor(actionColor(entry?.action))
    .setTitle(`🛡️ لوق العمليات — ${entry?.actionAr || entry?.action || "حدث"}`)
    .setDescription(entry?.action ? `\`${entry.action}\`` : null)
    .addFields(
      {
        name: "المنفّذ",
        value: entry?.executorName ? `${entry.executorName} (\`${entry.executor || "—"}\`)` : entry?.executor || "—",
        inline: true,
      },
      {
        name: "المستهدف",
        value: entry?.targetName ? `${entry.targetName}${entry.target ? ` (\`${entry.target}\`)` : ""}` : entry?.target || "—",
        inline: true,
      },
      { name: "التفاصيل", value: `\`\`\`json\n${metaText}\n\`\`\`` }
    )
    .setFooter({ text: "بوابة الأمن العام — سجل العمليات" })
    .setTimestamp();

  let lastErr = "send-failed";
  for (const channel of candidates) {
    // Prefer the rich embed; fall back to a plain text message on the same
    // channel (embeds need the Embed Links permission, plain text only needs
    // View Channel + Send Messages).
    try {
      await channel.send({ embeds: [embed] });
      const usedAuditChannel = channel.id === config.auditChannelId;
      return { ok: true, channelId: channel.id, fallback: !usedAuditChannel };
    } catch (e) {
      lastErr = e.message;
      console.warn(`[audit] embed failed on channel ${channel.id} -> ${e.message}`);
    }
    try {
      const line =
        `🛡️ **لوق العمليات — ${entry?.actionAr || entry?.action || "حدث"}**\n` +
        `المنفّذ: ${entry?.executorName ? `${entry.executorName} (\`${entry.executor || "—"}\`)` : entry?.executor || "—"}\n` +
        `المستهدف: ${entry?.targetName ? `${entry.targetName}${entry.target ? ` (\`${entry.target}\`)` : ""}` : entry?.target || "—"}\n` +
        `\`\`\`json\n${metaText}\n\`\`\``;
      await channel.send({ content: line });
      const usedAuditChannel = channel.id === config.auditChannelId;
      return { ok: true, channelId: channel.id, fallback: !usedAuditChannel, plain: true };
    } catch (e) {
      lastErr = e.message;
      console.warn(`[audit] text failed on channel ${channel.id} -> ${e.message}`);
    }
  }
  return { ok: false, reason: lastErr };
}