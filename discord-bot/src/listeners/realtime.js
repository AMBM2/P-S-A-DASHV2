import { onTable, supabase, subscribeAll } from "../supabase.js";
import { syncNickname } from "../services/nickname.js";
import { dispatchPatrol } from "../services/patrol.js";
import { onboardRecruit, shouldOnboard } from "../services/recruitment.js";
import { handlePromotion } from "../services/promotion.js";
import { applyLeave } from "../services/leave.js";
import { handleStrike } from "../services/strikes.js";
import { notifyCollege } from "../services/college.js";
import { dischargeMember } from "../services/discharge.js";

// Listens to Supabase Realtime across all bot tables.
export function startRealtime(client) {
  // ---- officers: nickname sync + promotion + leave ----
  onTable("officers", async (payload) => {
    const rec = payload.new || {};
    const old = payload.old || {};

    // 1. Realtime nickname sync (feature 2)
    if (rec.discordId) {
      const res = await syncNickname(client, rec);
      if (res.ok && res.changed) {
        console.log(`[nickname] ${rec.nameAr || rec.name} -> "${res.nick}"`);
      }
    }

    // 2. Smart promotion (feature 3) — rank changed via portal
    if (
      payload.eventType === "UPDATE" &&
      rec.rankId &&
      old.rankId &&
      rec.rankId !== old.rankId
    ) {
      const res = await handlePromotion(client, rec, old.rankId);
      console.log("[promo] result:", res);
    }

    // 3. Recruitment onboarding (feature 4)
    if (shouldOnboard(payload)) {
      const res = await onboardRecruit(client, rec);
      console.log("[recruit] onboard result:", res);
    }

    // 4. Direct leave-status change (feature 7)
    if (
      payload.eventType === "UPDATE" &&
      (rec.status === "leave" || old.status === "leave")
    ) {
      const res = await applyLeave(client, rec, { status: rec.status === "leave" ? "approved" : "revoked" });
      console.log("[leave] status-change result:", res);
    }

    // 5. Discharge (defense in depth) — strip roles when marked discharged
    if (
      payload.eventType === "UPDATE" &&
      rec.status === "discharged" &&
      old.status !== "discharged"
    ) {
      const res = await dischargeMember(client, rec.id, {
        reason: old.dischargeReason || "Marked discharged via portal",
        type: old.dischargeType || "",
        blacklist: false,
      });
      console.log("[discharge] realtime result:", res);
    }
  });

  // ---- applications: Military College notifications (feature 12) ----
  onTable("applications", async (payload) => {
    if (payload.eventType !== "INSERT") return;
    const res = await notifyCollege(client, payload.new);
    console.log(
      res.ok
        ? `[college] notified channel ${res.channelId} for ${payload.new.nameAr || payload.new.name}`
        : `[college] notify failed: ${res.reason}`
    );
  });

  // ---- patrols: field patrol dispatch (feature 6) ----
  onTable("patrols", async (payload) => {
    if (payload.eventType !== "INSERT") return;
    const res = await dispatchPatrol(client, payload.new);
    console.log(
      res.ok
        ? `[patrol] dispatched: ${res.count} participants -> channel ${res.sentTo}`
        : `[patrol] failed: ${res.error}`
    );
  });

  // ---- strikes: discipline & warnings (feature 8) ----
  onTable("strikes", async (payload) => {
    if (payload.eventType !== "INSERT") return;
    const res = await handleStrike(client, payload.new);
    console.log("[strike] result:", res);
  });

  // ---- leave_requests: LOA approvals (feature 7) ----
  onTable("leave_requests", async (payload) => {
    if (payload.eventType !== "UPDATE") return;
    const rec = payload.new || {};
    if (["approved", "denied", "revoked"].includes(rec.status)) {
      const { data: officer } = await supabase
        .from("officers")
        .select("*")
        .eq("id", rec.officerId)
        .maybeSingle();
      if (officer) {
        const res = await applyLeave(client, officer, rec);
        console.log("[leave] request result:", res);
      }
    }
  });

  // Subscribe once after all listeners are registered
  subscribeAll();
}
