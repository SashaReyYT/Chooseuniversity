"use client";

import { useEffect, useRef, useState } from "react";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    if (open) inputRef.current?.focus();
  }, [open]);

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
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="hidden md:flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors border border-outline-variant rounded-full px-4 py-1.5"
      >
        <span className="material-symbols-outlined text-base" aria-hidden="true">search</span>
        <kbd className="font-label-caps text-label-caps opacity-60">⌘K</kbd>
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4" role="dialog" aria-modal="true">
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
          className="w-full px-5 py-4 font-body-md text-body-md bg-transparent border-b border-outline-variant/40 focus:outline-none"
        />

        {query.trim().length >= 2 && total === 0 ? (
          <p className="px-5 py-6 font-body-sm text-body-sm text-on-surface-variant">
            Nothing found.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y divide-outline-variant/20">
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