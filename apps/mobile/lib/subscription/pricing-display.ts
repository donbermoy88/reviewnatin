export type StorePriceQuote = {
  displayPrice?: string;
  amount?: number | null;
};

export type PricedProduct = {
  sku: string;
  pricePhp: number;
};

/** DB price is authoritative; store localized price overrides when available. */
export function resolveProductPrice(
  product: PricedProduct,
  storePrices: Record<string, StorePriceQuote | undefined>
): { display: string; amount: number } {
  const store = storePrices[product.sku];
  const amount =
    typeof store?.amount === 'number' && store.amount > 0 ? store.amount : product.pricePhp;
  const display = store?.displayPrice ?? formatPeso(product.pricePhp);
  return { display, amount };
}

export function formatPeso(amount: number): string {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}

export function planMonthlyEquivalent(amount: number, sku: string): number {
  const lower = sku.toLowerCase();
  if (lower.includes('six') || lower.includes('6month') || lower.includes('6_month')) {
    return Math.round(amount / 6);
  }
  if (lower.includes('year') || lower.includes('annual')) {
    return Math.round(amount / 12);
  }
  return amount;
}

export function savingsPercent(total: number, baseline: number): number {
  if (baseline <= 0 || total >= baseline) return 0;
  return Math.round(((baseline - total) / baseline) * 100);
}
