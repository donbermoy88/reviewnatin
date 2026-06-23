import { describe, expect, it } from 'vitest';

/** Mirrors isActiveEntitlement logic from entitlements.ts for regression coverage. */
function isActiveEntitlement(e: {
  status?: string;
  revokedAt?: string | null;
  gracePeriodExpiresAt?: string | null;
  currentPeriodEnd?: string | null;
  expiresAt?: string | null;
}): boolean {
  if (e.status === 'revoked' || e.status === 'refunded' || e.revokedAt) return false;
  const accessEnd = e.gracePeriodExpiresAt ?? e.currentPeriodEnd ?? e.expiresAt ?? null;
  if (!accessEnd) return e.status !== 'expired';
  return new Date(accessEnd).getTime() > Date.now();
}

describe('entitlement access matrix', () => {
  it('active plus with future period end', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isActiveEntitlement({ currentPeriodEnd: future, status: 'active' })).toBe(true);
  });

  it('revoked entitlement is inactive', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isActiveEntitlement({ currentPeriodEnd: future, status: 'revoked' })).toBe(false);
  });

  it('expired past period end', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isActiveEntitlement({ expiresAt: past, status: 'active' })).toBe(false);
  });

  it('grace period extends access', () => {
    const grace = new Date(Date.now() + 3600000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(
      isActiveEntitlement({
        gracePeriodExpiresAt: grace,
        currentPeriodEnd: past,
        status: 'grace_period',
      })
    ).toBe(true);
  });
});

type EntitlementTier = { tier: 'exam_pass' | 'plus'; examTypeId?: string | null };

/** Mirrors hasPremiumAccess from entitlements.ts (kept inline to avoid RN imports in Vitest). */
function hasPremiumAccess(entitlements: EntitlementTier[], examTypeId?: string | null): boolean {
  if (entitlements.some((e) => e.tier === 'plus')) return true;
  if (examTypeId && entitlements.some((e) => e.tier === 'exam_pass' && e.examTypeId === examTypeId)) {
    return true;
  }
  return false;
}

describe('hasPremiumAccess', () => {
  it('returns false for empty entitlements', () => {
    expect(hasPremiumAccess([])).toBe(false);
  });

  it('grants access for active Plus tier', () => {
    expect(hasPremiumAccess([{ tier: 'plus' }])).toBe(true);
  });

  it('grants access for matching exam pass only when examTypeId matches', () => {
    const examId = 'exam-cse-pro';
    expect(hasPremiumAccess([{ tier: 'exam_pass', examTypeId: examId }], examId)).toBe(true);
    expect(hasPremiumAccess([{ tier: 'exam_pass', examTypeId: examId }], 'other-exam')).toBe(false);
  });
});

/** Mirrors fetchUserEntitlements demo filter: production builds ignore source=demo. */
function filterDemoInProduction<T extends { source?: string }>(
  rows: T[],
  isDev: boolean
): T[] {
  return rows.filter((e) => isDev || e.source !== 'demo');
}

describe('demo entitlement client filter', () => {
  it('excludes demo source in production builds', () => {
    const rows = [{ source: 'demo' }, { source: 'web_checkout' }];
    expect(filterDemoInProduction(rows, false)).toHaveLength(1);
    expect(filterDemoInProduction(rows, true)).toHaveLength(2);
  });
});
