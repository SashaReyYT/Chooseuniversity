"use client";

import { useOptimistic, startTransition } from "react";
import { showToast } from "@/components/toast-container";

interface SaveButtonProps {
  action: (formData: FormData) => Promise<void>;
  programmeId: string;
  isSaved: boolean;
  labelSave: string;
  labelSaved: string;
  toastSaved: string;
  toastUnsaved: string;
  className?: string;
  buttonClassName?: string;
}

/**
 * Optimistic save toggle: flips the visual state the instant the user
 * clicks, then reconciles with the server action. Falls back to server
 * truth automatically if the action fails.
 */
export function SaveButton({
  action,
  programmeId,
  isSaved,
  labelSave,
  labelSaved,
  toastSaved,
  toastUnsaved,
  className = "",
  buttonClassName,
}: SaveButtonProps) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(isSaved);

  const saved = optimisticSaved;

  return (
    <form
      action={(fd: FormData) => {
        startTransition(() => {
          setOptimisticSaved(!saved);
          showToast(saved ? toastUnsaved : toastSaved, "success");
        });
        return action(fd);
      }}
      className={className}
    >
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="isSaved" value={String(saved)} />
      <button
        type="submit"
        aria-label={saved ? labelSaved : labelSave}
        className={buttonClassName || `flex items-center gap-2 font-label-caps text-label-caps px-4 py-2 rounded-full border transition-all active:scale-95 ${
          saved
            ? "bg-primary text-on-primary border-primary"
            : "bg-transparent text-primary border-primary hover:bg-surface-container"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        <span className="hidden md:inline">{saved ? labelSaved : labelSave}</span>
      </button>
    </form>
  );
}