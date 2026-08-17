import { config } from "../config.js";
import { getGuild } from "./nickname.js";
import { scanVoiceRoom } from "./roleCategories.js";

const ESC = "\u001b";

const PLACEHOLDER_OFFICERS = "لا يوجد ضباط متواجدين حالياً";
const PLACEHOLDER_ENLISTED = "لا يوجد افراد متواجدين حالياً";

// Exact Discord dispatch payload: ANSI header + fix blocks + live user mentions.
// The website only collects the location; all the rich formatting and the
// autonomous voice-room sorting live here and are never rendered on the UI.
export function buildPatrolPayload(location, officers = [], enlisted = []) {
  const loc = String(location || "").trim();
  const officerList = officers.length
    ? officers.map((m) => m.mention).join("\n")
    : PLACEHOLDER_OFFICERS;
  const enlistedList = enlisted.length
    ? enlisted.map((m) => m.mention).join("\n")
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

// Field Patrol dispatch: scan the configured voice room, sort connected members
// by their roles into officers/enlisted, then post the rich payload to the
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

  // Autonomous voice-room scan + role sorting (officers / enlisted).
  const scan = await scanVoiceRoom(client);
  const officers = scan.ok ? scan.officers : [];
  const enlisted = scan.ok ? scan.enlisted : [];

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
    room: scan.ok ? { id: scan.roomId, name: scan.roomName, total: scan.total } : null,
    officers: officers.length,
    enlisted: enlisted.length,
  };
}