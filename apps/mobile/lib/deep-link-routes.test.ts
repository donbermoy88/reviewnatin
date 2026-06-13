import { describe, expect, it, vi } from 'vitest';

import { isAuthDeepLink, routeFromNotificationData, routeFromUrl } from './deep-link-routes';

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

  it('routes removed tutor deep links to subscribe instead of a live tutor screen', () => {
    expect(routeFromUrl('reviewnatin://tutor')).toBe('/subscribe');
    expect(routeFromUrl('reviewnatin://ai-tutor')).toBe('/subscribe');
  });
});

describe('routeFromNotificationData', () => {
  it('routes removed tutor notification targets to subscribe instead of a live tutor screen', () => {
    expect(routeFromNotificationData({ screen: 'tutor' })).toBe('/subscribe');
    expect(routeFromNotificationData({ url: 'reviewnatin://tutor' })).toBe('/subscribe');
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
