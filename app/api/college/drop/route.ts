import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Drop a cadet from the Military College (keeps the record, strips roles if the
// cadet already graduated into an officer record).
export async function POST(req: Request) {
  try {
    const { cadetId } = await req.json();
    if (!cadetId) {
      return NextResponse.json({ ok: false, error: "cadetId مطلوب" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: cadet } = await supabase
      .from("cadets")
      .select("*")
      .eq("id", cadetId)
      .maybeSingle();
    if (!cadet) return NextResponse.json({ ok: false, error: "الطالب غير موجود" }, { status: 404 });

    await supabase
      .from("cadets")
      .update({ status: "discharged" })
      .eq("id", cadetId)
      .then(() => {});

    if (cadet.officerId) {
      const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
      try {
        await fetch(`${botUrl}/discharge`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-bot-secret": process.env.PATROL_BOT_SECRET || "",
          },
          body: JSON.stringify({ officerId: cadet.officerId, reason: "Dropped from Military College" }),
          cache: "no-store",
        });
      } catch {
        // best-effort
      }
    }

    return NextResponse.json({ ok: true, status: "discharged" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error" }, { status: 500 });
  }
}