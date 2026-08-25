/**
 * In-process LRU cache for computed match lists.
 *
 * Key shape: `${userId}:${profileUpdatedAt}:${filtersHash}` — the profile
 * timestamp guarantees a stale entry is never served after the user edits
 * their questionnaire, without needing explicit invalidation wiring. The
 * catalogue half of the key uses an hourly bucket: programme edits become
 * visible to cached users within at most one hour, which matches the ISR
 * freshness contract used elsewhere.
 *
 * Single-instance only. When the app scales horizontally swap this module
 * for Upstash with identical get/set/bump semantics.
 */

const MAX_ENTRIES = 200;
const ENTRY_TTL_MS = 5 * 60_000;
const CATALOG_BUCKET_MS = 60 * 60_000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export function matchCacheKey(
  userId: string,
  profileUpdatedAt: string | null,
  filters: unknown,
): string {
  const bucket = Math.floor(Date.now() / CATALOG_BUCKET_MS);
  const filterKey = JSON.stringify(filters ?? {});
  return `${userId}:${profileUpdatedAt ?? "no-profile"}:${bucket}:${filterKey}`;
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  // LRU touch: re-inserting moves the key to the end of iteration order.
  store.delete(key);
  store.set(key, entry);
  return entry.value;
}

export function cacheSet<T>(key: string, value: T): void {
  if (store.size >= MAX_ENTRIES) {
    // Evict the oldest entry (first in insertion order).
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + ENTRY_TTL_MS });
}

/** Drops every cached list for one user — call after any profile write. */
export function invalidateUserMatches(userId: string): void {
  const prefix = `${userId}:`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}