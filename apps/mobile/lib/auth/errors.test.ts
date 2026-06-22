import { describe, expect, it } from 'vitest';

import { mapAuthError } from './errors';

describe('mapAuthError — OTP and verification', () => {
  it('maps expired OTP tokens', () => {
    expect(mapAuthError('Token has expired or is invalid')).toMatch(/expired/i);
    expect(mapAuthError('otp_expired')).toMatch(/expired/i);
  });

  it('maps invalid OTP codes', () => {
    expect(mapAuthError('Invalid OTP')).toMatch(/invalid verification code/i);
    expect(mapAuthError('invalid token')).toMatch(/invalid verification code/i);
  });

  it('maps unconfirmed email on login', () => {
    expect(mapAuthError('Email not confirmed')).toMatch(/confirm your email/i);
  });

  it('maps rate limit errors', () => {
    expect(mapAuthError('Rate limit exceeded')).toMatch(/too many attempts/i);
    expect(mapAuthError('Too many requests')).toMatch(/too many attempts/i);
  });
});
