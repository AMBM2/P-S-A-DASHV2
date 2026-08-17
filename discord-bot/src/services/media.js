import crypto from "node:crypto";
import { AttachmentBuilder } from "discord.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";

// One-time, short-lived upload tokens. The portal asks the bot for a token
// (authenticated with the shared secret), hands it to the browser, and the
// browser uploads the file directly to the bot. This avoids routing 100MB
// files through Vercel's function body limit.
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB — video cap the user asked for
const TOKEN_TTL_MS = 5 * 60 * 1000;
const uploadTokens = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [token, rec] of uploadTokens) {
    if (rec.expiresAt < now) uploadTokens.delete(token);
  }
}, 60 * 1000);

function sanitizeFilename(name) {
  const base = String(name || "").replace(/[^\w.\-\u0600-\u06FF]+/g, "_").slice(0, 120);
  return base || "news-media.bin";
}

// Issue a one-time token bound to a filename. Secret-checked endpoint only.
export function createUploadToken({ filename, contentType }) {
  const token = crypto.randomBytes(24).toString("hex");
  uploadTokens.set(token, {
    filename: sanitizeFilename(filename),
    contentType: String(contentType || "application/octet-stream").slice(0, 128),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

// Receive the raw file body from the browser and post it to the news channel
// (falls back to the patrol channel), returning the permanent Discord URL.
export async function receiveMediaUpload(client, token, rawBuffer) {
  const rec = token && uploadTokens.get(token);
  if (!rec) return { ok: false, reason: "invalid-token" };
  uploadTokens.delete(token); // one-time use
  if (rec.expiresAt < Date.now()) return { ok: false, reason: "token-expired" };

  if (!Buffer.isBuffer(rawBuffer) || rawBuffer.length === 0) {
    return { ok: false, reason: "empty-body" };
  }
  if (rawBuffer.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: `file-too-large (${(rawBuffer.length / 1024 / 1024).toFixed(1)}MB — الحد الأقصى 100MB)`,
    };
  }

  const guild = getGuild(client);
  if (!guild) return { ok: false, reason: "no-guild" };

  const channel =
    (config.newsChannelId && guild.channels.cache.get(config.newsChannelId)) ||
    (config.patrolChannelId && guild.channels.cache.get(config.patrolChannelId)) ||
    guild.channels.cache.find((c) => c.isTextBased && c.isTextBased());
  if (!channel) return { ok: false, reason: "no-channel" };

  const file = new AttachmentBuilder(rawBuffer, { name: rec.filename });
  try {
    const msg = await channel.send({ content: `📰 مرفق أخبار الأمن العام — ${rec.filename}`, files: [file] });
    const url = msg.attachments.first()?.url;
    if (!url) return { ok: false, reason: "no-url" };
    return { ok: true, url, channelId: channel.id };
  } catch (e) {
    console.warn(`[media] upload failed on channel ${channel.id} -> ${e.message}`);
    return { ok: false, reason: e.message };
  }
}
