"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-margin-mobile">
      <div className="max-w-md text-center space-y-4">
        <span className="material-symbols-outlined text-6xl text-error" aria-hidden="true">
          error
        </span>
        <h1 className="font-headline-md text-headline-md text-primary">
          Something went wrong
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="font-label-caps text-label-caps px-8 py-4 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all active:scale-95 shadow-md"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
