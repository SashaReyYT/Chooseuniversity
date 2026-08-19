/**
 * State shape for the landing page's Quick Match form. Lives outside the
 * server action module because a `"use server"` file may only export async
 * functions — a `const` export makes the module fail to load at runtime
 * with "A 'use server' file can only export async functions, found
 * object".
 */
export type QuickMatchActionState = {
  count: number | null;
  submitted: boolean;
};

export const initialQuickMatchActionState: QuickMatchActionState = {
  count: null,
  submitted: false,
};