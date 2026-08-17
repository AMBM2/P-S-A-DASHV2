import { config } from "../config.js";
import { getGuild } from "./nickname.js";
import { AttachmentBuilder } from "discord.js";
import { loadRoleCategories } from "./roleCategories.js";
import { getHighestRank } from "../ranks.js";

const ESC = "\u001b";

// Exact Discord field-patrol dispatch template: ANSI header + fix headers +
// rank-role mentions. The selected Public Security members are appended next
// to their rank (rankAr + member mention) inside their section so everyone
// knows exactly who was called.
export function buildPatrolPayload(location, officers = [], enlisted = []) {
  const loc = String(location || "").trim();
  const roleMention = (id) => `<@&${id}>`;
  const line = (m) => (m.rankAr ? `${m.rankAr} ` : "") + m.mention;

  const officerRoleMentions = config.patrolOfficerRoleIds.map(roleMention);
  const enlistedRoleMentions = config.patrolEnlistedRoleIds.map(roleMention);
  const officerLines = officers.map(line);
  const enlistedLines = enlisted.map(line);

  return [
    "```ansi",
    `${ESC}[1;30;44m                                              『 ⭐👮🏻 الأمن العام 👮🏻⭐ 』                                                                              ${ESC}[0m`,
    "```",
    "```fix",
    `                                             موقع السيناريو :  (${loc})`,
    "```",
    "```fix",
    `                                  - ⭐👮🏻  رئاســـــــة الــــــوزراء  👮🏻⭐ -`,
    "```",
    "",
    "",
    "",
    "```fix",
    `                                         - ⭐👮🏻  وزراء الداخلية   👮🏻⭐ -`,
    "```",
    "",
    "",
    "",
    "",
    "",
    "```fix",
    `                                       - ⭐👮🏻  قـــادة الأمن العام  👮🏻⭐ -`,
    "```",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "```fix",
    `                                          - ⚔  ضـبـاط الأمن العام  ⚔ - `,
    "```",
    "     ",
    ...officerRoleMentions.flatMap((mention) => [mention, "", ""]),
    ...officerLines.flatMap((l) => [l, ""]),
    "     ",
    "",
    "",
    "",
    "",
    "",
    "",
    "```fix",
    `                                          - ⚔  افـراد الأمن العام  ⚔ -`,
    "```",
    "",
    "",
    ...enlistedRoleMentions.flatMap((mention) => [mention, ""]),
    ...enlistedLines.flatMap((l) => [l, ""]),
  ].join("\n");
}

// Resolve an optional attachment from a direct image URL or base64 data.
async function buildAttachment(payload) {
  if (payload.imageUrl) {
    const url = String(payload.imageUrl).trim();
    if (!/^https?:\/\//i.test(url)) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      return new AttachmentBuilder(buf, { name: payload.imageName || "field-image.jpg" });
    } catch {
      return null;
    }
  }
  if (payload.imageData) {
    try {
      const base64 = String(payload.imageData).replace(/^data:[^;]+;base64,/, "");
      const buf = Buffer.from(base64, "base64");
      return new AttachmentBuilder(buf, { name: payload.imageName || "field-image.png" });
    } catch {
      return null;
    }
  }
  return null;
}

// Field Patrol dispatch: resolve the selected members into officers/enlisted
// (with their ranks), post the fixed template, and attach the field image.
export async function dispatchPatrol(client, payload) {
  const guild = getGuild(client);
  if (!guild) return { ok: false, error: "no-guild" };

  const target =
    (config.patrolChannelId && guild.channels.cache.get(config.patrolChannelId)) ||
    guild.channels.cache.find((c) => c.isTextBased());
  if (!target || !target.isTextBased()) {
    return { ok: false, error: "text-channel-not-found" };
  }

  const location = payload.location || payload.nameAr || payload.name || "";
  const memberIds = Array.isArray(payload.memberIds) ? payload.memberIds : [];

  // Resolve the selected members into officers / enlisted with their ranks.
  const categoryMap = await loadRoleCategories(client);
  const sortRank = (a, b) =>
    (b.rankLevel ?? -1) - (a.rankLevel ?? -1) || a.name.localeCompare(b.name);

  const officers = [];
  const enlisted = [];
  for (const id of memberIds) {
    const member = guild.members.cache.get(id);
    if (!member) continue;

    let cat = null;
    for (const roleId of member.roles.cache.keys()) {
      const c = categoryMap.get(roleId);
      if (c === "officer") {
        cat = "officer";
        break;
      }
      if (c === "enlisted" && !cat) cat = "enlisted";
    }
    if (!cat) continue;

    const rank = getHighestRank(member);
    const entry = {
      id: member.id,
      name: member.displayName || member.user.username,
      mention: `<@${member.id}>`,
      rankAr: rank?.titleAr || "",
      rankLevel: rank?.level ?? -1,
    };
    if (cat === "officer") officers.push(entry);
    else enlisted.push(entry);
  }
  officers.sort(sortRank);
  enlisted.sort(sortRank);

  const content = buildPatrolPayload(location, officers, enlisted);
  const attachment = await buildAttachment(payload);

  try {
    await target.send({ content, files: attachment ? [attachment] : [] });
  } catch (e) {
    return { ok: false, error: e.message };
  }

  return {
    ok: true,
    sentTo: target.id,
    location,
    officers: officers.length,
    enlisted: enlisted.length,
    imageAttached: !!attachment,
  };
}