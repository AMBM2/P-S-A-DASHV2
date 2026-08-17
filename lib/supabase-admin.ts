import { createClient } from "@supabase/supabase-js";

// Server-only client using the SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
// NEVER import this from a client component or pass it to the browser.
// Falls back to the anon key ONLY if the service key is missing, so the portal
// keeps working during setup — but the restrictive RLS (setup_all.sql section
// 20) requires the real service key for every admin write.
let instance: any | null = null;

export function getSupabaseAdmin(): any {
  if (instance) return instance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing Supabase URL / service role key. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel → Environment Variables.'
    );
  }

  instance = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return instance;
}