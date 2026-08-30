"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

/** Subscribe no-op — we only need the snapshot, not a live subscription. */
const subscribe = () => () => {};

/** On the server / before hydration, always treat as "not mounted". */
const getServerSnapshot = () => false;

/** After hydration, the component is mounted. */
const getSnapshot = () => true;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // useSyncExternalStore eliminates the setState-in-useEffect anti-pattern:
  // returns false on the server and on the first render, true afterwards.
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
