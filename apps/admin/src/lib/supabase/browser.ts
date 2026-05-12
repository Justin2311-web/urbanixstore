import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@ecommerce/database";

function getPublicSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return { supabaseKey, supabaseUrl };
}

export function createSupabaseBrowserClient() {
  const { supabaseKey, supabaseUrl } = getPublicSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
