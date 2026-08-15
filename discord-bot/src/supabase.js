import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

// Service-role client (bypasses RLS — server-side only), or anon fallback
export const supabase = createClient(config.supabaseUrl, config.serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { params: { eventsPerSecond: 10 } },
});

// Single shared realtime channel. Register all listeners via onTable(),
// then call subscribeAll() exactly once.
export const dbChannel = supabase.channel("psa-db-changes");

export function onTable(table, cb) {
  dbChannel.on("postgres_changes", { event: "*", schema: "public", table }, cb);
}

export function subscribeAll() {
  dbChannel.subscribe((status) => {
    console.log(`[realtime] subscription status: ${status}`);
  });
}
