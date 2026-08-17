import { config } from "../config.js";
import { getGuild } from "./nickname.js";

// Self-healing channel permissions: on startup (and periodically) the bot
// verifies it can actually post to its configured channels (audit, recruit,
// news, patrol). If a permission is missing AND the bot holds Manage Channels,
// it grants itself the missing overwrite automatically. Otherwise it logs the
// exact permissions to ask the admin for — no more guessing "Missing Access".

const NEEDED = ["ViewChannel", "SendMessages", "EmbedLinks", "AttachFiles"];
const CHANNEL_KEYS = [
  ["auditChannelId", "audit log (لوق العمليات)"],
  ["recruitChannelId", "recruitment room (توظيف مواطن)"],
  ["newsChannelId", "news media room"],
  ["patrolChannelId", "patrol room"],
];

export async function ensureChannelPermissions(client) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, reason: "no-guild" };

  const me = guild.members.me;
  const canManageChannel =
    me?.permissions?.has("Administrator") ||
    me?.permissions?.has("ManageChannels");

  const report = [];
  for (const [key, label] of CHANNEL_KEYS) {
    const id = config[key];
    if (!id) continue;
    const channel = guild.channels.cache.get(id);
    if (!channel || !channel.isTextBased?.()) {
      report.push({ channel: id, label, ok: false, reason: "channel-not-found-or-not-text" });
      continue;
    }

    const perms = channel.permissionsFor(me);
    const missing = NEEDED.filter((p) => !perms?.has(p));

    if (missing.length === 0) {
      report.push({ channel: id, label, ok: true, missing: [] });
      continue;
    }

    if (canManageChannel) {
      // Auto-grant the missing permissions on this channel for the bot user.
      try {
        const overwrite = channel.permissionOverwrites.cache.get(client.user.id);
        const allow = overwrite ? overwrite.allow.bitfield : 0n;
        const deny = overwrite ? overwrite.deny.bitfield : 0n;
        const flags = missing.reduce((acc, p) => acc | perms.constructor.Flags[p], 0n);
        await channel.permissionOverwrites.create(client.user.id, {
          allow: allow | flags,
          deny,
          type: 1, // member
        });
        report.push({ channel: id, label, ok: true, selfGranted: missing });
        console.log(`[perms] ✅ self-granted ${missing.join(", ")} on channel ${id} (${label})`);
      } catch (e) {
        report.push({ channel: id, label, ok: false, reason: `self-grant-failed: ${e.message}` });
        console.warn(`[perms] ❌ self-grant failed on ${id}: ${e.message}`);
      }
    } else {
      report.push({ channel: id, label, ok: false, missing });
      console.warn(
        `[perms] ⚠️ bot lacks ${missing.join(", ")} on channel ${id} (${label}). ` +
          `Grant the bot "View Channel", "Send Messages", "Embed Links", "Attach Files" there — ` +
          `or give it "Manage Channels" and it will fix itself automatically.`
      );
    }
  }
  return { ok: report.every((r) => r.ok), channels: report };
}