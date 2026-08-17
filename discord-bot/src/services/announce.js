import { config } from "../config.js";
import { getGuild } from "./nickname.js";

// Post an announcement to the recruitment room (توظيف مواطن). Falls back to the
// patrol channel, then the first text channel in the guild — including when the
// preferred channel refuses the send (Missing Access / Missing Permissions).
export async function announce(client, payload) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, reason: "no-guild" };

  const text = String(payload?.message || "").trim();
  if (!text) return { ok: false, reason: "empty-message" };

  const candidates = [];
  const add = (c) => {
    if (c && c.isTextBased && c.isTextBased() && !candidates.some((x) => x.id === c.id)) candidates.push(c);
  };
  if (config.recruitChannelId) add(guild.channels.cache.get(config.recruitChannelId));
  if (config.patrolChannelId) add(guild.channels.cache.get(config.patrolChannelId));
  add(guild.channels.cache.find((c) => c.type === 0));
  if (candidates.length === 0) return { ok: false, reason: "no-channel" };

  let lastErr = "send-failed";
  for (const channel of candidates) {
    try {
      await channel.send({ content: text });
      return { ok: true, channelId: channel.id, fallback: channel.id !== config.recruitChannelId };
    } catch (e) {
      lastErr = e.message;
      console.warn(`[announce] send failed on channel ${channel.id} -> ${e.message}`);
    }
  }
  return { ok: false, reason: lastErr };
}