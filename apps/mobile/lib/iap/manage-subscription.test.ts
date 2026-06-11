/* eslint-disable import/first */
import { describe, expect, it, vi } from 'vitest';

const platformState = vi.hoisted(() => ({ os: 'ios' }));

vi.mock('react-native', () => ({
  Linking: { openURL: vi.fn() },
  Platform: {
    get OS() {
      return platformState.os;
    },
  },
}));

import {
  entitlementPeriodDescription,
  entitlementPeriodTitle,
  entitlementStatusLabel,
  manageSubscriptionUrl,
} from './manage-subscription';
import type { UserEntitlement } from '../api/entitlements';

const basePlus: UserEntitlement = {
  id: 'ent-1',
  productId: 'prod-1',
  examTypeId: null,
  tier: 'plus',
  sku: 'com.reviewnatin.plus.six_months',
  source: 'iap',
  expiresAt: '2026-12-31T00:00:00Z',
  currentPeriodEnd: '2026-12-31T00:00:00Z',
  status: 'active',
  autoRenewStatus: true,
};

describe('manageSubscriptionUrl', () => {
  it('opens Apple subscription management on iOS', () => {
    platformState.os = 'ios';
    expect(manageSubscriptionUrl(basePlus)).toBe('https://apps.apple.com/account/subscriptions');
  });

  it('opens product-specific Google Play subscription management on Android', () => {
    platformState.os = 'android';
    expect(manageSubscriptionUrl(basePlus)).toBe(
      'https://play.google.com/store/account/subscriptions?sku=plus_six_months&package=ph.reviewnatin.app'
    );
  });
});

describe('entitlement lifecycle labels', () => {
  it('labels cancelled subscriptions without removing paid access', () => {
    const entitlement: UserEntitlement = {
      ...basePlus,
      status: 'cancelled',
      autoRenewStatus: false,
    };

    expect(entitlementStatusLabel(entitlement)).toBe('CANCELLED');
    expect(entitlementPeriodTitle(entitlement, true)).toBe('Access until Dec 31, 2026');
    expect(entitlementPeriodDescription(entitlement, true)).toContain('Renewal is cancelled');
  });

  it('uses prepaid wording for web checkout access', () => {
    const entitlement: UserEntitlement = {
      ...basePlus,
      source: 'web_gcash',
      autoRenewStatus: false,
    };

    expect(entitlementPeriodTitle(entitlement, false)).toBe('Access until Dec 31, 2026');
    expect(entitlementPeriodDescription(entitlement, false)).toContain('prepaid');
  });
});
