/**
 * Shared helpers for the shapes Supabase returns from `.rpc()` / `.select()`.
 *
 * Across `lib/api/*` the same three result shapes were unwrapped by hand:
 *   - an array result coerced to a row type: `(data ?? []) as Row[]`
 *   - a single-row RPC result: `(data as Row[] | null)?.[0]`
 *   - a scalar RPC result: `typeof data === 'number' ? data : fallback`
 *
 * These helpers centralize only that unwrapping. Per-module field mapping and
 * coercion stay in each module (they are intentionally bespoke); this is just the
 * boilerplate around them.
 */

/** Array RPC/select result → typed rows (null/undefined → empty). */
export function rowList<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

/** Single-row RPC result (a one-element array) → the first row, or undefined. */
export function firstRow<T>(data: unknown): T | undefined {
  return (data as T[] | null)?.[0];
}

/** Scalar RPC result → the number, or `fallback` when it isn't a number. */
export function asNumber(data: unknown, fallback: number): number {
  return typeof data === 'number' ? data : fallback;
}
