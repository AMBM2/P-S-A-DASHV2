import { supabase } from "../supabase.js";
import { config } from "../config.js";

export async function requestLoginCode(client, rawUserId) {
  const userId = String(rawUserId || "").trim();
  if (!/^\d{15,20}$/.test(userId)) {
    return { ok: false, error: "معرّف ديسكورد غير صالح" };
  }

  let member = null;
  const guild = client.guilds.cache.get(config.guildId);
  if (guild) {
    member = await guild.members.fetch(userId).catch(() => null);
  }
  if (!member) {
    return { ok: false, error: "المستخدم ليس عضواً في سيرفر الأمن العام" };
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  await supabase.from("login_codes").delete().eq("userId", userId).then(() => {});
  await supabase.from("login_codes").insert({ userId, code, expiresAt, used: false }).then(() => {});

  try {
    await member.send({
      content: `🔐 رمز تسجيل الدخول إلى بوابة الأمن العام:\n**${code}**\nالرمز صالح لمدة 5 دقائق.`,
    });
  } catch {
    return { ok: false, error: "تعذر إرسال الرسالة الخاصة — افتح الخاص للبوت (Allow direct messages)" };
  }

  return { ok: true };
}

export async function verifyLoginCode(rawUserId, rawCode) {
  const userId = String(rawUserId || "").trim();
  const code = String(rawCode || "").trim();

  const { data, error } = await supabase
    .from("login_codes")
    .select("*")
    .eq("userId", userId)
    .eq("code", code)
    .eq("used", false)
    .maybeSingle();
  if (error || !data) {
    return { ok: false, error: "الرمز غير صحيح" };
  }
  if (new Date(data.expiresAt).getTime() < Date.now()) {
    return { ok: false, error: "انتهت صلاحية الرمز — اطلب رمزاً جديداً" };
  }

  await supabase.from("login_codes").update({ used: true }).eq("id", data.id).then(() => {});

  const { data: officer } = await supabase
    .from("officers")
    .select("*")
    .eq("discordId", userId)
    .maybeSingle();

  return { ok: true, officer: officer || null };
}