import { describe, expect, it } from 'vitest';
import { isEmailVerified } from './email-verification';

describe('isEmailVerified', () => {
  it('returns false for null user', () => {
    expect(isEmailVerified(null)).toBe(false);
  });

  it('returns true when email_confirmed_at is set', () => {
    expect(
      isEmailVerified({
        email_confirmed_at: '2026-01-01T00:00:00Z',
        app_metadata: { provider: 'email' },
      } as never)
    ).toBe(true);
  });

  it('returns true for OAuth providers without email_confirmed_at', () => {
    expect(
      isEmailVerified({
        email_confirmed_at: null,
        app_metadata: { provider: 'google', providers: ['google'] },
      } as never)
    ).toBe(true);
  });

  it('returns false for unverified email signup', () => {
    expect(
      isEmailVerified({
        email_confirmed_at: null,
        app_metadata: { provider: 'email', providers: ['email'] },
      } as never)
    ).toBe(false);
  });
});
