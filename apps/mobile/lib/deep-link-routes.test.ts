import { describe, expect, it, vi } from 'vitest';

import {
  isAuthDeepLink,
  isVerifyEmailDeepLink,
  routeFromNativeIntentPath,
  routeFromUrl,
  routeTargetFromUrl,
  verifyEmailParamsFromUrl,
} from './deep-link-routes';

vi.mock('expo-linking', () => ({
  parse: (url: string) => {
    const parsed = new URL(url);
    return {
      hostname: parsed.hostname,
      path: parsed.pathname,
      queryParams: Object.fromEntries(parsed.searchParams.entries()),
    };
  },
}));

describe('routeFromUrl', () => {
  it('routes custom scheme subscribe links', () => {
    expect(routeFromUrl('reviewnatin://subscribe')).toBe('/subscribe');
  });

  it('routes custom scheme checkout links to subscribe without ref', () => {
    expect(routeFromUrl('reviewnatin://checkout?ref=RN-123')).toBe('/subscribe');
  });

  it('routes verify-email links with email query params', () => {
    expect(routeFromUrl('reviewnatin://verify-email?email=f1.agent@reviewnatinph.com')).toBe(
      '/(auth)/verify-email?email=f1.agent%40reviewnatinph.com'
    );
  });

  it('routes verify-email links with displayName', () => {
    expect(
      routeFromUrl('reviewnatin://verify-email?email=a@b.com&displayName=Mara%20Santos')
    ).toBe('/(auth)/verify-email?email=a%40b.com&displayName=Mara+Santos');
  });

  it('routes practice quiz deep links', () => {
    expect(routeFromUrl('reviewnatin://practice')).toBe('/practice/quiz');
  });
});

describe('routeTargetFromUrl', () => {
  it('returns pathname and params for verify-email', () => {
    expect(routeTargetFromUrl('reviewnatin://verify-email?email=f1@reviewnatinph.com')).toEqual({
      pathname: '/(auth)/verify-email',
      params: { email: 'f1@reviewnatinph.com' },
    });
  });
});

describe('routeFromNativeIntentPath', () => {
  it('normalizes raw Android custom-scheme cold-start intents', () => {
    expect(routeFromNativeIntentPath('reviewnatin://subscribe')).toBe('/subscribe');
    expect(routeFromNativeIntentPath('reviewnatin://signup')).toBe('/(auth)/signup');
    expect(routeFromNativeIntentPath('reviewnatin://login')).toBe('/(auth)/login');
    expect(routeFromNativeIntentPath('reviewnatin://practice')).toBe('/practice/quiz');
    expect(routeFromNativeIntentPath('reviewnatin://verify-email?email=f1.agent@reviewnatinph.com')).toBe(
      '/(auth)/verify-email?email=f1.agent%40reviewnatinph.com'
    );
  });

  it('normalizes bare native paths', () => {
    expect(routeFromNativeIntentPath('/subscribe')).toBe('/subscribe');
    expect(routeFromNativeIntentPath('practice')).toBe('/practice/quiz');
  });

  it('preserves auth token links for Supabase-owned screens', () => {
    expect(routeFromNativeIntentPath('reviewnatin://auth/callback#access_token=abc')).toBe(
      'reviewnatin://auth/callback#access_token=abc'
    );
  });
});

describe('verifyEmailParamsFromUrl', () => {
  it('extracts email from verify-email URLs', () => {
    expect(verifyEmailParamsFromUrl('reviewnatin://verify-email?email=Test@Mail.com')).toEqual({
      email: 'test@mail.com',
    });
  });

  it('extracts email via regex when path parsing differs', () => {
    expect(verifyEmailParamsFromUrl('reviewnatin:///verify-email?email=a%40b.com')).toEqual({
      email: 'a@b.com',
    });
  });
});

describe('isVerifyEmailDeepLink', () => {
  it('detects verify-email URLs', () => {
    expect(isVerifyEmailDeepLink('reviewnatin://verify-email?email=a@b.com')).toBe(true);
    expect(isVerifyEmailDeepLink('reviewnatin://signup')).toBe(false);
    expect(isVerifyEmailDeepLink(null)).toBe(false);
  });
});

describe('isAuthDeepLink', () => {
  it('flags recovery and token links so the nav handler skips them', () => {
    expect(isAuthDeepLink('reviewnatin://auth/callback#access_token=abc')).toBe(true);
    expect(isAuthDeepLink('reviewnatin://(auth)/reset-password?type=recovery')).toBe(true);
    expect(isAuthDeepLink('https://reviewnatinph.com/reset-password')).toBe(true);
  });

  it('does not flag normal navigation links', () => {
    expect(isAuthDeepLink('reviewnatin://subscribe')).toBe(false);
    expect(isAuthDeepLink('reviewnatin://barkada?code=XY')).toBe(false);
  });
});
