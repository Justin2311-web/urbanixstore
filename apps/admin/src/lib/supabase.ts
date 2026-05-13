import { createClient } from "@supabase/supabase-js";
import type { Database } from "@ecommerce/database";

/**
 * Admin Supabase client — uses the service role key to bypass RLS.
 * Only use server-side (server actions, API routes, server components).
 */
export function createAdminClient() {
  // Trim to guard against accidental leading/trailing whitespace in env vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Upload a file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const sb = createAdminClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `${path}/${Date.now()}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = sb.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
