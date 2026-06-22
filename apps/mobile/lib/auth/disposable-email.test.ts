import { describe, expect, it } from 'vitest';
import { isDisposableEmail, validateEmailNotDisposable } from './disposable-email';

describe('disposable email', () => {
  it('blocks known disposable domains', () => {
    expect(isDisposableEmail('user@mailinator.com')).toBe(true);
    expect(isDisposableEmail('user@example.com')).toBe(false);
  });

  it('returns user-facing message for disposable', () => {
    expect(validateEmailNotDisposable('x@yopmail.com')).toMatch(/not allowed/i);
    expect(validateEmailNotDisposable('real@gmail.com')).toBeNull();
  });
});
