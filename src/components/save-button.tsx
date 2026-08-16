"use client";

import { useState, useTransition } from "react";
import { toggleFavourite } from "@/lib/actions/favourites.actions";

export function SaveButton({
  programmeId,
  initiallySaved,
}: {
  programmeId: string;
  initiallySaved: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending}
        aria-pressed={saved}
        onClick={() => {
          setError(null);
          // Optimistic: flip immediately, reconcile with the server's
          // answer once it responds — saving should feel instant.
          setSaved((current) => !current);
          startTransition(async () => {
            const result = await toggleFavourite(programmeId);
            if (result.error) {
              setError(result.error);
              setSaved((current) => !current); // revert
            } else {
              setSaved(result.saved);
            }
          });
        }}
        className={
          "font-label-caps text-label-caps px-4 py-2 rounded-full border transition-colors disabled:opacity-60 " +
          (saved
            ? "bg-primary text-on-primary border-primary"
            : "bg-transparent text-primary border-primary hover:bg-surface-container")
        }
      >
        {saved ? "Saved" : "Save"}
      </button>
      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
    </div>
  );
}
