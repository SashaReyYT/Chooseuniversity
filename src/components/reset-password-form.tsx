"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePassword } from "@/lib/auth/actions";
import type { AuthFormState } from "@/lib/auth/types";

const initialState: AuthFormState = { error: null };

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
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
      </div>

      {state.error ? (
        <p className="font-body-sm text-body-sm text-error">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md disabled:opacity-60"
      >
        {isPending ? t("resetPending") : t("resetSubmit")}
      </button>

      <p aria-live="polite" className="min-h-5 font-body-sm text-body-sm text-success">
        {!isPending && state.sent ? t("resetDone") : ""}
      </p>
    </form>
  );
}