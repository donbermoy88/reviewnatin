/**
 * In-flight request de-duplication.
 *
 * Without this, two callers that request the same resource at the same time
 * (e.g. two screens mounting together, both reading the exam catalog) each fire
 * their own network round-trip. `dedupeAsync` coalesces concurrent calls that
 * share a key onto a single in-flight promise: every caller resolves/rejects
 * with the same outcome, but the loader runs once.
 *
 * The shared promise is tracked only while in flight — it is removed as soon as
 * it settles, so a later call always re-runs the loader (this is request
 * coalescing, not caching; caching is layered separately in json-cache).
 */
const inFlight = new Map<string, Promise<unknown>>();

export function dedupeAsync<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const pending = (async () => {
    try {
      return await loader();
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, pending);
  return pending;
}

/** Number of requests currently in flight (diagnostics / tests). */
export function inFlightCount(): number {
  return inFlight.size;
}

/** Drop all tracked in-flight promises. Intended for tests. */
export function resetInFlight(): void {
  inFlight.clear();
}
