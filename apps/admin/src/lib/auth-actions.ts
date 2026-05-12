"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BYPASS_COOKIE = "admin_bypass_session";
const BYPASS_VALUE = "urbanix-admin-ok";

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

  // Always check env-var credentials as a bypass (works with or without Supabase)
  const adminEmail = process.env.ADMIN_EMAIL ?? "urbanixstore.official@gmail.com";
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

  const supabase = await getSupabaseClient();

  if (!supabase) {
    redirect("/login?error=invalid");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=invalid");
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(BYPASS_COOKIE);
  const supabase = await getSupabaseClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}

