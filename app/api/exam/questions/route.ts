import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("exam_questions")
      .select("*")
      .eq("active", true)
      .order("createdAt", { ascending: true });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message, questions: [] }, { status: 200 });
    }
    return NextResponse.json({ ok: true, questions: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "server error", questions: [] }, { status: 200 });
  }
}