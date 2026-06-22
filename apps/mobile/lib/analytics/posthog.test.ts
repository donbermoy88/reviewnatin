import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('posthog-react-native', () => ({
  default: class MockPostHog {
    capture() {}
    screen() {}
    identify() {}
    reset() {}
    flush() {}
  },
}));

describe('posthog config', () => {
  const originalKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const originalHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    else process.env.EXPO_PUBLIC_POSTHOG_API_KEY = originalKey;
    if (originalHost === undefined) delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
    else process.env.EXPO_PUBLIC_POSTHOG_HOST = originalHost;
  });

  it('is disabled without API key', async () => {
    delete process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    const { isPostHogEnabled } = await import('./posthog');
    expect(isPostHogEnabled()).toBe(false);
  });

  it('is enabled with API key', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_test';
    const { isPostHogEnabled, getPostHogHost } = await import('./posthog');
    expect(isPostHogEnabled()).toBe(true);
    expect(getPostHogHost()).toBe('https://us.i.posthog.com');
  });

  it('uses custom host when set', async () => {
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com';
    const { getPostHogHost } = await import('./posthog');
    expect(getPostHogHost()).toBe('https://eu.i.posthog.com');
  });
});
