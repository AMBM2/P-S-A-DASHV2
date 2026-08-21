import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Server-side audit logging into the `audit_logs` table, plus a fire-and-forget
// forward to the Discord bot, which posts the entry to the dedicated audit-log
// channel (لوق العمليات). Never import from a client component — server routes
// only (service role key).
export async function auditLog(input: {
  action: string;
  actionAr?: string;
  executor: string;
  executorName?: string;
  target?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = {
    action: input.action,
    actionAr: input.actionAr || input.action,
    executor: input.executor || "",
    executorName: input.executorName || null,
    target: input.target || null,
    targetName: input.targetName || null,
    metadata: input.metadata || {},
  };

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { ok: false, error: "Supabase admin client unavailable" };
  }

  const { error } = await supabase.from("audit_logs").insert(row);
  if (error) {
    return { ok: false, error: error.message };
  }

  // Notify the bot so it can post to the Discord audit-log channel. Never block
  // the caller on the bot — fire and forget with a short timeout.
  const botUrl = (process.env.PATROL_BOT_URL || "http://localhost:4000").replace(/\/+$/, "");
  const secret = process.env.PATROL_BOT_SECRET || "";
  if (botUrl && secret) {
    fetch(`${botUrl}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bot-secret": secret },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(4000),
    }).catch((e: any) => console.warn(`[audit] bot notify failed: ${e?.message}`));
  }

  return { ok: true };
}
