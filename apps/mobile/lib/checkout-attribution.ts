import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeys } from './storage-keys';

const STORAGE_KEY = StorageKeys.checkoutAttribution;

export type CheckoutAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  source?: string;
};

function normalizeAttribution(input: CheckoutAttribution): CheckoutAttribution | null {
  const utmSource = input.utmSource?.trim();
  const utmMedium = input.utmMedium?.trim();
  const utmCampaign = input.utmCampaign?.trim();
  const source = input.source?.trim();

  if (!utmSource && !utmMedium && !utmCampaign && !source) return null;

  return {
    utmSource: utmSource || undefined,
    utmMedium: utmMedium || undefined,
    utmCampaign: utmCampaign || undefined,
    source: source || undefined,
  };
}

/** Canonical utm string stored in web_checkout_sessions.utm_source */
export function formatUtmSource(attribution: CheckoutAttribution): string | undefined {
  const parts = [
    attribution.utmSource,
    attribution.utmMedium,
    attribution.utmCampaign,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('|') : undefined;
}

export async function saveCheckoutAttribution(input: CheckoutAttribution): Promise<void> {
  const normalized = normalizeAttribution(input);
  if (!normalized) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export async function loadCheckoutAttribution(): Promise<CheckoutAttribution | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeAttribution(JSON.parse(raw) as CheckoutAttribution);
  } catch {
    return null;
  }
}

export async function captureAttributionFromQuery(params: Record<string, string | string[] | undefined>): Promise<void> {
  const pick = (key: string) => {
    const v = params[key];
    return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  };

  await saveCheckoutAttribution({
    utmSource: pick('utm_source') ?? pick('utmSource'),
    utmMedium: pick('utm_medium') ?? pick('utmMedium'),
    utmCampaign: pick('utm_campaign') ?? pick('utmCampaign'),
    source: pick('source'),
  });
}
