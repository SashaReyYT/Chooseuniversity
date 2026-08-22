"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface DebouncedSearchProps {
  defaultValue?: string;
  placeholder?: string;
  debounceMs?: number;
  locale: string;
  onSearch?: (query: string) => void;
}

export function DebouncedSearch({
  defaultValue = "",
  placeholder,
  debounceMs = 300,
  locale,
  onSearch,
}: DebouncedSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Discover");
  
  const [query, setQuery] = useState(defaultValue);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultValue);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Update URL when debounced query changes
  useEffect(() => {
    if (debouncedQuery === defaultValue && !searchParams.get("q")) {
      return;
    }
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    } else {
      params.delete("q");
    }
    
    // Preserve other filters
    const currentUrl = `${pathname}?${params.toString()}`;
    router.replace(currentUrl, { scroll: false });
    
    if (onSearch) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, pathname, router, searchParams, defaultValue, onSearch]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Force immediate update on Enter
      setDebouncedQuery(query);
    }
  }, [query]);

  return (
    <input
      id="search-q"
      name="q"
      type="search"
      value={query}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder ?? t("searchPlaceholder")}
      className="w-full font-body-md text-body-md bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
      autoComplete="off"
      aria-label={t("searchLabel")}
    />
  );
}