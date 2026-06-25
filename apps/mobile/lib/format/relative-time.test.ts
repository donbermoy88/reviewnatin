import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relative-time';

const NOW = new Date('2026-06-25T12:00:00Z').getTime();

describe('formatRelativeTime', () => {
  it('returns "now" for timestamps under a minute old', () => {
    const iso = new Date(NOW - 30 * 1000).toISOString();
    expect(formatRelativeTime(iso, NOW)).toBe('now');
  });

  it('formats minutes', () => {
    const iso = new Date(NOW - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso, NOW)).toBe('5m');
  });

  it('formats hours', () => {
    const iso = new Date(NOW - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso, NOW)).toBe('3h');
  });

  it('formats days', () => {
    const iso = new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso, NOW)).toBe('2d');
  });

  it('formats weeks', () => {
    const iso = new Date(NOW - 2 * 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(iso, NOW)).toBe('2w');
  });

  it('falls back to a calendar date after 4 weeks', () => {
    const iso = new Date(NOW - 40 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(iso, NOW);
    expect(result).not.toMatch(/^\d+[mhdw]$/);
    expect(result).not.toBe('now');
  });

  it('never returns a negative duration for a future timestamp (clock skew)', () => {
    const iso = new Date(NOW + 60 * 1000).toISOString();
    expect(formatRelativeTime(iso, NOW)).toBe('now');
  });
});
