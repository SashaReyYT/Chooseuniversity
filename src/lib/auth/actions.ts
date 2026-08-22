"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import type { AuthFormState } from "@/lib/auth/types";

/**
 * Supabase Auth is used directly (not through a repository/service) —
 * `auth.users` isn't part of Unifind's own domain schema, it's managed by
 * Supabase itself, so there's no query surface here worth abstracting
 * behind a repository. See `src/lib/repositories/README.md`.
 */

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getTranslations("Auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  // After sign-up, redirect to the next page (onboarding).
  // When email confirmation is off, Supabase creates a session immediately,
  // so the user is already authenticated and can proceed to onboarding.
  // When email confirmation is on, the middleware will redirect to sign-in.
  const next = String(formData.get("next") ?? "/onboarding").trim();

  if (!email || !password) {
    return { error: t("errorMissingCredentials") };
  }
  if (password.length < 8) {
    return { error: t("errorPasswordTooShort") };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();
  redirect({ href: next, locale });
  return { error: null };
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getTranslations("Auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/onboarding").trim();

  if (!email || !password) {
    return { error: t("errorMissingCredentials") };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: t("errorInvalidCredentials") };
  }

  const locale = await getLocale();
  redirect({ href: next, locale });
  return { error: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
