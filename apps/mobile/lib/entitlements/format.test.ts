import { describe, expect, it, vi } from 'vitest';

import type { UserEntitlement } from '../api/entitlements';
import { daysUntilExpiry, formatEntitlementSummary } from './format';

function entitlement(overrides: Partial<UserEntitlement>): UserEntitlement {
  return {
    id: 'entitlement-id',
    productId: 'product-id',
    examTypeId: null,
    tier: 'exam_pass',
    expiresAt: null,
    sku: 'com.reviewnatin.exampass.cse_pro',
    ...overrides,
  };
}

describe('entitlement formatting', () => {
  it('formats plus entitlements as ReviewNatin Plus', () => {
    expect(formatEntitlementSummary([entitlement({ tier: 'plus', sku: 'com.reviewnatin.plus.monthly' })])).toBe(
      'ReviewNatin Plus · active'
    );
  });

  it('formats exam-pass entitlements without calling them Plus', () => {
    expect(formatEntitlementSummary([entitlement({ tier: 'exam_pass' })])).toBe('Exam Pass · active');
  });

  it('formats multiple exam passes as exam passes', () => {
    expect(
      formatEntitlementSummary([
        entitlement({ id: 'one', tier: 'exam_pass' }),
        entitlement({ id: 'two', tier: 'exam_pass', sku: 'com.reviewnatin.exampass.pnle' }),
      ])
    ).toBe('Exam Passes · 2 active');
  });

  it('uses the nearest exam-pass expiry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T00:00:00.000Z'));
    expect(
      formatEntitlementSummary([
        entitlement({ id: 'one', tier: 'exam_pass', expiresAt: '2026-07-18T00:00:00.000Z' }),
        entitlement({ id: 'two', tier: 'exam_pass', expiresAt: '2026-06-19T00:00:00.000Z' }),
      ])
    ).toBe('Exam Pass · 1 day left');
    vi.useRealTimers();
  });

  it('returns null for invalid expiry dates', () => {
    expect(daysUntilExpiry('not-a-date')).toBeNull();
  });
});
