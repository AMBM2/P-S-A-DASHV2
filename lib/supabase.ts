import { createClient } from "@supabase/supabase-js";

// Static references are REQUIRED here: Next.js inlines `process.env.NEXT_PUBLIC_*`
// at build time, so dynamic access (e.g. process.env[name]) silently becomes
// `undefined` in the browser bundle. Never use a helper with a variable name.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Missing "NEXT_PUBLIC_SUPABASE_URL". Add it to .env.local and to Vercel → Settings → Environment Variables.'
  );
}
if (!supabaseAnonKey) {
  throw new Error(
    'Missing "NEXT_PUBLIC_SUPABASE_ANON_KEY". Add it to .env.local and to Vercel → Settings → Environment Variables.'
  );
}

export const supabase =
  typeof window !== "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as ReturnType<typeof createClient>);