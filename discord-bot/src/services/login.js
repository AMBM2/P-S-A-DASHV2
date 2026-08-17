import { supabase } from "../supabase.js";
import { config } from "../config.js";
import { resolveAccessLevel } from "./rbac.js";

// Admin-panel login via Discord User ID + one-time DM code.
// Locked: only users holding a grant (master / executive / field / hr /
// personnel — via the admins table or the configured category Discord roles)
// may request a code. Everyone else is rejected before any code is generated.

// In-memory fallback for codes when the login_codes table is unavailable.
const memoryCodes = new Map();

// Brute-force guard: cap code requests and verification attempts per user.
const requestCalls = new Map(); // userId -> timestamps
const attemptCalls = new Map(); // userId -> timestamps

function withinLimit(map, key, limit, windowMs) {
  const now = Date.now();
  const arr = (map.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    map.set(key, arr);
    return false;
  }
  arr.push(now);
  map.set(key, arr);
  return true;
}

export async function requestLoginCode(client, rawUserId) {
  const userId = String(rawUserId || "").trim();
  if (!/^\d{15,20}$/.test(userId)) {
    return { ok: false, error: "معرّف ديسكورد غير صالح" };
  }
  // Anti-abuse: max 3 code requests per user per 5 minutes.
  if (!withinLimit(requestCalls, userId, 3, 5 * 60 * 1000)) {
    return { ok: false, error: "طلبات كثيرة جداً — انتظر 5 دقائق ثم حاول" };
  }

  let member = null;
  const guild = client.guilds.cache.get(config.guildId);
  if (guild) {
    member = await guild.members.fetch(userId).catch(() => null);
  }
  if (!member) {
    return { ok: false, error: "المستخدم ليس عضواً في سيرفر الأمن العام" };
  }

  // Locked login: only users with an admin grant may request a code.
  const access = await resolveAccessLevel(client, userId);
  if (access.level === "none") {
    return { ok: false, error: "ليس لديك صلاحية دخول لوحة التحكم" };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Store the code — DB first, memory as fallback.
  const del = await supabase.from("login_codes").delete().eq("userId", userId);
  const ins = await supabase.from("login_codes").insert({ userId, code, expiresAt, used: false });
  if (del.error || ins.error) {
    memoryCodes.set(userId, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  }

  // Deliver the code — prefer DM; fall back to a text channel mention.
  try {
    await member.send({
      content: `🔐 رمز تسجيل الدخول إلى بوابة الأمن العام:\n**${code}**\nالرمز صالح لمدة 5 دقائق.`,
    });
    return { ok: true, via: "dm" };
  } catch {
    const target =
      (config.loginChannelId && guild.channels.cache.get(config.loginChannelId)) ||
      (config.patrolChannelId && guild.channels.cache.get(config.patrolChannelId)) ||
      guild.channels.cache.find((c) => c.isTextBased());
    if (target && target.isTextBased()) {
      await target.send({
        content: `🔐 رمز دخول لوحة التحكم لـ <@${userId}>:\n**${code}**\nالرمز صالح لمدة 5 دقائق.`,
      });
      return { ok: true, via: "channel", channel: target.id };
    }
    return {
      ok: false,
      error: "تعذر إرسال الرمز في الخاص — افتح الخاص للبوت أو حدد LOGIN_CHANNEL_ID في إعدادات البوت",
    };
  }
}

export async function verifyLoginCode(client, rawUserId, rawCode) {
  const userId = String(rawUserId || "").trim();
  const code = String(rawCode || "").trim();

  // Brute-force guard: max 8 verification attempts per user per 5 minutes.
  if (!withinLimit(attemptCalls, userId, 8, 5 * 60 * 1000)) {
    return { ok: false, error: "محاولات كثيرة — انتظر 5 دقائق ثم اطلب رمزاً جديداً" };
  }

  let dbRes = null;
  const { data } = await supabase
    .from("login_codes")
    .select("*")
    .eq("userId", userId)
    .eq("code", code)
    .eq("used", false)
    .maybeSingle();
  dbRes = data || null;

  if (dbRes) {
    if (new Date(dbRes.expiresAt).getTime() < Date.now()) {
      return { ok: false, error: "انتهت صلاحية الرمز — اطلب رمزاً جديداً" };
    }
    try {
      await supabase.from("login_codes").update({ used: true }).eq("id", dbRes.id);
    } catch {}
  } else {
    const mem = memoryCodes.get(userId);
    if (!mem || mem.code !== code) {
      return { ok: false, error: "الرمز غير صحيح" };
    }
    if (mem.expiresAt < Date.now()) {
      memoryCodes.delete(userId);
      return { ok: false, error: "انتهت صلاحية الرمز — اطلب رمزاً جديداً" };
    }
    memoryCodes.delete(userId);
  }

  // Re-check access at verify time (defense in depth — a revoked admin loses
  // access immediately, even with a valid unused code).
  const access = await resolveAccessLevel(client, userId);
  if (access.level === "none") {
    return { ok: false, error: "ليس لديك صلاحية دخول لوحة التحكم" };
  }

  const { data: officer } = await supabase
    .from("officers")
    .select("*")
    .eq("discordId", userId)
    .maybeSingle();

  return { ok: true, officer: officer || null };
}