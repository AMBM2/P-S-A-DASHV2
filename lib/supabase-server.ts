import { createClient } from "@supabase/supabase-js";

let instance: any | null = null;

export function getSupabase(): any {
  if (instance) return instance;
  instance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return instance;
}
