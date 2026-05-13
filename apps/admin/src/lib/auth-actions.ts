"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BYPASS_COOKIE, BYPASS_VALUE } from "@/lib/auth-constants";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

  // Env-var bypass credentials — works without Supabase Auth
  const adminEmail =
    process.env.ADMIN_EMAIL ?? "urbanixstore.official@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "UrbanixAdmin2026!";

  if (email === adminEmail && password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set(BYPASS_COOKIE, BYPASS_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    redirect("/");
  }

  // Fallback: try Supabase Auth
  const supabase = await getSupabaseClient();
  if (!supabase) {
    redirect("/login?error=1");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=1");
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(BYPASS_COOKIE);
  const supabase = await getSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
