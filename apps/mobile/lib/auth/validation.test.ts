import { describe, expect, it } from 'vitest';
import {
  normalizeEmail,
  normalizeDisplayName,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from './validation';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });
});

describe('validateEmail', () => {
  it('rejects empty email', () => {
    expect(validateEmail('')).toBe('Ilagay ang email mo.');
  });

  it('rejects invalid format', () => {
    expect(validateEmail('not-an-email')).toBe('Hindi valid ang email address.');
  });

  it('accepts valid email', () => {
    expect(validateEmail('reviewer@example.com')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('requires minimum length for sign-in', () => {
    expect(validatePassword('12345')).toBe('Dapat at least 6 characters ang password.');
  });

  it('requires 8 chars for sign-up', () => {
    expect(validatePassword('1234567', true)).toBe(
      'Para sa sign-up, gamitin ang at least 8 characters.'
    );
  });
});

describe('validatePasswordMatch', () => {
  it('detects mismatch', () => {
    expect(validatePasswordMatch('abc12345', 'abc12346')).toBe(
      'Hindi mag-match ang password at confirmation.'
    );
  });
});

describe('validateDisplayName', () => {
  it('rejects empty name', () => {
    expect(validateDisplayName('   ')).toBe('Ilagay ang display name mo.');
  });

  it('rejects too short name', () => {
    expect(validateDisplayName('A')).toBe('Dapat at least 2 characters ang display name.');
  });

  it('rejects invalid characters', () => {
    expect(validateDisplayName('User@name')).toBe(
      'Letters, numbers, spaces, at . _ - lang ang allowed.'
    );
  });

  it('accepts valid name', () => {
    expect(validateDisplayName('  Juan Dela Cruz  ')).toBeNull();
    expect(normalizeDisplayName('  Juan Dela Cruz  ')).toBe('Juan Dela Cruz');
  });
});
