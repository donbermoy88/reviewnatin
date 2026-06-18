import { describe, expect, it } from 'vitest';
import {
  RETRY_BASE_BACKOFF_MS,
  RETRY_MAX_BACKOFF_MS,
  isRetryDue,
  nextRetryAt,
} from './retry-policy';

const NOW = Date.UTC(2026, 0, 1, 0, 0, 0);

describe('nextRetryAt', () => {
  it('uses the base backoff for the first attempt', () => {
    const at = new Date(nextRetryAt(1, NOW)).getTime();
    expect(at - NOW).toBe(RETRY_BASE_BACKOFF_MS);
  });

  it('treats attempt 0 the same as attempt 1 (no negative exponent)', () => {
    expect(nextRetryAt(0, NOW)).toBe(nextRetryAt(1, NOW));
  });

  it('doubles the delay each attempt', () => {
    const first = new Date(nextRetryAt(1, NOW)).getTime() - NOW;
    const second = new Date(nextRetryAt(2, NOW)).getTime() - NOW;
    const third = new Date(nextRetryAt(3, NOW)).getTime() - NOW;
    expect(second).toBe(first * 2);
    expect(third).toBe(first * 4);
  });

  it('caps the delay at the maximum backoff', () => {
    const at = new Date(nextRetryAt(50, NOW)).getTime();
    expect(at - NOW).toBe(RETRY_MAX_BACKOFF_MS);
  });

  it('returns an ISO timestamp', () => {
    expect(nextRetryAt(1, NOW)).toBe(new Date(NOW + RETRY_BASE_BACKOFF_MS).toISOString());
  });
});

describe('isRetryDue', () => {
  it('is due when no schedule is set', () => {
    expect(isRetryDue(undefined, NOW)).toBe(true);
  });

  it('is due once the scheduled time has passed', () => {
    const past = new Date(NOW - 1).toISOString();
    expect(isRetryDue(past, NOW)).toBe(true);
  });

  it('is due exactly at the scheduled time', () => {
    const exact = new Date(NOW).toISOString();
    expect(isRetryDue(exact, NOW)).toBe(true);
  });

  it('is not due before the scheduled time', () => {
    const future = new Date(NOW + 1).toISOString();
    expect(isRetryDue(future, NOW)).toBe(false);
  });
});
