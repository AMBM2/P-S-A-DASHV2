import { Client, GatewayIntentBits, EmbedBuilder, ActivityType } from "discord.js";
import dotenv from "dotenv";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const PATROL_CHANNEL_ID = process.env.PATROL_CHANNEL_ID;
const SECRET = process.env.PATROL_BOT_SECRET || "psa-field-secret-2026";
const PORT = Number(process.env.PATROL_BOT_PORT || 4000);

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

if (!TOKEN) {
  console.error("[Bot] MISSING DISCORD_BOT_TOKEN in .env.local");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`[Bot] ✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "جدول الميدان", type: ActivityType.Listening }],
    status: "online",
  });
  console.log(`[Bot] Servers: ${client.guilds.cache.map((g) => g.name).join(", ") || "none"}`);
});

client.on("error", (e) => console.error("[Bot] error:", e.message));

async function dispatch(data) {
  const { roomId, points, name, nameAr, image } = data || {};
  if (!roomId) return { ok: false, error: "roomId مطلوب" };

  const guild = client.guilds.cache.first();
  if (!guild) return { ok: false, error: "لا يوجد سيرفر متاح للبوت" };

  const vc = guild.channels.cache.get(roomId);
  if (!vc || !vc.isVoiceBased()) {
    return { ok: false, error: `القناة الصوتية غير موجودة (${roomId})` };
  }

  const memberIds = [...vc.members.keys()];
  const count = memberIds.length;

  const embed = new EmbedBuilder()
    .setColor(0xd9b45b)
    .setTitle("🚨 تنبيه ميداني — الأمن العام")
    .setDescription(
      `**اسم السيناريو:** ${nameAr || name || "—"}\n**النقاط الممنوحة:** ${points ?? 0}\n**عدد المشاركين:** ${count}`
    )
    .setTimestamp()
    .setFooter({ text: "Field Patrol Dispatch" });
  if (image) embed.setImage(image);

  const mentions = memberIds.map((id) => `<@${id}>`).join(" ");
  const body = mentions ? `${mentions}\n**تنبيه ميداني جديد — يرجى الانتباه**` : "**تنبيه ميداني جديد**";

  let sentTo = null;
  const patrolChannel = PATROL_CHANNEL_ID
    ? guild.channels.cache.get(PATROL_CHANNEL_ID)
    : null;
  if (patrolChannel && patrolChannel.isTextBased()) {
    await patrolChannel.send({ content: body, embeds: [embed] });
    sentTo = patrolChannel.id;
  } else {
    // Fallback: send to the first text channel of the guild
    const fallback = guild.channels.cache.find((c) => c.isTextBased());
    if (fallback) {
      await fallback.send({ content: body, embeds: [embed] });
      sentTo = fallback.id;
    }
  }

  return {
    ok: true,
    memberIds,
    count,
    channelName: vc.name,
    sentTo,
  };
}

// ---------- HTTP control server ----------
const server = http.createServer(async (req, res) => {
  const send = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  if (req.headers["x-bot-secret"] !== SECRET) {
    return send(403, { ok: false, error: "unauthorized" });
  }

  const url = new URL(req.url, "http://localhost");

  if (req.method === "POST" && url.pathname === "/dispatch") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try {
      const data = JSON.parse(raw || "{}");
      const result = await dispatch(data);
      return send(result.ok ? 200 : 400, result);
    } catch (e) {
      return send(500, { ok: false, error: e.message });
    }
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return send(200, {
      ok: true,
      online: client.isReady(),
      guilds: client.guilds.cache.size,
      patrolChannel: PATROL_CHANNEL_ID || null,
    });
  }

  return send(404, { ok: false, error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[Bot] HTTP control listening on http://localhost:${PORT}`);
});

client.login(TOKEN);
