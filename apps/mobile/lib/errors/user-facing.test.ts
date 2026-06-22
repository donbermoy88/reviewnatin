import { describe, expect, it } from 'vitest';
import { toUserFacingError } from './user-facing';

describe('toUserFacingError', () => {
  it('maps network errors', () => {
    expect(toUserFacingError(new Error('fetch failed'), 'network')).toMatch(/koneksyon/i);
  });

  it('maps auth errors via mapAuthError', () => {
    expect(toUserFacingError(new Error('Invalid login credentials'), 'auth')).toMatch(/Incorrect email/i);
  });

  it('hides long internal errors', () => {
    const long = 'permission denied for table users '.repeat(5);
    expect(toUserFacingError(new Error(long), 'load')).toMatch(/Hindi ma-load/i);
  });
});
