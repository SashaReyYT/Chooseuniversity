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

/**
 * Cloudflare Turnstile server-side verification. Returns true
 * when the secret isn't configured (skip verification in dev).
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

/**
 * Validates the `next` redirect path to prevent open redirect attacks.
 * Only allows internal paths starting with `/` without protocol.
 */
function safeNext(raw: string): string {
  const next = raw.trim();
  if (next.startsWith("/") && !next.includes("://")) return next;
  return "/onboarding";
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getTranslations("Auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/onboarding"));

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

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: error.message };
    }

    // If Supabase requires email confirmation, data.session will be null.
    // In that case redirect to sign-in so the user can log in after
    // confirming — don't try to access protected pages without a session.
    if (!data.session) {
      const locale = await getLocale();
      redirect({ href: "/sign-in", locale });
    }

    // Session established — safe to redirect to onboarding.
    const locale = await getLocale();
    redirect({ href: next, locale });
    return { error: null };
  } catch (err) {
    // rethrow redirect errors (Next.js uses these internally)
    if (
      err instanceof Error &&
      ("digest" in err || err.message === "NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("signUp unexpected error:", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during registration.",
    };
  }
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getTranslations("Auth");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? "/onboarding"));

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
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("signOut error:", err);
  }
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
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
  try {
    const supabase = await createServerSupabaseClient();
    // The SQL function ships in migration 20260824002000; the generated
    // Database type's Functions map hasn't been regenerated yet, hence the
    // targeted cast instead of waiting on codegen.
    const rpc = supabase.rpc as unknown as (
      fn: string,
    ) => ReturnType<typeof supabase.rpc>;
    await rpc("delete_own_account");
    await supabase.auth.signOut();
  } catch (err) {
    console.error("deleteAccount error:", err);
  }
  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
