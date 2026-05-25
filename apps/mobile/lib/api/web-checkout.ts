import { supabase, isSupabaseConfigured } from '../supabase';
import { SITE_URL } from '@reviewnatin/shared';
import { formatUtmSource, type CheckoutAttribution } from '../checkout-attribution';

export type WebCheckoutProvider = 'gcash' | 'maya';

export type WebCheckoutSession = {
  sessionId: string;
  referenceCode: string;
  amountPhp: number;
  sku: string;
  tier: string;
  provider: WebCheckoutProvider;
  checkoutUrl: string;
};

export type WebCheckoutStatus = {
  found: boolean;
  referenceCode?: string;
  status?: 'pending' | 'submitted' | 'paid' | 'expired' | 'cancelled';
  amountPhp?: number;
  provider?: WebCheckoutProvider;
};

export async function createWebCheckoutSession(
  sku: string,
  provider: WebCheckoutProvider,
  options?: { source?: string; utmSource?: string }
): Promise<WebCheckoutSession> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.rpc('create_web_checkout_session', {
    p_sku: sku,
    p_provider: provider,
    p_source: options?.source ?? 'mobile_subscribe',
    p_utm_source: options?.utmSource ?? null,
  });

  if (error) throw error;

  const row = data as Record<string, unknown>;
  const referenceCode = row.reference_code as string;

  const checkoutParams = new URLSearchParams({ ref: referenceCode });
  if (options?.utmSource) checkoutParams.set('utm_source', options.utmSource);
  if (options?.source) checkoutParams.set('source', options.source);

  return {
    sessionId: row.session_id as string,
    referenceCode,
    amountPhp: row.amount_php as number,
    sku: row.sku as string,
    tier: row.tier as string,
    provider: row.provider as WebCheckoutProvider,
    checkoutUrl: `${SITE_URL}/checkout?${checkoutParams.toString()}`,
  };
}

export function checkoutAttributionOptions(attribution: CheckoutAttribution | null) {
  if (!attribution) {
    return { source: 'mobile_subscribe' as const };
  }
  return {
    source: attribution.source ?? 'mobile_subscribe',
    utmSource: formatUtmSource(attribution),
  };
}

export async function fetchWebCheckoutStatus(referenceCode: string): Promise<WebCheckoutStatus> {
  if (!isSupabaseConfigured) {
    return { found: false };
  }

  const { data, error } = await supabase.rpc('get_web_checkout_status', {
    p_reference_code: referenceCode,
  });

  if (error) throw error;

  const row = data as Record<string, unknown>;
  if (!row.found) return { found: false };

  return {
    found: true,
    referenceCode: row.reference_code as string,
    status: row.status as WebCheckoutStatus['status'],
    amountPhp: row.amount_php as number,
    provider: row.provider as WebCheckoutProvider,
  };
}

export async function submitWebCheckout(referenceCode: string, confirmDemo = false): Promise<{
  ok: boolean;
  status?: string;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'network' };
  }

  const { data, error } = await supabase.functions.invoke('web-checkout-submit', {
    body: { reference_code: referenceCode, confirm_demo: confirmDemo },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const body = data as { success?: boolean; status?: string; error?: string } | null;
  if (!body?.success) {
    return { ok: false, error: body?.error ?? 'submit_failed' };
  }

  return { ok: true, status: body.status };
}
