import { Platform } from 'react-native';

/** Apple App Store product identifiers — see docs/05-pricing-iap.md */
export const IOS_PRODUCT_SKUS = [
  'com.reviewnatin.plus.monthly',
  'com.reviewnatin.plus.six_months',
  'com.reviewnatin.plus.yearly',
  'com.reviewnatin.exampass.cse_pro',
  'com.reviewnatin.exampass.cse_sub',
  'com.reviewnatin.exampass.let_elem',
  'com.reviewnatin.exampass.let_sec',
  'com.reviewnatin.exampass.pnle',
] as const;

/** Google Play product IDs — deferred until Play Console setup */
export const ANDROID_PRODUCT_SKUS = [
  'plus_monthly',
  'plus_six_months',
  'plus_yearly',
  'exam_pass_cse_pro',
  'exam_pass_cse_sub',
  'exam_pass_let_elem',
  'exam_pass_let_sec',
  'exam_pass_pnle',
] as const;

export type RestorePurchasesResult = {
  ok: boolean;
  restoredCount: number;
  message: string;
};

// The DB / entitlement layer keys products by the iOS-style dotted SKU
// (`com.reviewnatin.plus.monthly`), which is also the literal App Store id.
// Google Play uses the short ids in ANDROID_PRODUCT_SKUS (`plus_monthly`).
// The two arrays are intentionally index-aligned, so we derive the mapping
// from them rather than re-listing it.
const CANONICAL_TO_ANDROID: Record<string, string> = Object.fromEntries(
  IOS_PRODUCT_SKUS.map((sku, i) => [sku, ANDROID_PRODUCT_SKUS[i]])
);
const ANDROID_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  ANDROID_PRODUCT_SKUS.map((sku, i) => [sku, IOS_PRODUCT_SKUS[i]])
);

/** Canonical (DB / iOS) SKU → the store product id for the current platform. */
export function storeSkuForCanonical(canonicalSku: string): string {
  if (Platform.OS === 'android') return CANONICAL_TO_ANDROID[canonicalSku] ?? canonicalSku;
  return canonicalSku;
}

/** Store product id → canonical (DB) SKU. Inverse of storeSkuForCanonical. */
export function canonicalSkuForStore(storeId: string): string {
  if (Platform.OS === 'android') return ANDROID_TO_CANONICAL[storeId] ?? storeId;
  return storeId;
}
