/**
 * Shared exponential-backoff retry policy for offline queues.
 *
 * Both the offline answer queue and the content-report queue replay failed
 * writes to Supabase with the same backoff schedule. The schedule lived,
 * byte-for-byte, in both modules; it now has a single home so the two queues
 * can never drift out of sync.
 */

export const RETRY_BASE_BACKOFF_MS = 30_000;
export const RETRY_MAX_BACKOFF_MS = 30 * 60 * 1000;

/**
 * ISO timestamp for the earliest moment a failed item may be retried.
 * Backoff doubles per attempt (30s, 1m, 2m, …) capped at 30 minutes.
 */
export function nextRetryAt(attemptCount: number, now = Date.now()): string {
  const delay = Math.min(
    RETRY_BASE_BACKOFF_MS * 2 ** Math.max(attemptCount - 1, 0),
    RETRY_MAX_BACKOFF_MS
  );
  return new Date(now + delay).toISOString();
}

/**
 * Whether a queued item whose next attempt is scheduled for `nextAttemptAt`
 * is due to be retried. Items with no schedule (freshly queued) are always due.
 */
export function isRetryDue(nextAttemptAt: string | undefined, now = Date.now()): boolean {
  if (!nextAttemptAt) return true;
  return new Date(nextAttemptAt).getTime() <= now;
}
