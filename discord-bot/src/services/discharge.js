import { supabase } from "../supabase.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";
import { findRankByRoleName } from "../ranks.js";

// Compute the set of Discord role IDs that correspond to military ranks.
function rankRoleIds(guild) {
  const ids = new Set();
  for (const role of guild.roles.cache.values()) {
    if (findRankByRoleName(role.name)) ids.add(role.id);
  }
  return ids;
}

// Strip every military/recruit role from a member and mark the record discharged.
export async function dischargeMember(client, officerId, reason, issuer) {
  let officer;
  try {
    const { data, error } = await supabase
      .from("officers")
      .select("*")
      .eq("id", officerId)
      .maybeSingle();
    if (error || !data) return { ok: false, reason: "officer-not-found" };
    officer = data;
  } catch (e) {
    return { ok: false, reason: e.message };
  }

  const guild = getGuild(client);
  const results = { rolesRemoved: 0, nickCleared: false };

  if (guild && officer.discordId) {
    try {
      const member = await guild.members.fetch(officer.discordId);
      const military = rankRoleIds(guild);
      const extra = [
        config.recruitmentRoleId,
        config.newRecruitRoleId,
        config.onLeaveRoleId,
        config.suspensionRoleId,
        config.strikeWarningRoleId,
      ].filter(Boolean);

      for (const roleId of member.roles.cache.keys()) {
        if (military.has(roleId) || extra.includes(roleId)) {
          try {
            if (member.manageable) {
              await member.roles.remove(roleId, `Discharged${reason ? `: ${reason}` : ""}`);
              results.rolesRemoved++;
            }
          } catch {
            // role removal failed — continue with the rest
          }
        }
      }

      try {
        if (member.manageable) {
          await member.setNickname(null, "Discharged");
          results.nickCleared = true;
        }
      } catch {}
    } catch {
      // member not in server — roles already gone by definition
    }
  }

  try {
    await supabase
      .from("officers")
      .update({
        status: "discharged",
        dischargedAt: new Date().toISOString(),
        dischargedBy: issuer || null,
      })
      .eq("id", officer.id);
  } catch (e) {
    return { ok: false, reason: `db-update-failed: ${e.message}` };
  }

  return { ok: true, officerId: officer.id, discordId: officer.discordId, ...results };
}