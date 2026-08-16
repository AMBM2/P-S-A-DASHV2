import { config } from "../config.js";
import { getGuild } from "./nickname.js";

const ESC = "\u001b";

// Exact Discord dispatch payload: ANSI header + fix blocks + officer/enlisted
// role pings. The website only collects the location; all the rich formatting
// lives here and is never rendered on the portal UI.
export function buildPatrolPayload(location) {
  const loc = String(location || "").trim();
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
    "                                                  - ⚔  ضـبـاط الأمن العام  ⚔ -",
    "```",
    "<@&1527321852266021005>",
    "",
    "<@&1527321853247492158>",
    "",
    "<@&1527321854023565433>",
    "",
    "<@&1527321854857969774>",
    "",
    "<@&1527321855667736586>",
    "",
    "<@&1527321856581832855>",
    "",
    "<@&1527321857445990550>",
    "",
    "<@&1527321858263748788>",
    "",
    "",
    "",
    "```fix",
    "                                                  - ⚔  افـراد الأمن العام  ⚔ -",
    "```",
    "<@&1527321813325971577>",
  ].join("\n");
}

// Field Patrol dispatch: build the rich ANSI/fix payload and post it to the
// dedicated PATROL_CHANNEL_ID (fallback: first text channel).
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

  return { ok: true, sentTo: target.id, location };
}