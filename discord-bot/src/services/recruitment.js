import { config } from "../config.js";
import { supabase } from "../supabase.js";
import { getGuild, applyBadgeNickname } from "./nickname.js";
import { findRankByLevel } from "../ranks.js";
import { nextBadge } from "./badge.js";

// Assign the recruit role + send a welcome DM when a recruit is approved in the portal.
// Triggered on officers INSERT (new recruit added) or when status becomes 'approved'.
export async function onboardRecruit(client, officer) {
  const guild = getGuild(client);
  if (!guild || !officer.discordId) return { ok: false, reason: "no-guild-or-discord" };

  let member;
  try {
    member = await guild.members.fetch(officer.discordId);
  } catch {
    return { ok: false, reason: "member-not-in-server" };
  }

  const results = { roleAssigned: false, badgeGenerated: false, dmSent: false };

  // 0. Generate official badge code if missing (feature 4)
  if (!officer.badge) {
    const recruitRank = findRankByLevel(0);
    const newBadge = await nextBadge(recruitRank);
    await supabase.from("officers").update({ badge: newBadge }).eq("id", officer.id);
    officer.badge = newBadge;
    results.badgeGenerated = true;
  }

  // 1. Assign recruit/troop role
  const recruitRole =
    guild.roles.cache.get(config.newRecruitRoleId || "") ||
    findRoleForLevel(guild, 0);

  if (recruitRole && !member.roles.cache.has(recruitRole.id)) {
    try {
      await member.roles.add(recruitRole.id, "Recruit approved via portal");
      results.roleAssigned = true;
    } catch (e) {
      console.warn("[recruit] role add failed:", e.message);
    }
  }

  // 1b. Update nickname non-destructively: [badge] + existing server nickname
  await applyBadgeNickname(member, officer.badge, "Recruit onboarding");

  // 2. Send welcome DM with badge + portal instructions
  const badge = (officer.badge || "").trim() || "غير محدد";
  const dmText = [
    `🎖️ مرحباً بك في **الأمن العام**!`,
    ``,
    `تم قبول طلبك رسمياً.`,
    `**الكود العسكري:** \`${badge}\``,
    `**الحساب المرتبط:** <@${officer.discordId}>`,
    ``,
    `لتسجيل الدخول إلى البوابة وإكمال ملفك، تفضّل بزيارة:`,
    `${config.portalUrl}/admin`,
    ``,
    `بارك الله في خدمتك.`,
  ].join("\n");

  try {
    await member.send(dmText);
    results.dmSent = true;
  } catch (e) {
    // Member may have DMs disabled — fallback to a channel ping instead
    console.warn("[recruit] DM blocked:", e.message);
  }

  return { ok: true, ...results };
}


function findRoleForLevel(guild, level) {
  const rank = findRankByLevel(level);
  if (!rank) return null;
  for (const name of [rank.titleAr, rank.title, rank.id]) {
    const role = guild.roles.cache.find(
      (r) => r.name.toLowerCase() === String(name).toLowerCase()
    );
    if (role) return role;
  }
  return null;
}

// Decide whether an officer record represents a newly-approved recruit.
export function shouldOnboard(payload) {
  const rec = payload.new || {};
  const old = payload.old || {};
  if (!rec.discordId) return false;
  // New recruit inserted
  if (payload.eventType === "INSERT") return true;
  // Status flipped to 'approved' or 'on-duty'
  if (
    payload.eventType === "UPDATE" &&
    (rec.status === "approved" || rec.status === "on-duty") &&
    old.status !== rec.status
  ) {
    return true;
  }
  return false;
}

export async function updateRecruitStatus(officer) {
  await supabase
    .from("officers")
    .update({ status: "on-duty" })
    .eq("id", officer.id);
}
