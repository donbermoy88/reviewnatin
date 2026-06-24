import { describe, expect, it, vi } from 'vitest';

import { buildBetaFeedbackMailto } from './beta-feedback';

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      version: '1.0.0',
      android: { versionCode: 37 },
    },
  },
}));

vi.mock('expo-device', () => ({
  modelName: 'Vivo Y36',
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 35 },
  Linking: {
    canOpenURL: vi.fn(async () => true),
    openURL: vi.fn(async () => undefined),
  },
}));

describe('beta-feedback', () => {
  it('prefills guest cohort and screen context for confused testers', () => {
    const mailto = buildBetaFeedbackMailto({
      cohortHint: 'guest',
      currentRoute: '/settings/support-card',
    });

    const decoded = decodeURIComponent(mailto);
    expect(decoded).toContain('[ReviewNatin Beta] Issue report (guest)');
    expect(decoded).toContain('Device: Vivo Y36');
    expect(decoded).toContain('OS: android 35');
    expect(decoded).toContain('Cohort: guest');
    expect(decoded).toContain('User ID: guest');
    expect(decoded).toContain('Screen: /settings/support-card');
  });
});
