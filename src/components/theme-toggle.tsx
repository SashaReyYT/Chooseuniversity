"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    : false;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
    >
      <span className="material-symbols-outlined text-on-surface-variant">
        {mounted ? (isDark ? "light_mode" : "dark_mode") : "dark_mode"}
      </span>
    </button>
  );
}
