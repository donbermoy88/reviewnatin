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
    expect(validateEmail('')).toBe('Please enter your email address.');
  });

  it('rejects invalid format', () => {
    expect(validateEmail('not-an-email')).toBe('Please enter a valid email address.');
  });

  it('accepts valid email', () => {
    expect(validateEmail('reviewer@example.com')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('requires minimum length for sign-in', () => {
    expect(validatePassword('12345')).toBe('Password must be at least 6 characters.');
  });

  it('requires 8 chars for sign-up', () => {
    expect(validatePassword('1234567', true)).toBe(
      'For sign-up, use at least 8 characters.'
    );
  });

  it('requires complexity for sign-up', () => {
    expect(validatePassword('abcdefgh', true)).toMatch(/uppercase/i);
    expect(validatePassword('Abcdefg1', true)).toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  it('detects mismatch', () => {
    expect(validatePasswordMatch('abc12345', 'abc12346')).toBe(
      'Passwords do not match.'
    );
  });
});

describe('validateDisplayName', () => {
  it('rejects empty name', () => {
    expect(validateDisplayName('   ')).toBe('Please enter a display name.');
  });

  it('rejects too short name', () => {
    expect(validateDisplayName('A')).toBe('Display name must be at least 2 characters.');
  });

  it('rejects invalid characters', () => {
    expect(validateDisplayName('User@name')).toBe(
      'Only letters, numbers, spaces, and . _ - are allowed.'
    );
  });

  it('accepts valid name', () => {
    expect(validateDisplayName('  Juan Dela Cruz  ')).toBeNull();
    expect(normalizeDisplayName('  Juan Dela Cruz  ')).toBe('Juan Dela Cruz');
  });
});
