import { supabase } from "../supabase.js";
import { config } from "../config.js";
import { getGuild } from "./nickname.js";
import { findRankByRoleName } from "../ranks.js";

export const DISCHARGE_TYPES = [
  "honorary",
  "dishonorable",
  "inactivity",
  "administrative",
];

// Compute the set of Discord role IDs that correspond to military ranks.
function rankRoleIds(guild) {
  const ids = new Set();
  for (const role of guild.roles.cache.values()) {
    if (findRankByRoleName(role.name)) ids.add(role.id);
  }
  return ids;
}

// Discharge an officer. `opts`:
//   reason     — discharge reason (mandatory)
//   type       — discharge type (honorary / dishonorable / inactivity / administrative)
//   evidence   — details / evidence links
//   blacklist  — also add the member to the blacklist (prevents re-application)
//   issuer     — Discord ID of the admin who performed the discharge
//   roleIds    — optional explicit list of Discord roles to remove; when absent,
//                EVERY official military / functional role is stripped.
export async function dischargeMember(client, officerId, opts = {}) {
  const {
    reason = "",
    type = "",
    evidence = "",
    blacklist = false,
    issuer = null,
    roleIds = null,
  } = opts;

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
  const results = { rolesRemoved: 0, nickCleared: false, blacklisted: false };

  if (guild && officer.discordId) {
    try {
      const member = await guild.members.fetch(officer.discordId);
      const toRemove = [];
      if (Array.isArray(roleIds) && roleIds.length) {
        for (const roleId of roleIds) {
          if (member.roles.cache.has(roleId)) toRemove.push(roleId);
        }
      } else {
        const military = rankRoleIds(guild);
        const extra = [
          config.recruitmentRoleId,
          config.newRecruitRoleId,
          config.onLeaveRoleId,
          config.suspensionRoleId,
          config.strikeWarningRoleId,
        ].filter(Boolean);
        for (const roleId of member.roles.cache.keys()) {
          if (military.has(roleId) || extra.includes(roleId)) toRemove.push(roleId);
        }
      }

      for (const roleId of toRemove) {
        try {
          if (member.manageable) {
            await member.roles.remove(roleId, `Discharged${reason ? `: ${reason}` : ""}`);
            results.rolesRemoved++;
          }
        } catch {
          // role removal failed — continue with the rest
        }
      }

      // Mark the member's nickname: [مفصول] FullName (badge code stripped).
      try {
        if (member.manageable) {
          const name = officer.nameAr || officer.name || "";
          const nick = name ? `[مفصول] ${name}` : null;
          await member.setNickname(nick, "Discharged");
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
        dischargeType: type || null,
        dischargedAt: new Date().toISOString(),
        dischargedBy: issuer || null,
      })
      .eq("id", officer.id);
  } catch (e) {
    return { ok: false, reason: `db-update-failed: ${e.message}` };
  }

  // Blacklist integration — prevents future recruitment re-applications.
  if (blacklist && officer.discordId) {
    try {
      await supabase.from("blacklist").upsert(
        {
          discordId: officer.discordId,
          reason: `${type} — ${reason || ""}`.trim(),
          addedBy: issuer || null,
        },
        { onConflict: "discordId" }
      );
      results.blacklisted = true;
    } catch (e) {
      results.blacklistError = e.message;
    }
  }

  // Audit log of the discharge.
  try {
    await supabase.from("discharges").insert({
      officerId: officer.id,
      discordId: officer.discordId || null,
      name: officer.nameAr || officer.name || "",
      type: type || "",
      reason: reason || "",
      evidence: evidence || "",
      blacklisted: blacklist,
      dischargedBy: issuer || null,
    });
  } catch {
    // log table missing — best effort
  }

  return { ok: true, officerId: officer.id, discordId: officer.discordId, ...results };
}