import { describe, expect, it } from 'vitest';
import { planMonthlyEquivalent, resolveProductPrice, savingsPercent } from './pricing-display';

describe('resolveProductPrice', () => {
  it('uses DB price when store quote missing', () => {
    const result = resolveProductPrice({ sku: 'plus_monthly', pricePhp: 159 }, {});
    expect(result.amount).toBe(159);
    expect(result.display).toContain('159');
  });

  it('prefers store localized price when present', () => {
    const result = resolveProductPrice(
      { sku: 'plus_monthly', pricePhp: 159 },
      { plus_monthly: { displayPrice: '₱149.00', amount: 149 } }
    );
    expect(result.amount).toBe(149);
    expect(result.display).toBe('₱149.00');
  });
});

describe('planMonthlyEquivalent', () => {
  it('normalizes six-month and yearly SKUs', () => {
    expect(planMonthlyEquivalent(699, 'plus_six_months')).toBe(117);
    expect(planMonthlyEquivalent(1499, 'plus_yearly')).toBe(125);
  });
});

describe('savingsPercent', () => {
  it('returns zero when no savings', () => {
    expect(savingsPercent(699, 954)).toBe(27);
    expect(savingsPercent(954, 699)).toBe(0);
  });
});
