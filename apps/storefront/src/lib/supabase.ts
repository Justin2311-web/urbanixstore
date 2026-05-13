import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ecommerce/database";

/**
 * Supabase client for storefront API routes (server-side only).
 * Uses the anon key — RLS policies grant the required permissions:
 *   orders:       public INSERT, anon SELECT
 *   order_items:  public INSERT, anon SELECT
 *   storage:      anon INSERT (uploads bucket)
 */
export function createStorefrontClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
