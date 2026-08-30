"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("unifind-theme");
    
    // Set the initial theme based on: stored preference > system preference > light default
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
  }, [setTheme]);

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