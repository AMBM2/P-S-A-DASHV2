import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Server-side audit logging into the `audit_logs` table.
// Never import from a client component — server routes only (service role key).
export async function auditLog(input: {
  action: string;
  actionAr?: string;
  executor: string;
  executorName?: string;
  target?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("audit_logs").insert({
      action: input.action,
      actionAr: input.actionAr || input.action,
      executor: input.executor || "",
      executorName: input.executorName || null,
      target: input.target || null,
      targetName: input.targetName || null,
      metadata: input.metadata || {},
    });
  } catch (e: any) {
    console.warn(`[audit] write failed: ${e?.message}`);
  }
}