import { supabase } from "../supabase.js";
import { getGuild } from "./nickname.js";
import { config } from "../config.js";

// Feature 7: Automated LOA / Leave & Protection System.
// Applies / removes the On-Leave role + status when leave is approved/revoked/expired.
export async function applyLeave(client, officer, leave) {
  const guild = getGuild(client);
  const roleId = config.onLeaveRoleId;
  if (!guild || !roleId || !officer.discordId) {
    return { ok: false, reason: "missing-role-or-guild" };
  }

  let member;
  try {
    member = await guild.members.fetch(officer.discordId);
  } catch {
    return { ok: false, reason: "member-not-in-server" };
  }

  const role = guild.roles.cache.get(roleId);
  if (!role) return { ok: false, reason: "role-not-found" };

  if (leave.status === "approved") {
    if (!member.roles.cache.has(role.id) && member.manageable) {
      await member.roles.add(role.id, "Leave approved");
    }
    // Protect officer from patrol/inactivity kicks
    await supabase
      .from("officers")
      .update({ status: "leave" })
      .eq("id", officer.id);
    return { ok: true, action: "granted" };
  }

  // denied / revoked / expired -> remove leave role + restore on-duty
  if (member.roles.cache.has(role.id) && member.manageable) {
    await member.roles.remove(role.id, "Leave ended / revoked");
  }
  await supabase
    .from("officers")
    .update({ status: "on-duty" })
    .eq("id", officer.id);
  return { ok: true, action: "removed" };
}

// Called by a scheduler/periodic check: expire leaves whose endDate has passed.
export async function expireLeaves(client) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: leaves } = await supabase
    .from("leave_requests")
    .select("*")
    .in("status", ["approved"])
    .lt("endDate", today);

  for (const leave of leaves || []) {
    const { data: officer } = await supabase
      .from("officers")
      .select("*")
      .eq("id", leave.officerId)
      .maybeSingle();
    if (!officer) continue;
    leave.status = "revoked"; // mark expired
    await applyLeave(client, officer, leave);
    await supabase
      .from("leave_requests")
      .update({ status: "revoked" })
      .eq("id", leave.id);
    console.log(`[leave] expired for ${officer.discordId}`);
  }
}
