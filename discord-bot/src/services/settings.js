import { supabase } from "../supabase.js";
import { config } from "../config.js";

let cache = { at: 0, value: null };
const CACHE_TTL_MS = 30_000;

// The field-dispatch (الميدان) role registered from the Web dashboard
// (settings.fieldRoleId). Falls back to the env seed. Short-lived cache keeps
// dashboard changes effective within ~30s without hammering the DB.
export async function getFieldRoleId() {
  if (cache.value && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  let value = config.fieldMemberRoleId;
  try {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "settings")
      .maybeSingle();
    const rid = data?.value?.fieldRoleId;
    if (rid && /^\d{15,20}$/.test(String(rid))) value = String(rid);
  } catch (e) {
    console.warn("[settings] fieldRoleId load failed:", e.message);
  }
  cache = { at: Date.now(), value };
  return value;
}