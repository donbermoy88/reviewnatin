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
  sku: string;
};

export async function fetchSubscriptionProducts(): Promise<SubscriptionProduct[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('subscription_products')
    .select('id, sku, tier, exam_type_id, price_php, duration_days')
    .order('price_php');

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    sku: row.sku,
    tier: row.tier,
    examTypeId: row.exam_type_id,
    pricePhp: row.price_php,
    durationDays: row.duration_days,
  }));
}

export async function fetchUserEntitlements(userId: string): Promise<UserEntitlement[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('user_entitlements')
    .select('id, product_id, exam_type_id, expires_at, source, subscription_products ( sku, tier )')
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
        sku: sp?.sku ?? '',
        source: row.source as string | undefined,
      };
    })
    .filter((e) => !e.expiresAt || new Date(e.expiresAt).getTime() > now)
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
