import { describe, expect, it } from 'vitest';
import { resolveBetaCohort } from './beta-cohort';

describe('resolveBetaCohort', () => {
  it('returns guest when no user', () => {
    expect(resolveBetaCohort(null, false)).toBe('guest');
  });

  it('returns free for signed-in non-premium', () => {
    expect(resolveBetaCohort('user-1', false)).toBe('free');
  });

  it('returns premium when Plus active', () => {
    expect(resolveBetaCohort('user-1', true)).toBe('premium');
  });
});
