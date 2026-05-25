import type { UserEntitlement } from '../api/entitlements';

export function daysUntilExpiry(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function formatEntitlementSummary(entitlements: UserEntitlement[]): string | null {
  const plus = entitlements.find((e) => e.tier === 'plus');
  if (plus) {
    const days = daysUntilExpiry(plus.expiresAt);
    return days != null ? `ReviewNatin Plus · ${days} days left` : 'ReviewNatin Plus · active';
  }

  const passes = entitlements.filter((e) => e.tier === 'exam_pass');
  if (!passes.length) return null;

  const nearest = passes.reduce((best, e) => {
    const d = daysUntilExpiry(e.expiresAt);
    if (d == null) return best;
    if (best == null || d < best) return d;
    return best;
  }, null as number | null);

  if (nearest != null) {
    return `Exam Pass · ${nearest} day${nearest === 1 ? '' : 's'} left`;
  }

  return `Exam Pass · ${passes.length} active`;
}
