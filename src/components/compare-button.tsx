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
        className={buttonClassName || `flex items-center justify-center gap-2 font-label-caps text-label-caps px-4 py-2 md:px-6 md:py-3 rounded-full border transition-all active:scale-95 ${
          compared
            ? "bg-secondary-container text-on-secondary-container border-secondary-container"
            : "bg-transparent text-primary border-primary hover:bg-surface-container"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 3h5v5" />
          <path d="M8 21H3v-5" />
          <path d="M12 14l9-9" />
          <path d="M12 10L3 19" />
        </svg>
        <span className="hidden md:inline">{compared ? labelUncompare : labelCompare}</span>
      </button>
    </form>
  );
}
