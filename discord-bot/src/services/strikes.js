import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { config } from "../config.js";

// Feature 8: Discipline & Strike Warning System.
// On a new strike row:
//  - DM the officer with reason / issuer / total strikes
//  - apply threshold actions (warning role @ 1-2, suspension/demote @ 3+)
export async function handleStrike(client, strike) {
  const guild = getGuild(client);
  if (!guild || !strike.discordId) return { ok: false, reason: "no-guild-or-discord" };

  const { count: total } = await supabase
    .from("strikes")
    .select("id", { count: "exact", head: true })
    .eq("discordId", strike.discordId)
    .eq("status", "active");

  let member;
  try {
    member = await guild.members.fetch(strike.discordId);
  } catch {
    return { ok: false, reason: "member-not-in-server" };
  }

  // 1. Official DM
  const dm = [
    `⚠️ **إنذار وظيفي رسمي — الأمن العام**`,
    ``,
    `**السبب:** ${strike.reason || "غير محدد"}`,
    `**صادر عن:** ${strike.issuer || "القيادة"}`,
    `**إجمالي الإنذارات:** ${total}`,
    ``,
    `يرجى مراجعة قيادتك بخصوص هذا الإنذار.`,
  ].join("\n");
  try {
    await member.send(dm);
  } catch (e) {
    console.warn("[strike] DM blocked:", e.message);
  }

  // 2. Threshold actions
  const actions = [];
  const warningRole = config.strikeWarningRoleId
    ? guild.roles.cache.get(config.strikeWarningRoleId)
    : null;
  const suspendRole = config.suspensionRoleId
    ? guild.roles.cache.get(config.suspensionRoleId)
    : null;

  if (member.manageable) {
    if (total <= 2) {
      // Assign warning role
      if (warningRole && !member.roles.cache.has(warningRole.id)) {
        await member.roles.add(warningRole.id, `Strike warning (${total})`);
        actions.push("warning-role");
      }
    } else {
      // 3+ strikes: suspension / demote
      if (suspendRole && !member.roles.cache.has(suspendRole.id)) {
        await member.roles.add(suspendRole.id, "Disciplinary suspension (3+ strikes)");
        actions.push("suspension-role");
      }
      // Strip command roles
      const stripped = [];
      for (const role of member.roles.cache.values()) {
        if ([config.adminRoleId, config.commandRoleId].includes(role.id)) {
          await member.roles.remove(role.id, "Disciplinary action (3+ strikes)");
          stripped.push(role.name);
        }
      }
      if (stripped.length) actions.push(`stripped:${stripped.join(",")}`);
    }
  }

  return { ok: true, total, actions };
}
