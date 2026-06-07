/** Subscription vs one-time SKUs — mirrors docs/05-pricing-iap.md and iap-verify server logic. */
export const SUBSCRIPTION_SKUS = new Set<string>([
  'com.reviewnatin.plus.monthly',
  'com.reviewnatin.plus.six_months',
  'com.reviewnatin.plus.yearly',
  'plus_monthly',
  'plus_six_months',
  'plus_yearly',
]);

export function isSubscriptionSku(productId: string): boolean {
  if (SUBSCRIPTION_SKUS.has(productId)) return true;
  return productId.includes('plus') && (
    productId.includes('monthly') ||
    productId.includes('six_months') ||
    productId.includes('yearly')
  );
}
