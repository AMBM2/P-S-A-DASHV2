import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireGrants } from "@/lib/admin-gate";
import { requirePermission, PERMS } from "@/lib/permissions";
import { requireActor } from "@/lib/auth";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/csrf";
import { cleanString } from "@/lib/sanitize";
import { auditLog } from "@/lib/audit";
import { nextBadgeServer } from "@/lib/badge";

// Review an application: approve -> cadet enrolled at the Military College
// (assign recruit role + notify via bot), deny -> cadet dropped.
export async function POST(req: Request) {
  try {
    if (checkOrigin(req)) {
      return NextResponse.json({ ok: false, error: "invalid origin" }, { status: 403 });
    }
    if (!rateLimit(req, { limit: 60, windowMs: 60_000 })) return tooMany();

    const body = await req.json();
    const applicationId = cleanString(body?.applicationId, 64);
    const decision = cleanString(body?.decision, 16);
    const claimed = cleanString(body?.reviewedBy, 40);

    // SECURITY: identity comes from the server-verified session cookie, NOT the
    // client-supplied body. A body actor that mismatches the cookie is rejected.
    const gate = await requireActor(req, claimed || undefined);
    if (gate instanceof NextResponse) return gate;
    const reviewedBy = gate.actor;

    // Caller must be HR/Executive/Master (category) OR a RECRUITMENT_ADMIN delegate.
    const grantsGate = await requireGrants(reviewedBy, ["hr", "executive", "master"]);
    const permGate = await requirePermission(reviewedBy, PERMS.RECRUITMENT_ADMIN);
    if (grantsGate instanceof NextResponse && permGate instanceof NextResponse) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    if (!applicationId || !["approved", "denied"].includes(decision)) {
      return NextResponse.json({ ok: false, error: "معاملات غير صالحة" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: app } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();
    if (!app) return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });

    await supabase
      .from("applications")
      .update({ status: decision, reviewedBy: reviewedBy || null })
      .eq("id", applicationId)
      .then(() => {});

    const cadetStatus = decision === "approved" ? "enrolled" : "discharged";
    const { data: cadet } = await supabase
      .from("cadets")
      .update({ status: cadetStatus })
      .eq("applicationId", applicationId)
      .select("*")
      .single();

    await auditLog({
      action: decision === "approved" ? "recruitment.approved" : "recruitment.denied",
      actionAr: decision === "approved" ? "قبول طلب توظيف" : "رفض طلب توظيف",
      executor: reviewedBy || "",
      target: app.discordId || app.id,
      targetName: app.nameAr || app.name || "",
      metadata: { applicationId, recruiterId: reviewedBy || "", applicantId: app.discordId || "" },
    });

    // Notify the Military College channel + grant the selected rank roles +
    // official member role + nickname with the badge code ([PSA-XXXX] Name).
    if (decision === "approved" && cadet) {
      const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
      const badge = await nextBadgeServer();
      try {
        await fetch(`${botUrl}/cadet/enroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
          },
          body: JSON.stringify({ ...cadet, badge, ranks: app.ranks || [] }),
          cache: "no-store",
        });
      } catch {
        // realtime notify still applies; best-effort here
      }
    }

    return NextResponse.json({ ok: true, status: decision, cadet });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}