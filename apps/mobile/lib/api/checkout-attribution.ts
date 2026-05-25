import { supabase, isSupabaseConfigured } from '../supabase';

export async function patchWebCheckoutAttribution(
  referenceCode: string,
  options?: { utmSource?: string; source?: string }
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { data, error } = await supabase.rpc('patch_web_checkout_attribution', {
    p_reference_code: referenceCode,
    p_utm_source: options?.utmSource ?? null,
    p_source: options?.source ?? null,
  });

  if (error) return false;
  const row = data as { ok?: boolean } | null;
  return !!row?.ok;
}
