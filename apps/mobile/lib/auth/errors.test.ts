import { describe, expect, it } from 'vitest';

import { isEmailNotConfirmedError, mapAuthError } from './errors';

describe('isEmailNotConfirmedError', () => {
  it('detects Supabase email-not-confirmed message', () => {
    expect(isEmailNotConfirmedError('Email not confirmed')).toBe(true);
    expect(isEmailNotConfirmedError('Invalid login credentials')).toBe(false);
  });
});

describe('mapAuthError — OTP and verification', () => {
  it('maps expired OTP tokens', () => {
    expect(mapAuthError('Token has expired or is invalid')).toMatch(/expired/i);
    expect(mapAuthError('otp_expired')).toMatch(/expired/i);
  });

  it('maps invalid OTP codes', () => {
    expect(mapAuthError('Invalid OTP')).toMatch(/mali ang verification code/i);
    expect(mapAuthError('invalid token')).toMatch(/mali ang verification code/i);
  });

  it('maps unconfirmed email on login', () => {
    expect(mapAuthError('Email not confirmed')).toMatch(/i-verify muna/i);
  });

  it('maps rate limit errors', () => {
    expect(mapAuthError('Rate limit exceeded')).toMatch(/masyadong maraming attempt/i);
    expect(mapAuthError('Too many requests')).toMatch(/masyadong maraming attempt/i);
  });
});
