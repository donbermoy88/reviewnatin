import { describe, expect, it } from 'vitest';
import { evaluatePasswordStrength, validatePasswordStrength } from './password-strength';

describe('password strength', () => {
  it('scores weak passwords', () => {
    const r = evaluatePasswordStrength('abc');
    expect(r.score).toBe('weak');
    expect(r.label).toBe('Mahina pa');
    expect(r.checks.minLength).toBe(false);
  });

  it('scores fair passwords with partial checks', () => {
    const r = evaluatePasswordStrength('abcdefgh');
    expect(r.score).toBe('fair');
    expect(r.checks.minLength).toBe(true);
    expect(r.checks.hasUpper).toBe(false);
  });

  it('scores good passwords with three checks', () => {
    const r = evaluatePasswordStrength('Abcdefgh');
    expect(r.score).toBe('good');
    expect(r.label).toBe('Okay na');
  });

  it('scores strong passwords', () => {
    const r = evaluatePasswordStrength('Abcdefg1');
    expect(r.score).toBe('strong');
    expect(r.label).toBe('Malakas');
    expect(Object.values(r.checks).every(Boolean)).toBe(true);
  });

  it('requires complexity on signup', () => {
    expect(validatePasswordStrength('abcdefgh', true)).toMatch(/uppercase/i);
    expect(validatePasswordStrength('Abcdefg1', true)).toBeNull();
  });

  it('allows shorter passwords for sign-in only', () => {
    expect(validatePasswordStrength('abc123', false)).toBeNull();
    expect(validatePasswordStrength('', false)).toMatch(/enter your password/i);
  });

  it('enforces 8-character minimum on signup', () => {
    expect(validatePasswordStrength('Abc1', true)).toMatch(/8 characters/i);
  });
});
