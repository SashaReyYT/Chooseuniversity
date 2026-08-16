"use client";

import { useState, useTransition } from "react";
import { addToComparison } from "@/lib/actions/comparison.actions";

export function CompareButton({
  programmeId,
  initiallyInComparison,
}: {
  programmeId: string;
  initiallyInComparison: boolean;
}) {
  const [added, setAdded] = useState(initiallyInComparison);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={isPending || added}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await addToComparison(programmeId);
            if (result.ok) {
              setAdded(true);
            } else {
              setError(result.error ?? "Something went wrong.");
            }
          });
        }}
        className="font-label-caps text-label-caps px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-60"
      >
        {added ? "Added to compare" : "Compare"}
      </button>
      {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
    </div>
  );
}
