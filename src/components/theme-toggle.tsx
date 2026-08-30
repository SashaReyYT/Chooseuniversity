"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined text-on-surface-variant">brightness_medium</span>
      </button>
    );
  }

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
    >
      <span className="material-symbols-outlined text-on-surface-variant">
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
