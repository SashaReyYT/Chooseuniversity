"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";

interface UniHit {
  id: string;
  name: string;
  city: string;
}
interface ProgHit {
  id: string;
  name: string;
  degree_level: string;
  universities: { name: string } | null;
}

/**
 * ⌘K / Ctrl-K palette searching universities and programmes. Mounted in the
 * Header; Escape closes, Enter opens the first hit.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ universities: UniHit[]; programmes: ProgHit[] }>({
    universities: [],
    programmes: [],
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Focus trap
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'input, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, []);

  // Global hotkey
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.addEventListener("keydown", trapFocus);
    } else {
      triggerRef.current?.focus();
      document.removeEventListener("keydown", trapFocus);
    }
    return () => document.removeEventListener("keydown", trapFocus);
  }, [open, trapFocus]);

  // Debounced search — short queries clear via the same deferred path so
  // react-compiler never sees a synchronous setState in an effect.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      debounceRef.current = setTimeout(() => {
        setHits({ universities: [], programmes: [] });
      }, 0);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) setHits(await res.json());
      } catch {
        /* network blips silently clear */
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-colors md:w-auto md:h-auto md:bg-transparent md:border md:border-outline-variant md:px-4 md:py-1.5 md:gap-2"
      >
        <span className="material-symbols-outlined text-on-surface-variant md:text-base" aria-hidden="true">search</span>
        <kbd className="hidden md:inline font-label-caps text-label-caps opacity-60">⌘K</kbd>
      </button>
    );
  }

  const total = hits.universities.length + hits.programmes.length;

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div ref={dialogRef} className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" role="dialog" aria-modal="true" aria-label="Search">
      {/* backdrop */}
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-xl rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-2xl overflow-hidden">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && total > 0) {
              const first =
                hits.programmes[0]
                  ? `/programmes/${hits.programmes[0].id}`
                  : `/universities/${hits.universities[0].id}`;
              go(first);
            }
          }}
          placeholder="⌘K — search universities & programmes…"
          aria-label="Search universities and programmes"
          className="w-full px-5 py-4 font-body-md text-body-md bg-transparent border-b border-outline-variant/40 focus:outline-none"
        />

        {query.trim().length >= 2 && total === 0 ? (
          <p className="px-5 py-6 font-body-sm text-body-sm text-on-surface-variant">
            Nothing found.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y divide-outline-variant/20" aria-live="polite">
            {hits.universities.map((u) => (
              <li key={`u-${u.id}`}>
                <button
                  type="button"
                  onClick={() => go(`/universities/${u.id}`)}
                  className="w-full text-left px-5 py-3 hover:bg-surface-container transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg text-primary" aria-hidden="true">account_balance</span>
                  <span className="min-w-0">
                    <span className="block font-body-sm text-body-sm text-on-surface truncate">{u.name}</span>
                    <span className="block font-body-xs text-body-xs text-on-surface-variant">{u.city}</span>
                  </span>
                </button>
              </li>
            ))}
            {hits.programmes.map((p) => (
              <li key={`p-${p.id}`}>
                <button
                  type="button"
                  onClick={() => go(`/programmes/${p.id}`)}
                  className="w-full text-left px-5 py-3 hover:bg-surface-container transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-lg text-secondary" aria-hidden="true">school</span>
                  <span className="min-w-0">
                    <span className="block font-body-sm text-body-sm text-on-surface truncate">{p.name}</span>
                    <span className="block font-body-xs text-body-xs text-on-surface-variant truncate">
                      {p.universities?.name} · {p.degree_level}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}