"use client";

import { useActionState, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/types";
import { Turnstile } from "@/components/turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const initialState: AuthFormState = { error: null };

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );
  const [, setTurnstileToken] = useState<string | null>(null);
  const handleToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide"
        >
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={handleToken} />

      {state.error ? (
        <p className="font-body-sm text-body-sm text-error">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md disabled:opacity-60"
      >
        {isPending ? t("forgotPending") : t("forgotSubmit")}
      </button>

      <p aria-live="polite" className="min-h-5 font-body-sm text-body-sm text-success">
        {!isPending && state.sent ? t("forgotSent") : ""}
      </p>
    </form>
  );
}