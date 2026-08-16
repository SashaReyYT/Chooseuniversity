"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeFromComparison } from "@/lib/actions/comparison.actions";

export function RemoveFromComparisonButton({
  comparisonId,
  programmeId,
}: {
  comparisonId: string;
  programmeId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await removeFromComparison(comparisonId, programmeId);
          router.refresh();
        });
      }}
      className="font-label-caps text-label-caps px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-60"
    >
      Remove
    </button>
  );
}
