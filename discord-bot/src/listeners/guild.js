import { extractMember, extractAllMembers } from "../services/members.js";
import { syncProfileToDb } from "../services/nickname.js";

// Discord guild events (feature 1: member & role extractor)
export function registerGuildListeners(client) {
  client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) return;
    const res = await extractMember(member);
    console.log(
      `[guild] joined ${member.user.tag} -> ${res.ok ? "synced" : res.reason}`
    );
  });

  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.user.bot) return;

    const rolesChanged = !oldMember.roles.cache.equals(newMember.roles.cache);
    const nickChanged = oldMember.nickname !== newMember.nickname;

    if (rolesChanged) {
      const res = await extractMember(newMember);
      if (res.ok) {
        console.log(
          `[rank] ${newMember.user.tag} -> ${res.rankId || "none"} (${res.status})`
        );
      }
    }

    if (nickChanged && newMember.displayName) {
      await syncProfileToDb(
        newMember.id,
        newMember.displayName,
        newMember.user.displayAvatarURL?.({ extension: "png" }) || null
      );
    }
  });

  client.on("guildMemberRemove", async (member) => {
    if (member.user.bot) return;
    const { supabase } = await import("../supabase.js");
    await supabase
      .from("officers")
      .update({ status: "off-duty" })
      .eq("discordId", member.id);
    console.log(`[guild] left ${member.user.tag}`);
  });

  // Ready hook: run a full extraction on startup
  client.once("ready", async () => {
    try {
      const res = await extractAllMembers(client);
      console.log(
        `[extract] roles=${res.rolesSynced} members=${res.membersFetched} linked=${res.linked}`
      );
    } catch (e) {
      console.warn("[extract] failed:", e.message);
    }
  });
}
