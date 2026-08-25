"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/lib/auth/actions";

/**
 * Two-step danger zone: the first click arms the button, the second (within
 * a short window) actually deletes. Keeps accidental taps from nuking an
 * account without dragging in a modal dependency.
 */
export function DeleteAccountZone() {
  const t = useTranslations("Auth");
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="font-label-caps text-label-caps text-error border border-error/40 rounded-full px-6 py-3 hover:bg-error/5 transition-colors"
      >
        {t("deleteAccount")}
      </button>
    );
  }

  return (
    <form action={deleteAccount} className="flex flex-wrap items-center gap-3">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("deleteConfirmText")}
      </p>
      <button
        type="submit"
        className="bg-error text-on-error font-label-caps text-label-caps px-6 py-3 rounded-full transition-all active:scale-95"
      >
        {t("deleteConfirmYes")}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="font-label-caps text-label-caps text-on-surface-variant underline"
      >
        {t("deleteCancel")}
      </button>
    </form>
  );
}