/**
 * Shared auth-related types. Kept out of `actions.ts` because a `"use
 * server"` file may only export async functions — a type export makes the
 * module fail to load at runtime with "A 'use server' file can only export
 * async functions, found object".
 */
export interface AuthFormState {
  error: string | null;
}