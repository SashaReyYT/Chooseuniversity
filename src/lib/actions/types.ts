/**
 * Shared action result shapes. Kept out of the `"use server"` modules:
 * Next.js requires those files to export only async functions, so types
 * live here instead.
 */
export interface ComparisonActionResult {
  ok: boolean;
  error?: string;
  itemCount?: number;
}

export interface ProfileFormState {
  error: string | null;
}