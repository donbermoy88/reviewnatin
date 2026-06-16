import { supabase, isSupabaseConfigured } from '../supabase';

export type SubscriptionProduct = {
  id: string;
  sku: string;
  tier: 'free' | 'exam_pass' | 'plus';
  examTypeId: string | null;
  pricePhp: number;
  durationDays: number | null;
};

export type UserEntitlement = {
  id: string;
  productId: string;
  examTypeId: string | null;
  tier: 'exam_pass' | 'plus';
  expiresAt: string | null;
  currentPeriodEnd?: string | null;
  currentPeriodStart?: string | null;
  sku: string;
  source?: string;
  status?: 'active' | 'cancelled' | 'expired' | 'billing_retry' | 'grace_period' | 'refunded' | 'revoked';
  autoRenewStatus?: boolean | null;
  cancelledAt?: string | null;
  gracePeriodExpiresAt?: string | null;
  revokedAt?: string | null;
  lastVerifiedAt?: string | null;
  originalTransactionId?: string | null;
  storeProductId?: string | null;
};

// Last-resort offline fallback ONLY. Source-of-truth precedence for the
// displayed price is: store-reported localized price (resolved at display time
// via fetchStoreProductPricing) > DB `price_php` > this map. It exists so a
// build with no store connection and an incomplete `subscription_products` row
// still renders *something*; it must never silently shadow the DB or the store.
const CANONICAL_PRODUCT_PRICING: Record<string, { pricePhp: number; durationDays: number | null }> = {
  'com.reviewnatin.plus.monthly': { pricePhp: 159, durationDays: 30 },
  'com.reviewnatin.plus.six_months': { pricePhp: 699, durationDays: 180 },
  'com.reviewnatin.plus.yearly': { pricePhp: 1499, durationDays: 365 },
  'com.reviewnatin.exampass.cse_pro': { pricePhp: 599, durationDays: 180 },
  'com.reviewnatin.exampass.cse_sub': { pricePhp: 599, durationDays: 180 },
  'com.reviewnatin.exampass.let_elem': { pricePhp: 699, durationDays: 180 },
  'com.reviewnatin.exampass.let_sec': { pricePhp: 699, durationDays: 180 },
  'com.reviewnatin.exampass.pnle': { pricePhp: 799, durationDays: 180 },
};

function entitlementAccessEnd(e: Pick<UserEntitlement, 'expiresAt' | 'currentPeriodEnd' | 'gracePeriodExpiresAt'>): string | null {
  return e.gracePeriodExpiresAt ?? e.currentPeriodEnd ?? e.expiresAt ?? null;
}

function isActiveEntitlement(e: UserEntitlement, now = Date.now()): boolean {
  if (e.status === 'revoked' || e.status === 'refunded' || e.revokedAt) return false;
  const accessEnd = entitlementAccessEnd(e);
  if (!accessEnd) return e.status !== 'expired';
  return new Date(accessEnd).getTime() > now;
}

export async function fetchSubscriptionProducts(): Promise<SubscriptionProduct[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('subscription_products')
    .select('id, sku, tier, exam_type_id, price_php, duration_days')
    .order('price_php');

  if (error) throw error;

  return (data ?? []).map((row) => {
    const canonical = CANONICAL_PRODUCT_PRICING[row.sku];
    return {
      id: row.id,
      sku: row.sku,
      tier: row.tier,
      examTypeId: row.exam_type_id,
      // DB is authoritative over the offline fallback map; the store-localized
      // price (resolved in the UI) overrides both.
      pricePhp: row.price_php ?? canonical?.pricePhp ?? 0,
      durationDays: row.duration_days ?? canonical?.durationDays ?? null,
    };
  });
}

export async function fetchUserEntitlements(userId: string): Promise<UserEntitlement[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('user_entitlements')
    .select('id, product_id, exam_type_id, expires_at, source, status, auto_renew_status, current_period_start, current_period_end, store_product_id, original_transaction_id, cancelled_at, grace_period_expires_at, revoked_at, last_verified_at, subscription_products ( sku, tier )')
    .eq('user_id', userId);

  if (error) throw error;

  const now = Date.now();
  return (data ?? [])
    .map((row) => {
      const sp = row.subscription_products as unknown as { sku: string; tier: string } | null;
      return {
        id: row.id,
        productId: row.product_id,
        examTypeId: row.exam_type_id,
        tier: (sp?.tier ?? 'exam_pass') as 'exam_pass' | 'plus',
        expiresAt: row.expires_at,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        sku: sp?.sku ?? '',
        source: row.source as string | undefined,
        status: row.status,
        autoRenewStatus: row.auto_renew_status,
        cancelledAt: row.cancelled_at,
        gracePeriodExpiresAt: row.grace_period_expires_at,
        revokedAt: row.revoked_at,
        lastVerifiedAt: row.last_verified_at,
        originalTransactionId: row.original_transaction_id,
        storeProductId: row.store_product_id,
      };
    })
    .filter((e) => isActiveEntitlement(e, now))
    .filter((e) => __DEV__ || e.source !== 'demo');
}

export function hasPremiumAccess(
  entitlements: UserEntitlement[],
  examTypeId?: string | null
): boolean {
  if (entitlements.some((e) => e.tier === 'plus')) return true;
  if (examTypeId && entitlements.some((e) => e.tier === 'exam_pass' && e.examTypeId === examTypeId)) {
    return true;
  }
  return false;
}

/** Dev-only: grant entitlement via secure RPC (no direct table INSERT). */
export async function grantDemoEntitlement(userId: string, productId: string, examTypeId?: string) {
  if (!__DEV__) {
    throw new Error('Demo purchases are disabled in production builds.');
  }
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.rpc('grant_demo_entitlement', {
    p_product_id: productId,
    p_exam_type_id: examTypeId ?? null,
  });

  if (error) throw error;
}
