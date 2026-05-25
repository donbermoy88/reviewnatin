import { describe, expect, it } from 'vitest';
import { formatExamCountdown } from './exam-countdown';

describe('formatExamCountdown', () => {
  it('counts days until target date', () => {
    const result = formatExamCountdown('2026-06-01', new Date('2026-05-23T12:00:00'));
    expect(result.daysLeft).toBe(9);
    expect(result.tone).toBe('soon');
  });

  it('marks exam day as urgent', () => {
    const result = formatExamCountdown('2026-05-23', new Date('2026-05-23T12:00:00'));
    expect(result.daysLeft).toBe(0);
    expect(result.tone).toBe('urgent');
  });

  it('handles past dates', () => {
    const result = formatExamCountdown('2026-01-01', new Date('2026-05-23T12:00:00'));
    expect(result.daysLeft).toBeLessThan(0);
    expect(result.tone).toBe('past');
  });
});
