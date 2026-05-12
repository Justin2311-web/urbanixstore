"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await getSupabaseClient();

  if (!supabase) {
    // Fallback: env-var credentials when Supabase is not configured
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@urbanix.store";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "urbanix-admin";
    if (email === adminEmail && password === adminPassword) {
      redirect("/");
    }
    redirect("/login?error=invalid");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=invalid");
  redirect("/");
}

export async function signOut() {
  const supabase = await getSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
