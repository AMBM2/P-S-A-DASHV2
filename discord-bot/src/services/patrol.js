import { config } from "../config.js";
import { getGuild } from "./nickname.js";
import { AttachmentBuilder } from "discord.js";
import { loadRoleCategories } from "./roleCategories.js";
import { getHighestRank, getHighestRankRole, findRankByRoleName } from "../ranks.js";

const ESC = "\u001b";

// Group members by their rank role, ordered by the highest rank level first.
function groupByRank(entries) {
  const map = new Map();
  for (const e of entries) {
    const key = e.rankRoleId || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  return [...map.entries()].sort((a, b) => {
    const la = Math.max(...a[1].map((e) => e.rankLevel ?? -1));
    const lb = Math.max(...b[1].map((e) => e.rankLevel ?? -1));
    return lb - la;
  });
}

// One template section: the fix header, then each rank-role mention with the
// member mentions placed directly underneath their rank.
function rankSection(header, entries) {
  const lines = ["```fix", header, "```"];
  for (const [roleId, members] of groupByRank(entries)) {
    if (roleId) lines.push(`<@&${roleId}>`);
    for (const m of members) lines.push(m.mention);
    lines.push("");
  }
  return lines;
}

// Officer tier by rank level (from ranks.js):
//   command 24+ → القيادة العليا  | 22-23 → وزراء الحكومة
//   17-21 → القادة | 11-16 → ضباط | else → أفراد
const OFFICER_TIERS = [
  { key: "command", levelMin: 24, header: `                                        - ⭐👮🏻  القيــادة العليــا  👮🏻⭐ -` },
  { key: "ministers", levelMin: 22, header: `                                         - ⭐👮🏻  وزراء الحكومة   👮🏻⭐ -` },
  { key: "leaders", levelMin: 17, header: `                                       - ⭐👮🏻  قـــادة الأمن العام  👮🏻⭐ -` },
  { key: "officers", levelMin: 11, header: `                                          - ⚔  ضـبـاط الأمن العام  ⚔ - ` },
];

// Exact Discord field-patrol dispatch template: ANSI header + fix headers.
// Selected members are placed under their own tier header (رئاسة الوزراء /
// وزراء الداخلية / القادة / ضباط / أفراد) and listed under their rank-role
// mention — tiers are never merged together.
export function buildPatrolPayload(location, officers = [], enlisted = []) {
  const loc = String(location || "").trim();

  // Ensure each member appears under exactly one tier (highest applicable).
  let placed = new Set();
  const tierEntries = (tier) => {
    const list = [];
    for (const o of officers) {
      if (o.rankLevel >= tier.levelMin && !placed.has(o.id)) {
        placed.add(o.id);
        list.push(o);
      }
    }
    return list;
  };

  const sections = [];
  for (const tier of OFFICER_TIERS) {
    const members = tierEntries(tier);
    sections.push(...rankSection(tier.header, members));
  }
  sections.push(...rankSection(`                                          - ⚔  افـراد الأمن العام  ⚔ -`, enlisted));

  return [
    "```ansi",
    `${ESC}[1;30;44m                                              『 ⭐👮🏻 الأمن العام 👮🏻⭐ 』                                                                              ${ESC}[0m`,
    "```",
    "```fix",
    `                                             موقع السيناريو :  (${loc})`,
    "```",
    ...sections,
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

// Field Patrol dispatch: resolve the selected members into officers/enlisted,
// list each under their rank-role mention, post the template, attach the image.
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

  // Resolve the selected members into officers / enlisted with their rank role.
  const categoryMap = await loadRoleCategories(client);
  const officers = [];
  const enlisted = [];
  for (const id of memberIds) {
    const member = guild.members.cache.get(id);
    if (!member) continue;

    // Category is driven by the member's HIGHEST military rank (not just the
    // first matching role in cache order), so a member holding both an officer
    // and an enlisted role is always placed under their highest rank tier.
    let cat = null;
    const rank = getHighestRank(member);
    if (rank && (rank.division === "command" || rank.division === "officer")) cat = "officer";
    else if (rank && rank.division === "troop") cat = "enlisted";
    if (!cat) {
      for (const roleId of member.roles.cache.keys()) {
        const c = categoryMap.get(roleId);
        if (c === "officer") {
          cat = "officer";
          break;
        }
        if (c === "enlisted" && !cat) cat = "enlisted";
      }
    }
    if (!cat) continue;

    const rankRole = getHighestRankRole(member);
    const entry = {
      id: member.id,
      name: member.displayName || member.user.username,
      mention: `<@${member.id}>`,
      rankRoleId: rankRole?.id || "",
      rankLevel: rankRole?.name ? (findRankByRoleName(rankRole.name)?.level ?? -1) : -1,
    };
    if (cat === "officer") officers.push(entry);
    else enlisted.push(entry);
  }

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