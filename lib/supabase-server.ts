import { createClient } from "@supabase/supabase-js";

// Returns `any` on purpose: the project has no generated database types, so a
// strictly-typed client makes every `.from().insert({...})` fail to compile.
let instance: any | null = null;

export function getSupabase(): any {
  if (instance) return instance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing "NEXT_PUBLIC_SUPABASE_URL". Add it to .env.local and to Vercel → Settings → Environment Variables (Production).'
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      'Missing "NEXT_PUBLIC_SUPABASE_ANON_KEY". Add it to .env.local and to Vercel → Settings → Environment Variables (Production).'
    );
  }

  instance = createClient(supabaseUrl, supabaseAnonKey);
  return instance;
}