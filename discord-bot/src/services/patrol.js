import { config } from "../config.js";
import { getGuild } from "./nickname.js";
import { loadRoleCategories } from "./roleCategories.js";
import { getHighestRank } from "../ranks.js";

const ESC = "\u001b";

const PLACEHOLDER_OFFICERS = "لا يوجد ضباط متواجدين حالياً";
const PLACEHOLDER_ENLISTED = "لا يوجد افراد متواجدين حالياً";

// Exact Discord dispatch payload: ANSI header + fix blocks + live user mentions.
// The website only collects the location; all the rich formatting and the
// autonomous voice-room sorting live here and are never rendered on the UI.
export function buildPatrolPayload(location, officers = [], enlisted = []) {
  const loc = String(location || "").trim();
  const line = (m) => (m.rankAr ? `${m.rankAr} ` : "") + m.mention;
  const officerList = officers.length
    ? officers.map(line).join("\n")
    : PLACEHOLDER_OFFICERS;
  const enlistedList = enlisted.length
    ? enlisted.map(line).join("\n")
    : PLACEHOLDER_ENLISTED;

  return [
    "```ansi",
    `${ESC}[1;30;44m                                                『 ⭐👮🏻 الأمن العام 👮🏻⭐ 』                                                                        ${ESC}[0m`,
    "```",
    "```fix",
    `                                               موقع السيناريو :  (${loc})`,
    "```",
    "```fix",
    "                                                 - ⭐👮🏻  رئاســـــــة الــــــوزراء  👮🏻⭐ -",
    "```",
    "```fix",
    "                                                  - ⭐👮🏻  وزراء الداخلية   👮🏻⭐ -",
    "```",
    "```fix",
    "                                                 - ⭐👮🏻  قـــادة الأمن العام  👮🏻⭐ -",
    "```",
    "```fix",
    "                                                  - ⚔  ضـبـاط الأمن العام المتواجدين  ⚔ -",
    "```",
    officerList,
    "",
    "```fix",
    "                                                  - ⚔  افـراد الأمن العام المتواجدين  ⚔ -",
    "```",
    enlistedList,
  ].join("\n");
}

// Field Patrol dispatch: mention the selected Public Security members (by ID)
// sorted into officers/enlisted with their ranks, then post the rich payload
// to the dedicated PATROL_CHANNEL_ID (fallback: first text channel).
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

  try {
    await target.send({ content });
  } catch (e) {
    return { ok: false, error: e.message };
  }

  return {
    ok: true,
    sentTo: target.id,
    location,
    officers: officers.length,
    enlisted: enlisted.length,
  };
}