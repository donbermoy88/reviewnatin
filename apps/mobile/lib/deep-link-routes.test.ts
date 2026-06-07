import { describe, expect, it, vi } from 'vitest';

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

import { routeFromUrl } from './deep-link-routes';

describe('routeFromUrl', () => {
  it('routes custom scheme subscribe links', () => {
    expect(routeFromUrl('reviewnatin://subscribe')).toBe('/subscribe');
  });

  it('routes custom scheme checkout links with refs', () => {
    expect(routeFromUrl('reviewnatin://checkout?ref=RN-123')).toBe('/subscribe?ref=RN-123');
  });
});
