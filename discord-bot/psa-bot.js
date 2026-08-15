#!/usr/bin/env node
/**
 * ============================================================================
 *  PSA — DISCORD BOT (نسخة ملف واحد — واحدة)
 *  اشغّله في سيرفرك:  node psa-bot.js
 *  يحتاج Node.js 18+  وتثبيت:  npm i discord.js @supabase/supabase-js dotenv
 *  متغيرات البيئة في ملف .env (أو كمتغيرات نظام) — انظر نهاية الملف
 * ============================================================================
 */
import { Client, GatewayIntentBits, EmbedBuilder, ActivityType, Events } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import http from "node:http";

try { await import("dotenv/config"); } catch {}

/* ============================ 1) الإعدادات ============================ */
const cfg = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  supabaseUrl: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  patrolChannelId: process.env.PATROL_CHANNEL_ID,
  recruitmentRoleId: process.env.RECRUITMENT_ROLE_ID,
  newRecruitRoleId: process.env.NEW_RECRUIT_ROLE_ID,
  onLeaveRoleId: process.env.ON_LEAVE_ROLE_ID,
  strikeWarningRoleId: process.env.STRIKE_WARNING_ROLE_ID,
  suspensionRoleId: process.env.SUSPENSION_ROLE_ID,
  adminRoleId: process.env.ADMIN_ROLE_ID,
  commandRoleId: process.env.COMMAND_ROLE_ID,
  voiceRoomIds: (process.env.VOICE_ROOM_IDS || "").split(",").map((s) => s.trim()).filter(Boolean),
  portalUrl: process.env.PORTAL_URL || "http://localhost:3001",
  port: Number(process.env.PATROL_BOT_PORT || 4000),
};
for (const k of ["token", "supabaseUrl", "key"]) {
  if (!cfg[k]) { console.error(`[x] مفتاح ناقص: ${k} — املأ .env`); process.exit(1); }
}

/* ============================ 2) سوبابيز + ريلتايم ============================ */
const supabase = createClient(cfg.supabaseUrl, cfg.key, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 10 } },
});
const dbChannel = supabase.channel("psa-db-changes");
function onTable(table, cb) { dbChannel.on("postgres_changes", { event: "*", schema: "public", table }, cb); }

/* ============================ 3) هرم الرتب ============================ */
const RANKS = [
  { id: "r-pm", title: "Prime Minister", titleAr: "رئيس الوزراء", level: 26, division: "command" },
  { id: "r-vpm", title: "Deputy Prime Minister", titleAr: "نائب رئيس الوزراء", level: 25, division: "command" },
  { id: "r-pmadv", title: "Advisor to the PM", titleAr: "مستشار رئيس الوزراء", level: 24, division: "command" },
  { id: "r-minister", title: "Minister of Interior", titleAr: "وزير الداخلية", level: 23, division: "command" },
  { id: "r-vminister", title: "Deputy Minister of Interior", titleAr: "نائب وزير الداخلية", level: 22, division: "command" },
  { id: "r-dir", title: "Director of Public Security", titleAr: "مدير الأمن العام", level: 21, division: "command" },
  { id: "r-dirdep", title: "Deputy Director", titleAr: "نائب مدير الأمن العام", level: 20, division: "command" },
  { id: "r-lgen", title: "Lieutenant General", titleAr: "فريق أول", level: 19, division: "officer" },
  { id: "r-mgen", title: "Major General", titleAr: "لواء", level: 18, division: "officer" },
  { id: "r-brig", title: "Brigadier", titleAr: "عميد", level: 17, division: "officer" },
  { id: "r-col", title: "Colonel", titleAr: "عقيد", level: 16, division: "officer" },
  { id: "r-ltcol", title: "Lieutenant Colonel", titleAr: "مقدم", level: 15, division: "officer" },
  { id: "r-major", title: "Major", titleAr: "رائد", level: 14, division: "officer" },
  { id: "r-capt", title: "Captain", titleAr: "نقيب", level: 13, division: "officer" },
  { id: "r-1lt", title: "First Lieutenant", titleAr: "ملازم أول", level: 12, division: "officer" },
  { id: "r-lt", title: "Lieutenant", titleAr: "ملازم", level: 11, division: "officer" },
  { id: "r-msg", title: "Master Sergeant", titleAr: "رقيب أول", level: 10, division: "troop" },
  { id: "r-sfc", title: "Sergeant First Class", titleAr: "رقيب أول", level: 9, division: "troop" },
  { id: "r-sgt", title: "Sergeant", titleAr: "رقيب", level: 8, division: "troop" },
  { id: "r-lcpl", title: "Lance Corporal", titleAr: "عريف", level: 7, division: "troop" },
  { id: "r-cpl", title: "Corporal", titleAr: "وكيل رقيب", level: 6, division: "troop" },
  { id: "r-pfc", title: "Private First Class", titleAr: "جندي أول", level: 5, division: "troop" },
  { id: "r-pvt", title: "Private", titleAr: "جندي", level: 4, division: "troop" },
  { id: "r-tr4", title: "Lance Corporal Trainee", titleAr: "عريف متدرب", level: 3, division: "training" },
  { id: "r-tr3", title: "Corporal Trainee", titleAr: "وكيل رقيب متدرب", level: 2, division: "training" },
  { id: "r-tr2", title: "Private First Class Trainee", titleAr: "جندي أول متدرب", level: 1, division: "training" },
  { id: "r-tr1", title: "Recruit Trainee", titleAr: "جندي متدرب", level: 0, division: "training" },
];
const rankById = (id) => RANKS.find((r) => r.id === id);
const DUTY = ["on-duty", "on duty", "متاح", "ميدان", "field", "active"];
const findRankByRoleName = (n) => {
  if (!n) return null; n = n.toLowerCase(); let best = null;
  for (const r of RANKS) for (const s of [r.id, r.title, r.titleAr]) {
    if (String(s).toLowerCase() === n && (!best || r.level > best.level)) best = r;
  }
  return best;
};
const getHighestRank = (m) => { let b = null; for (const r of m.roles.cache.values()) { const x = findRankByRoleName(r.name); if (x && (!b || x.level > b.level)) b = x; } return b; };
const isOnDuty = (m) => m.roles.cache.map((r) => r.name.toLowerCase()).some((n) => DUTY.some((d) => n.includes(d)));
const findRoleByRank = (guild, rank) => { for (const n of [rank.titleAr, rank.title, rank.id]) { const r = guild.roles.cache.find((x) => x.name.toLowerCase() === String(n).toLowerCase()); if (r) return r; } return null; };

/* ============================ 4) نظام الأكواد العسكرية ============================ */
const BADGE_POOLS = [
  { rankId: "r-brig", start: 0, count: 5 },   // عميد C-0..4
  { rankId: "r-col", start: 5, count: 5 },    // عقيد C-5..9
  { rankId: "r-ltcol", start: 10, count: 7 }, // مقدم C-10..16
  { rankId: "r-major", start: 17, count: 8 }, // رائد C-17..24
  { rankId: "r-capt", start: 25, count: 10 }, // نقيب C-25..34
  { rankId: "r-1lt", start: 35, count: 20 },  // ملازم أول C-35..54
  { rankId: "r-lt", start: 55, count: 30 },   // ملازم C-55..84
];
const POOL_PREFIX = "C";
const PREFIX_BY_DIV = { command: "A", officer: "C", troop: "D", training: "R" };
const allBadges = async () => (await supabase.from("officers").select("badge")).data?.map((o) => String(o.badge || "")) || [];
async function nextBadge(rank) {
  const pool = BADGE_POOLS.find((p) => p.rankId === rank?.id);
  const badges = await allBadges();
  if (pool) {
    const end = pool.start + pool.count - 1; const taken = new Set();
    for (const b of badges) { const m = b.match(/^C-(\d+)$/); if (m) { const n = +m[1]; if (n >= pool.start && n <= end) taken.add(n); } }
    for (let n = pool.start; n <= end; n++) if (!taken.has(n)) return `${POOL_PREFIX}-${n}`;
    return null;
  }
  const prefix = PREFIX_BY_DIV[rank?.division] || "A";
  let max = 0; for (const b of badges) { const m = b.match(new RegExp(`^${prefix}-(\\d+)$`)); if (m) max = Math.max(max, +m[1]); }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
const matchesPool = (badge, rank) => {
  const pool = BADGE_POOLS.find((p) => p.rankId === rank?.id);
  if (pool) { const m = String(badge || "").match(/^C-(\d+)$/); if (!m) return false; const n = +m[1]; return n >= pool.start && n <= pool.start + pool.count - 1; }
  return badgePrefix(badge) === (PREFIX_BY_DIV[rank?.division] || "A");
};
const badgePrefix = (b) => { const m = String(b || "").match(/^([A-Za-z]+)-\d+$/); return m ? m[1].toUpperCase() : ""; };
const buildNickname = (o) => { const b = (o.badge || "").trim(); const n = (o.nameAr || o.name || "").trim(); return b ? `[${b}] ${n}` : n; };

/* ============================ 5) أدوات ============================ */
const getGuild = (client) => (cfg.guildId && client.guilds.cache.get(cfg.guildId)) || client.guilds.cache.first() || null;
async function syncNickname(client, officer) {
  const g = getGuild(client); if (!g || !officer.discordId) return { ok: false };
  let m; try { m = await g.members.fetch(officer.discordId); } catch { return { ok: false }; }
  if (!m.manageable) return { ok: false };
  const nick = buildNickname(officer);
  if (m.nickname === nick) return { ok: true, changed: false };
  try { await m.setNickname(nick, "Sync from portal"); return { ok: true, changed: true, nick }; } catch { return { ok: false }; }
}

/* ============================ 6) سحب الأعضاء والرولات ============================ */
async function upsertOfficerFromMember(member) {
  const rank = getHighestRank(member); const status = isOnDuty(member) ? "on-duty" : "off-duty";
  const nameAr = member.displayName || member.user.username;
  const base = { discordId: member.id, discordName: member.displayName || member.user.username, discordAvatar: member.user.displayAvatarURL?.({ extension: "png" }) || null, rankId: rank?.id || "r-tr1", status };
  const { data: existing } = await supabase.from("officers").select("id").eq("discordId", member.id).maybeSingle();
  if (existing) {
    const cur = await supabase.from("officers").select("badge").eq("id", existing.id).maybeSingle();
    const patch = { ...base }; if (!cur?.badge) patch.badge = await nextBadge(rank || rankById("r-tr1"));
    await supabase.from("officers").update(patch).eq("id", existing.id);
    return { officerId: existing.id, created: false };
  }
  const badge = await nextBadge(rank || rankById("r-tr1"));
  const { data: created } = await supabase.from("officers").insert({
    badge, name: member.user.username, nameAr, callsign: "", discordId: member.id,
    discordName: member.displayName || member.user.username, discordAvatar: member.user.displayAvatarURL?.({ extension: "png" }) || null,
    rankId: rank?.id || "r-tr1", departmentId: "d-hq", status, specialization: [], medals: [],
    joinedAt: member.joinedAt?.toISOString() || new Date().toISOString(),
    activityHours: 0, performance: 0, threats: 0, medicalClear: false,
  }).select("id").single();
  return { officerId: created?.id, created: true };
}
async function extractAllMembers(client) {
  const g = getGuild(client); if (!g) return { ok: false, error: "no-guild" };
  let rolesSynced = 0;
  for (const role of g.roles.cache.values()) {
    if (role.managed) continue;
    const rank = getHighestRank({ roles: { cache: new Map([[role.id, role]]) } });
    const rec = { roleId: role.id, name: role.name, nameAr: rank?.titleAr || role.name, type: rank ? "rank" : "functional", rankId: rank?.id || null, level: rank?.level || 0, color: role.hexColor || null, permissions: { position: role.position } };
    const ex = await supabase.from("roles").select("id").eq("roleId", role.id).maybeSingle();
    if (ex) await supabase.from("roles").update(rec).eq("roleId", role.id); else await supabase.from("roles").insert(rec);
    rolesSynced++;
  }
  const members = await g.members.fetch(); let created = 0, updated = 0, bots = 0;
  for (const m of members.values()) { if (m.user.bot) { bots++; continue; } const r = await upsertOfficerFromMember(m); r.created ? created++ : updated++; }
  return { ok: true, rolesSynced, membersTotal: members.size, created, updated, skippedBots: bots };
}

/* ============================ 7) التوظيف ============================ */
async function onboardRecruit(client, officer) {
  const g = getGuild(client); if (!g || !officer.discordId) return { ok: false };
  let m; try { m = await g.members.fetch(officer.discordId); } catch { return { ok: false }; }
  const res = { roleAssigned: false, badgeGenerated: false, dmSent: false };
  if (!officer.badge) { const b = await nextBadge(rankById("r-tr1")); await supabase.from("officers").update({ badge: b }).eq("id", officer.id); officer.badge = b; res.badgeGenerated = true; }
  const role = g.roles.cache.get(cfg.newRecruitRoleId || "") || findRoleByRank(g, rankById("r-tr1"));
  if (role && !m.roles.cache.has(role.id)) { try { await m.roles.add(role.id, "Recruit approved"); res.roleAssigned = true; } catch {} }
  try { const nick = buildNickname(officer); if (m.nickname !== nick && m.manageable) await m.setNickname(nick, "Onboarding"); } catch {}
  const badge = (officer.badge || "").trim() || "غير محدد";
  try { await m.send(`🎖️ مرحباً بك في **الأمن العام**!\nتم قبولك رسمياً.\n**الكود:** \`${badge}\`\nالرابط: ${cfg.portalUrl}/admin\nبارك الله في خدمتك.`); res.dmSent = true; } catch {}
  return { ok: true, ...res };
}
const shouldOnboard = (p) => {
  const rec = p.new || {}, old = p.old || {};
  if (!rec.discordId) return false;
  if (p.eventType === "INSERT") return true;
  return p.eventType === "UPDATE" && (rec.status === "approved" || rec.status === "on-duty") && old.status !== rec.status;
};

/* ============================ 8) الترقية الذكية ============================ */
async function handlePromotion(client, officer, prevRankId) {
  const g = getGuild(client); if (!g || !officer.discordId) return { ok: false };
  const newRank = rankById(officer.rankId); if (!newRank) return { ok: false };
  let m; try { m = await g.members.fetch(officer.discordId); } catch { return { ok: false }; }
  const res = { badgeChanged: false, roleChanged: false };
  if (!matchesPool(officer.badge, newRank)) { const nb = await nextBadge(newRank); await supabase.from("officers").update({ badge: nb }).eq("id", officer.id); officer.badge = nb; res.badgeChanged = true; }
  const newRole = findRoleByRank(g, newRank); const oldRank = prevRankId ? rankById(prevRankId) : null; const oldRole = oldRank ? findRoleByRank(g, oldRank) : null;
  if (newRole && m.manageable) { if (oldRole && oldRole.id !== newRole.id && m.roles.cache.has(oldRole.id)) { try { await m.roles.remove(oldRole.id, "Promotion"); } catch {} } if (!m.roles.cache.has(newRole.id)) { try { await m.roles.add(newRole.id, "Promotion"); } catch {} } res.roleChanged = true; }
  try { const nick = buildNickname(officer); if (m.nickname !== nick && m.manageable) await m.setNickname(nick, "Promotion"); } catch {}
  return { ok: true, ...res };
}

/* ============================ 9) جدول الميدان + النقاط ============================ */
async function dispatchPatrol(client, patrol) {
  const g = getGuild(client); if (!g) return { ok: false, error: "no-guild" };
  const vc = patrol.roomId ? g.channels.cache.get(patrol.roomId) : null;
  if (!vc || !vc.isVoiceBased()) return { ok: false, error: `voice-not-found:${patrol.roomId}` };
  const memberIds = [...vc.members.keys()]; const count = memberIds.length; const points = Number(patrol.points) || 0;
  const embed = new EmbedBuilder().setColor(0xd9b45b).setTitle("🚨 تنبيه ميداني — الأمن العام")
    .setDescription(`**السيناريو:** ${patrol.nameAr || patrol.name || "—"}\n**النقاط:** ${points}\n**المشاركون:** ${count}`)
    .setTimestamp().setFooter({ text: "Field Patrol Dispatch" });
  if (patrol.image) embed.setImage(patrol.image);
  const body = memberIds.length ? `${memberIds.map((i) => `<@${i}>`).join(" ")}\n**تنبيه ميداني جديد**` : "**تنبيه ميداني جديد**";
  const target = (cfg.patrolChannelId && g.channels.cache.get(cfg.patrolChannelId)) || g.channels.cache.find((c) => c.isTextBased());
  let sentTo = null; if (target && target.isTextBased()) { await target.send({ content: body, embeds: [embed] }); sentTo = target.id; }
  let awarded = 0;
  if (memberIds.length && points > 0) { const { data: offs } = await supabase.from("officers").select("id, fieldPoints").in("discordId", memberIds); for (const o of offs || []) { await supabase.from("officers").update({ fieldPoints: (o.fieldPoints || 0) + points }).eq("id", o.id); awarded++; } }
  await supabase.from("patrols").update({ participants: memberIds, participantCount: count, status: "dispatched" }).eq("id", patrol.id);
  return { ok: true, count, awarded, sentTo };
}

/* ============================ 10) الحضور الحي ============================ */
async function getLivePatrolDetailed(client) {
  const g = getGuild(client); if (!g) return { ok: false, rooms: [] };
  const rooms = [];
  for (const vc of g.channels.cache.filter((c) => c.isVoiceBased()).values()) {
    rooms.push({ roomId: vc.id, name: vc.name, count: vc.members.size, members: [...vc.members.values()].map((m) => ({ discordId: m.id, username: m.displayName || m.user.username, avatar: m.user.displayAvatarURL?.({ extension: "png" }) || null })) });
  }
  const ids = rooms.flatMap((r) => r.members.map((m) => m.discordId));
  const { data: offs } = ids.length ? await supabase.from("officers").select("*").in("discordId", ids) : { data: [] };
  const byId = new Map((offs || []).map((o) => [o.discordId, o]));
  return { ok: true, timestamp: new Date().toISOString(), rooms: rooms.map((r) => ({ ...r, members: r.members.map((m) => ({ ...m, officer: byId.get(m.discordId) || null })) })) };
}

/* ============================ 11) الإجازات ============================ */
async function applyLeave(client, officer, leave) {
  const g = getGuild(client); const roleId = cfg.onLeaveRoleId;
  if (!g || !roleId || !officer.discordId) return { ok: false };
  let m; try { m = await g.members.fetch(officer.discordId); } catch { return { ok: false }; }
  const role = g.roles.cache.get(roleId); if (!role) return { ok: false };
  if (leave.status === "approved") { if (!m.roles.cache.has(role.id) && m.manageable) { try { await m.roles.add(role.id, "Leave approved"); } catch {} } await supabase.from("officers").update({ status: "leave" }).eq("id", officer.id); return { ok: true, action: "granted" }; }
  if (m.roles.cache.has(role.id) && m.manageable) { try { await m.roles.remove(role.id, "Leave ended"); } catch {} }
  await supabase.from("officers").update({ status: "on-duty" }).eq("id", officer.id); return { ok: true, action: "removed" };
}
async function expireLeaves(client) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: leaves } = await supabase.from("leave_requests").select("*").in("status", ["approved"]).lt("endDate", today);
  for (const l of leaves || []) { const { data: o } = await supabase.from("officers").select("*").eq("id", l.officerId).maybeSingle(); if (!o) continue; l.status = "revoked"; await applyLeave(client, o, l); await supabase.from("leave_requests").update({ status: "revoked" }).eq("id", l.id); }
}

/* ============================ 12) الإنذارات ============================ */
async function handleStrike(client, strike) {
  const g = getGuild(client); if (!g || !strike.discordId) return { ok: false };
  const { count: total } = await supabase.from("strikes").select("id", { count: "exact", head: true }).eq("discordId", strike.discordId).eq("status", "active");
  let m; try { m = await g.members.fetch(strike.discordId); } catch { return { ok: false }; }
  try { await m.send(`⚠️ **إنذار وظيفي رسمي — الأمن العام**\nالسبب: ${strike.reason || "غير محدد"}\nصادر عن: ${strike.issuer || "القيادة"}\nإجمالي الإنذارات: ${total}\nيرجى مراجعة قيادتك.`); } catch {}
  const actions = []; const warnRole = cfg.strikeWarningRoleId ? g.roles.cache.get(cfg.strikeWarningRoleId) : null; const susRole = cfg.suspensionRoleId ? g.roles.cache.get(cfg.suspensionRoleId) : null;
  if (m.manageable) {
    if (total <= 2) { if (warnRole && !m.roles.cache.has(warnRole.id)) { try { await m.roles.add(warnRole.id, `Strike warning`); actions.push("warning"); } catch {} } }
    else { if (susRole && !m.roles.cache.has(susRole.id)) { try { await m.roles.add(susRole.id, "Suspension"); actions.push("suspension"); } catch {} } for (const role of m.roles.cache.values()) { if ([cfg.adminRoleId, cfg.commandRoleId].includes(role.id)) { try { await m.roles.remove(role.id, "Discipline"); actions.push("strip:" + role.name); } catch {} } } }
  }
  return { ok: true, total, actions };
}

/* ============================ 13) البوت + المستمعون ============================ */
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences] });

client.once(Events.ClientReady, (c) => {
  console.log(`[✔] البوت يعمل: ${c.user.tag} (${c.user.id}) — السيرفرات: ${c.guilds.cache.size}`);
  c.user.setPresence({ activities: [{ name: "الأمن العام", type: ActivityType.Watching }], status: "online" });
  dbChannel.subscribe((s) => console.log(`[realtime] الحالة: ${s}`));
  setInterval(() => expireLeaves(c).catch(() => {}), 60 * 60 * 1000);
  try { extractAllMembers(c).then((r) => console.log(`[sync-بدء] رولات=${r.rolesSynced} أنشئ=${r.created} حدّث=${r.updated}`)).catch((e) => console.error(e.message)); } catch {}
});
client.on(Events.Error, (e) => console.error("[خطأ]", e.message));

// مستمعي ديسكورد
client.on("guildMemberAdd", async (m) => { if (!m.user.bot) { const r = await upsertOfficerFromMember(m); console.log(`[ديسكورد] انضم ${m.user.tag} -> ${r.created ? "أنشئ" : "حدّث"}`); } });
client.on("guildMemberUpdate", async (o, n) => { if (n.user.bot) return; const rc = !o.roles.cache.equals(n.roles.cache); if (rc) { const r = await upsertOfficerFromMember(n); console.log(`[ديسكورد] رتبة ${n.user.tag} -> ${r.ok === false ? "" : "محدّثة"}`); } });
client.on("guildMemberRemove", async (m) => { if (!m.user.bot) await supabase.from("officers").update({ status: "off-duty" }).eq("discordId", m.id); });

// مستمعي ريلتايم (من الموقع)
onTable("officers", async (p) => {
  const rec = p.new || {}, old = p.old || {};
  if (rec.discordId) { const r = await syncNickname(client, rec); if (r.ok && r.changed) console.log(`[نيك] ${r.nick}`); }
  if (p.eventType === "UPDATE" && rec.rankId && old.rankId && rec.rankId !== old.rankId) { const r = await handlePromotion(client, rec, old.rankId); console.log("[ترقية]", r); }
  if (shouldOnboard(p)) { const r = await onboardRecruit(client, rec); console.log("[توظيف]", r); }
  if (p.eventType === "UPDATE" && (rec.status === "leave" || old.status === "leave")) await applyLeave(client, rec, { status: rec.status === "leave" ? "approved" : "revoked" });
});
onTable("patrols", async (p) => { if (p.eventType === "INSERT") { const r = await dispatchPatrol(client, p.new); console.log(r.ok ? `[ميدان] ${r.count} مشارك، ${r.awarded} نقطة` : `[ميدان] فشل ${r.error}`); } });
onTable("strikes", async (p) => { if (p.eventType === "INSERT") console.log("[إنذار]", await handleStrike(client, p.new)); });
onTable("leave_requests", async (p) => { if (p.eventType === "UPDATE" && ["approved", "denied", "revoked"].includes(p.new?.status)) { const { data: o } = await supabase.from("officers").select("*").eq("id", p.new.officerId).maybeSingle(); if (o) await applyLeave(client, o, p.new); } });

/* ============================ 14) خادم HTTP (تحكم + صحة) ============================ */
http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost"); const send = (c, o) => { res.writeHead(c, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.method === "GET" && url.pathname === "/health") return send(200, { ok: true, online: client.isReady(), guilds: client.guilds.cache.size, user: client.user?.tag || null, uptime: Math.round(process.uptime()) });
  if (req.method === "GET" && url.pathname === "/live") return send(200, await getLivePatrolDetailed(client));
  if (req.method === "POST" && url.pathname === "/sync") return send(200, await extractAllMembers(client));
  return send(404, { ok: false, error: "not found" });
}).listen(cfg.port, () => console.log(`[HTTP] المنفذ ${cfg.port}: /health  /live  /sync`));

client.login(cfg.token).catch((e) => console.error("[x] فشل الدخول:", e.message));

/* ============================ 15) مثال ملف .env ============================
DISCORD_BOT_TOKEN=رمز_البوت
DISCORD_CLIENT_ID=معرف_التطبيق
DISCORD_GUILD_ID=معرف_السيرفر
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=مفتاح_الخدمة
PATROL_CHANNEL_ID=معرف_قناة_التنبيه
NEW_RECRUIT_ROLE_ID=معرف_رتبة_المستجد
ON_LEAVE_ROLE_ID=معرف_رتبة_الإجازة
STRIKE_WARNING_ROLE_ID=معرف_رتبة_الإنذار
SUSPENSION_ROLE_ID=معرف_رتبة_الإيقاف
ADMIN_ROLE_ID=معرف_رتبة_المدير
COMMAND_ROLE_ID=معرف_رتبة_القيادة
PORTAL_URL=http://localhost:3001
PATROL_BOT_PORT=4000
*/
