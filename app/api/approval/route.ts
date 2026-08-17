import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { auditLog } from "@/lib/audit";

// Review an application: approve -> cadet enrolled at the Military College
// (assign recruit role + notify via bot), deny -> cadet dropped.
export async function POST(req: Request) {
  try {
    const { applicationId, decision, reviewedBy } = await req.json();
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

    // Notify the Military College channel + grant the selected rank roles.
    if (decision === "approved" && cadet) {
      const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
      try {
        await fetch(`${botUrl}/cadet/enroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
          },
          body: JSON.stringify({ ...cadet, ranks: app.ranks || [] }),
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