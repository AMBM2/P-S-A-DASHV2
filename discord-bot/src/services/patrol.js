import { config } from "../config.js";
import { getGuild } from "./nickname.js";

const ESC = "\u001b";

// Exact Discord field-patrol dispatch template: ANSI header + fix headers +
// role mentions (officers then enlisted). Only the scenario location is
// injected. The whole template is fixed so it renders identically every time.
export function buildPatrolPayload(location) {
  const loc = String(location || "").trim();
  const roleMention = (id) => `<@&${id}>`;

  const officerMentions = config.patrolOfficerRoleIds.map(roleMention);
  const enlistedMentions = config.patrolEnlistedRoleIds.map(roleMention);

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
    ...officerMentions.flatMap((mention) => [mention, "", ""]),
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
    ...enlistedMentions.flatMap((mention) => [mention, ""]),
  ].join("\n");
}

// Field Patrol dispatch: post the fixed template (with the scenario location)
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
  const content = buildPatrolPayload(location);

  try {
    await target.send({ content });
  } catch (e) {
    return { ok: false, error: e.message };
  }

  return {
    ok: true,
    sentTo: target.id,
    location,
  };
}