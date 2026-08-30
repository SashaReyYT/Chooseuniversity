"use client";

import { useOptimistic, startTransition } from "react";
import { showToast } from "@/components/toast-container";

interface CompareButtonProps {
  action: (formData: FormData) => Promise<void>;
  programmeId: string;
  isInComparison: boolean;
  defaultComparisonName: string;
  labelCompare: string;
  labelUncompare: string;
  toastCompared: string;
  toastUncompared: string;
  className?: string;
  buttonClassName?: string;
}

/**
 * Optimistic compare toggle: flips the visual state the instant the user
 * clicks, then reconciles with the server action. Falls back to server
 * truth automatically if the action fails.
 */
export function CompareButton({
  action,
  programmeId,
  isInComparison,
  defaultComparisonName,
  labelCompare,
  labelUncompare,
  toastCompared,
  toastUncompared,
  className = "",
  buttonClassName,
}: CompareButtonProps) {
  const [optimisticCompared, setOptimisticCompared] = useOptimistic(isInComparison);

  const compared = optimisticCompared;

  return (
    <form
      action={(fd: FormData) => {
        startTransition(() => {
          setOptimisticCompared(!compared);
          showToast(compared ? toastUncompared : toastCompared, "success");
        });
        return action(fd);
      }}
      className={className}
    >
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="isInComparison" value={String(compared)} />
      <input type="hidden" name="defaultComparisonName" value={defaultComparisonName} />
      <button
        type="submit"
        className={buttonClassName || `font-label-caps text-label-caps px-6 py-3 rounded-full border transition-all active:scale-95 ${
          compared
            ? "bg-secondary-container text-on-secondary-container border-secondary-container"
            : "bg-transparent text-primary border-primary hover:bg-surface-container"
        }`}
      >
        {compared ? labelUncompare : labelCompare}
      </button>
    </form>
  );
}
