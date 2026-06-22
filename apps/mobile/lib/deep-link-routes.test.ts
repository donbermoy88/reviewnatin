import { describe, expect, it, vi } from 'vitest';

import { isAuthDeepLink, routeFromUrl, routeTargetFromUrl, verifyEmailParamsFromUrl } from './deep-link-routes';

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

  it('routes custom scheme checkout links with refs', () => {
    expect(routeFromUrl('reviewnatin://checkout?ref=RN-123')).toBe('/subscribe?ref=RN-123');
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

describe('verifyEmailParamsFromUrl', () => {
  it('extracts email from verify-email URLs', () => {
    expect(verifyEmailParamsFromUrl('reviewnatin://verify-email?email=Test@Mail.com')).toEqual({
      email: 'test@mail.com',
    });
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
