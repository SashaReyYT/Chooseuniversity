"use client";

import { useActionState, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { signUp } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/types";
import { Turnstile } from "@/components/turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const initialState: AuthFormState = { error: null };

interface SignUpFormProps {
  next?: string;
}

export function SignUpForm({ next = "/onboarding" }: SignUpFormProps) {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [, setTurnstileToken] = useState<string | null>(null);
  const handleToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <input type="hidden" name="next" value={next} />
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

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide"
        >
          {t("passwordLabel")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {t("passwordHint")}
        </p>
      </div>

      {state.error && (
        <p className="font-body-sm text-body-sm text-error">{state.error}</p>
      )}

      <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={handleToken} />

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md disabled:opacity-60"
      >
        {isPending ? t("submitSignUpPending") : t("submitSignUp")}
      </button>
    </form>
  );
}