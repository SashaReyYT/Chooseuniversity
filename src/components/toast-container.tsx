"use client";

import { useEffect, useState, useCallback } from "react";

export type ToastType = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

/**
 * Dispatcher helper to show a toast from any Client Component.
 */
export function showToast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("show-toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    
    // Actually remove it after exit animation completes
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 200);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType }>;
      if (!customEvent.detail) return;

      const newToast: ToastMessage = {
        id: Math.random().toString(36).substring(2, 9),
        message: customEvent.detail.message,
        type: customEvent.detail.type || "success",
      };

      setToasts((current) => [...current, newToast]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        removeToast(newToast.id);
      }, 3000);
    };

    window.addEventListener("show-toast", handleShowToast);
    return () => {
      window.removeEventListener("show-toast", handleShowToast);
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+12px)] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-6 md:right-6 z-50 flex flex-col gap-2 max-w-[calc(100%-2rem)] md:max-w-sm w-full pointer-events-none px-4 md:px-0"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const bgClass = {
          success: "bg-tertiary-container text-on-tertiary-container border-tertiary/20",
          info: "bg-primary-container text-on-primary-container border-primary/20",
          warning: "bg-secondary-fixed text-on-secondary-fixed border-secondary/20",
          error: "bg-error-container text-on-error-container border-error/20",
        }[toast.type];

        const icon = {
          success: "check_circle",
          info: "info",
          warning: "warning",
          error: "error",
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg pointer-events-auto transition-all ${bgClass} ${
              toast.exiting ? "toast-animation-exit" : "toast-animation-enter"
            }`}
          >
            <span className="material-symbols-outlined shrink-0" aria-hidden="true" style={{ fontSize: 20 }}>
              {icon}
            </span>
            <p className="flex-1 font-body-sm text-body-sm leading-relaxed pr-2">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-full hover:bg-black/10 active:scale-90 transition-all cursor-pointer"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined block" aria-hidden="true" style={{ fontSize: 16 }}>
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
