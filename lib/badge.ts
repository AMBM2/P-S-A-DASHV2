import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Server-side badge generator — mirrors the client's nextBadge() so a fresh
// cadet gets a unique code like "PSA-1001" the moment they are approved, and
// the bot can bake it into their Discord nickname ([PSA-1001] Name).
export async function nextBadgeServer(): Promise<string> {
  const supabase = getSupabaseAdmin();
  let max = 1000;
  try {
    const { data } = await supabase.from("officers").select("badge");
    for (const row of data || []) {
      const n = parseInt(String(row?.badge || "").replace(/\D/g, ""), 10);
      if (!isNaN(n)) max = Math.max(max, n);
    }
  } catch {
    // table missing — fall back to default
  }
  return `PSA-${String(max + 1).padStart(4, "0")}`;
}