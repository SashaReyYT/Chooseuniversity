"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = { error: null };

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wide"
        >
          Email
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
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {state.error && (
        <p className="font-body-sm text-body-sm text-error">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
