import { Client, GatewayIntentBits, ActivityType, Events } from "discord.js";
import http from "node:http";
import { config } from "./config.js";
import { startRealtime } from "./listeners/realtime.js";
import { registerGuildListeners } from "./listeners/guild.js";
import { getLivePatrolDetailed } from "./services/patrolLive.js";
import { getGuild } from "./services/nickname.js";
import { findRankByRoleName } from "./ranks.js";
import { expireLeaves } from "./services/leave.js";
import { extractAllMembers } from "./services/members.js";
import { requestLoginCode, verifyLoginCode } from "./services/login.js";
import { dispatchPatrol } from "./services/patrol.js";
import { resolveAccessLevel, bootstrapMaster } from "./services/rbac.js";
import { dischargeMember } from "./services/discharge.js";
import { badgePoolStats } from "./services/badge.js";
import { notifyCollege, enrollCadet } from "./services/college.js";
import { reconcileMemberRoles } from "./services/rolesync.js";
import { supabase } from "./supabase.js";

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

// Never let a single rejected promise / thrown error kill the whole bot.
process.on("unhandledRejection", (e) => console.error("[bot] unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("[bot] uncaughtException:", e));

// HTTP control/health endpoints
const PORT = Number(process.env.PATROL_BOT_PORT || 4000);
http
  .createServer(async (req, res) => {
    try {
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

    // All other endpoints require the shared secret (the portal sends it).
    if (req.headers["x-bot-secret"] !== config.botSecret) {
      return send(401, { ok: false, error: "unauthorized" });
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

    // Debug: list the guild's roles (id / name / position / color / members / rank)
    if (req.method === "GET" && url.pathname === "/roles") {
      const guild = getGuild(client);
      if (!guild) return send(200, { ok: false, error: "no-guild" });
      const roles = guild.roles.cache
        .filter((r) => !r.managed)
        .map((r) => {
          const rank = findRankByRoleName(r.name);
          return {
            id: r.id,
            name: r.name,
            position: r.position,
            color: r.hexColor,
            members: r.members.size,
            rankId: rank?.id || null,
            rankAr: rank?.titleAr || null,
          };
        })
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
          .map((r) => {
            const rank = findRankByRoleName(r.name);
            return {
              id: r.id,
              name: r.name,
              position: r.position,
              color: r.hexColor,
              rankId: rank?.id || null,
              rankAr: rank?.titleAr || null,
            };
          })
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

    // RBAC: resolve a user's access level (master / admin / recruitment / none)
    if (req.method === "POST" && url.pathname === "/auth/level") {
      const { discordId } = await readBody();
      await bootstrapMaster(discordId);
      const data = await resolveAccessLevel(client, discordId);
      return send(200, { ok: true, ...data });
    }

    // RBAC: grant or update an admin entry (master only)
    if (req.method === "POST" && url.pathname === "/admins/upsert") {
      const { discordId, role, note, active } = await readBody();
      const actor = await resolveAccessLevel(client, req.headers["x-bot-actor"] || "");
      if (actor.level !== "master") {
        return send(200, { ok: false, error: "forbidden" });
      }
      if (!["master", "executive", "field", "hr", "personnel", "admin", "recruitment"].includes(role)) {
        return send(200, { ok: false, error: "invalid role" });
      }
      const { data, error } = await supabase
        .from("admins")
        .upsert(
          { userId: discordId, role, note: note || "", active: active !== false },
          { onConflict: "userId" }
        )
        .select("*")
        .single();
      if (error) return send(200, { ok: false, error: error.message });
      return send(200, { ok: true, admin: data });
    }

    // RBAC: remove an admin entry
    if (req.method === "POST" && url.pathname === "/admins/remove") {
      const { discordId } = await readBody();
      const actor = await resolveAccessLevel(client, req.headers["x-bot-actor"] || "");
      if (actor.level !== "master") return send(200, { ok: false, error: "forbidden" });
      await supabase.from("admins").delete().eq("userId", discordId);
      return send(200, { ok: true });
    }

    // Reconcile a member's Discord roles with their portal record (rank change).
// strip=false only ensures the target rank role is present, never removes others.
    if (req.method === "POST" && url.pathname === "/roles-sync") {
      const { discordId, strip } = await readBody();
      const { data: officer } = await supabase
        .from("officers")
        .select("*")
        .eq("discordId", discordId)
        .maybeSingle();
      if (!officer) return send(200, { ok: false, error: "not-linked" });
      const data = await reconcileMemberRoles(client, officer, { strip: strip !== false });
      return send(200, { ok: true, ...data });
    }

    // Discharge an officer: strip ranks/roles, mark record discharged
    if (req.method === "POST" && url.pathname === "/discharge") {
      const { officerId, reason, type, evidence, blacklist, issuer, roleIds } = await readBody();
      const data = await dischargeMember(client, officerId, {
        reason,
        type,
        evidence,
        blacklist: blacklist === true,
        issuer,
        roleIds,
      });
      return send(200, data);
    }

    // Badge code pool statistics (إدارة الأكواد العسكرية)
    if (req.method === "GET" && url.pathname === "/badges") {
      const data = await badgePoolStats();
      return send(200, { ok: true, ...data });
    }

    // Military College notification (new application / approval)
    if (req.method === "POST" && url.pathname === "/recruit") {
      const data = await notifyCollege(client, await readBody());
      return send(200, data);
    }

    // Military College cadet enrollment (approval): assign role + notify
    if (req.method === "POST" && url.pathname === "/cadet/enroll") {
      const data = await enrollCadet(client, await readBody());
      return send(200, data);
    }

    return send(404, { ok: false, error: "not found" });
    } catch (e) {
      console.error("[bot][http] error:", e);
      try {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "internal error" }));
      } catch {}
    }
  })
  .listen(PORT, () => {
    console.log(`[bot] HTTP endpoints: http://localhost:${PORT}/health, /live`);
  });

client.login(config.token);
