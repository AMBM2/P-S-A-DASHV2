import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Military College entrance exam questions. Rows are stored with a legacy
// `choices` column; map them to the unified `options` shape used by the new
// exam engine so the college panel and the builder agree on one contract.
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("active", true)
      .order("createdAt", { ascending: true });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, questions: [] }, { status: 200 });
    }
    const questions = (data || []).map((q: any) => ({
      ...q,
      options: Array.isArray(q.choices) ? q.choices : [],
    }));
    return NextResponse.json({ ok: true, questions });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error", questions: [] }, { status: 200 });
  }
}