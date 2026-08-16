import { Client, GatewayIntentBits, ActivityType, Events } from "discord.js";
import http from "node:http";
import { config } from "./config.js";
import { startRealtime } from "./listeners/realtime.js";
import { registerGuildListeners } from "./listeners/guild.js";
import { getLivePatrolDetailed } from "./services/patrolLive.js";
import { getGuild } from "./services/nickname.js";
import { expireLeaves } from "./services/leave.js";
import { extractAllMembers } from "./services/members.js";
import { requestLoginCode, verifyLoginCode } from "./services/login.js";
import { dispatchPatrol } from "./services/patrol.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,    // Server Members Intent (privileged)
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,   // Message Content Intent (privileged)
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,  // Presence Intent (privileged)
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`[bot] ✅ Logged in as ${c.user.tag} (${c.user.id})`);
  c.user.setPresence({
    activities: [{ name: "الأمن العام", type: ActivityType.Watching }],
    status: "online",
  });

  startRealtime(c);
  registerGuildListeners(c);

  console.log(`[bot] Servers: ${c.guilds.cache.size}`);

  // Periodic: expire approved leaves whose end date has passed (feature 7)
  setInterval(() => {
    expireLeaves(c).catch((e) => console.warn("[leave] expiry:", e.message));
  }, 60 * 60 * 1000);
});

client.on(Events.Error, (e) => console.error("[bot] error:", e.message));

// HTTP control/health endpoints
const PORT = Number(process.env.PATROL_BOT_PORT || 4000);
http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const send = (code, obj) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    const readBody = () =>
      new Promise((resolve) => {
        let b = "";
        req.on("data", (c) => (b += c));
        req.on("end", () => {
          try {
            resolve(JSON.parse(b || "{}"));
          } catch {
            resolve({});
          }
        });
      });

    if (req.method === "GET" && url.pathname === "/health") {
      return send(200, {
        ok: true,
        online: client.isReady(),
        guilds: client.guilds.cache.size,
        guildId: config.guildId || null,
        user: client.user?.tag || null,
        uptime: Math.round(process.uptime()),
      });
    }

    // Live patrol room tracking (feature 6) — consumed by the portal dashboard
    if (req.method === "GET" && url.pathname === "/live") {
      const data = await getLivePatrolDetailed(client);
      return send(200, data);
    }

    // Full sync: pull all Discord roles + members into the site
    if (req.method === "POST" && url.pathname === "/sync") {
      const data = await extractAllMembers(client);
      return send(200, data);
    }

    // Field patrol dispatch (direct HTTP — no DB table required)
    if (req.method === "POST" && url.pathname === "/dispatch") {
      const body = await readBody();
      const data = await dispatchPatrol(client, body);
      return send(200, data);
    }

    // Debug: list the guild's roles (id / name / position / color / members)
    if (req.method === "GET" && url.pathname === "/roles") {
      const guild = getGuild(client);
      if (!guild) return send(200, { ok: false, error: "no-guild" });
      const roles = guild.roles.cache
        .filter((r) => !r.managed)
        .map((r) => ({
          id: r.id,
          name: r.name,
          position: r.position,
          color: r.hexColor,
          members: r.members.size,
        }))
        .sort((a, b) => b.position - a.position);
      return send(200, { ok: true, guild: guild.name, count: roles.length, roles });
    }

    // Lookup: a guild member's roles + matched military ranks (for الاستعلام)
    if (req.method === "GET" && url.pathname.startsWith("/member/")) {
      const userId = url.pathname.slice("/member/".length);
      const guild = getGuild(client);
      if (!guild) return send(200, { ok: false, error: "no-guild" });
      try {
        const member = await guild.members.fetch(userId);
        const roles = member.roles.cache
          .filter((r) => r.id !== guild.id && !r.managed)
          .map((r) => ({
            id: r.id,
            name: r.name,
            position: r.position,
            color: r.hexColor,
          }))
          .sort((a, b) => b.position - a.position);
        return send(200, {
          ok: true,
          found: true,
          user: { id: member.id, username: member.user.username, globalName: member.user.globalName },
          nickname: member.displayName || null,
          roles,
        });
      } catch {
        return send(200, { ok: true, found: false });
      }
    }

    // Admin login: send a one-time code to the user's Discord DM
    if (req.method === "POST" && url.pathname === "/login/request") {
      const { userId } = await readBody();
      const data = await requestLoginCode(client, userId);
      return send(200, data);
    }

    // Admin login: verify the code the user received in DM
    if (req.method === "POST" && url.pathname === "/login/verify") {
      const { userId, code } = await readBody();
      const data = await verifyLoginCode(userId, code);
      return send(200, data);
    }

    return send(404, { ok: false, error: "not found" });
  })
  .listen(PORT, () => {
    console.log(`[bot] HTTP endpoints: http://localhost:${PORT}/health, /live`);
  });

client.login(config.token);
