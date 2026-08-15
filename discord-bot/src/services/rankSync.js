import { supabase } from "../supabase.js";
import { getHighestRank, isOnDuty } from "../ranks.js";

// Called on guildMemberAdd / guildMemberUpdate.
// Syncs the officer's rank + status into the `officers` table automatically.
export async function syncRankToDb(member) {
  const { discordId } = member;
  const rank = getHighestRank(member);
  const status = isOnDuty(member) ? "on-duty" : "off-duty";

  const { data: officer } = await supabase
    .from("officers")
    .select("id, rankId, status, discordName, discordAvatar")
    .eq("discordId", discordId)
    .maybeSingle();

  if (!officer) return { ok: false, reason: "not-linked" };

  const patch = { status };
  if (rank && officer.rankId !== rank.id) patch.rankId = rank.id;
  patch.discordName = member.displayName || member.user.username;
  patch.discordAvatar = member.user.displayAvatarURL?.({ extension: "png" }) || null;

  if (Object.keys(patch).length) {
    await supabase.from("officers").update(patch).eq("id", officer.id);
  }

  return {
    ok: true,
    rankId: rank?.id || officer.rankId,
    status,
  };
}
