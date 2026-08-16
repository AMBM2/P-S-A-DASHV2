import { NextResponse } from "next/server";

// TEMPORARY diagnostic route — remove after debugging the bot connectivity.
export async function GET() {
  const botUrl = process.env.PATROL_BOT_URL || "";
  const tunnelTest: any = {};
  try {
    const r = await fetch(`${botUrl}/health`, { cache: "no-store" });
    tunnelTest.status = r.status;
    tunnelTest.body = (await r.text()).slice(0, 200);
  } catch (e: any) {
    tunnelTest.error = e?.message || "unknown";
    tunnelTest.name = e?.name || "";
  }
  const directTest: any = {};
  try {
    const r = await fetch("https://example.com", { cache: "no-store" });
    directTest.status = r.status;
  } catch (e: any) {
    directTest.error = e?.message || "unknown";
  }
  return NextResponse.json({
    botUrl,
    hasSecret: !!process.env.PATROL_BOT_SECRET,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    tunnelTest,
    directTest,
  });
}