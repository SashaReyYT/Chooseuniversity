"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
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

/**
 * Cloudflare Turnstile server-side verification. No-ops (returns true)
 * when the secret isn't configured, so local dev and self-hosted previews
 * work without registration.
 */
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

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

  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: t("turnstileError") };
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

/**
 * Sends the Supabase recovery email. Always returns a neutral success so
 * the endpoint can't be used to enumerate registered addresses.
 */
export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getTranslations("Auth");
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { error: t("errorMissingCredentials") };

  const turnstileToken = String(formData.get("cf-turnstile-response") ?? "");
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: t("turnstileError") };
  }

  const supabase = await createServerSupabaseClient();
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${h.get("host")}`;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset`,
  });

  return { error: null, sent: true };
}

/** Sets a new password for the session established by the recovery link. */
export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getTranslations("Auth");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { error: t("errorPasswordTooShort") };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { error: null, sent: true };
}

/**
 * GDPR-style self-service deletion. The security-definer SQL function
 * (migration 20260824002000) deletes the auth.users row, cascading every
 * owned record; afterwards we clear cookies and go home.
 */
export async function deleteAccount(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  // The SQL function ships in migration 20260824002000; the generated
  // Database type's Functions map hasn't been regenerated yet, hence the
  // targeted cast instead of waiting on codegen.
  const rpc = supabase.rpc as unknown as (
    fn: string,
  ) => ReturnType<typeof supabase.rpc>;
  await rpc("delete_own_account");
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
