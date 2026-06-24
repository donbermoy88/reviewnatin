import { describe, expect, it } from 'vitest';
import { toUserFacingError } from './user-facing';

describe('toUserFacingError', () => {
  it('maps network errors', () => {
    expect(toUserFacingError(new Error('fetch failed'), 'network')).toMatch(/koneksyon/i);
  });

  it('maps auth errors via mapAuthError', () => {
    expect(toUserFacingError(new Error('Invalid login credentials'), 'auth')).toMatch(/mali ang email/i);
  });

  it('preserves already-friendly Taglish copy', () => {
    expect(toUserFacingError(new Error('Hindi ma-load ang data'), 'load')).toBe('Hindi ma-load ang data');
  });

  it('maps rate limit errors', () => {
    expect(toUserFacingError(new Error('Too many requests'), 'load')).toMatch(/Sobrang daming try/i);
  });
});
