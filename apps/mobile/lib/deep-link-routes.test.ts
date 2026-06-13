import { describe, expect, it, vi } from 'vitest';

import { isAuthDeepLink, routeFromUrl } from './deep-link-routes';

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
