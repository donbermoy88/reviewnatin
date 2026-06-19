/* eslint-disable import/first */
import { describe, expect, it, vi } from 'vitest';

const platformState = vi.hoisted(() => ({ os: 'ios' }));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return platformState.os;
    },
  },
}));

import {
  ANDROID_PRODUCT_SKUS,
  IOS_PRODUCT_SKUS,
  canonicalSkuForStore,
  storeSkuForCanonical,
} from './product-skus';

describe('store SKU mapping', () => {
  it('keeps canonical and Android SKU lists aligned', () => {
    expect(ANDROID_PRODUCT_SKUS).toHaveLength(IOS_PRODUCT_SKUS.length);
  });

  it('keeps canonical SKUs unchanged on iOS', () => {
    platformState.os = 'ios';

    expect(storeSkuForCanonical('com.reviewnatin.plus.monthly')).toBe('com.reviewnatin.plus.monthly');
    expect(canonicalSkuForStore('com.reviewnatin.plus.monthly')).toBe('com.reviewnatin.plus.monthly');
  });

  it('maps canonical subscription SKUs to Google Play product IDs on Android', () => {
    platformState.os = 'android';

    expect(storeSkuForCanonical('com.reviewnatin.plus.monthly')).toBe('plus_monthly');
    expect(storeSkuForCanonical('com.reviewnatin.plus.six_months')).toBe('plus_six_months');
    expect(storeSkuForCanonical('com.reviewnatin.plus.yearly')).toBe('plus_yearly');
  });

  it('maps canonical exam pass SKUs to Google Play product IDs on Android', () => {
    platformState.os = 'android';

    expect(storeSkuForCanonical('com.reviewnatin.exampass.cse_pro')).toBe('exam_pass_cse_pro');
    expect(storeSkuForCanonical('com.reviewnatin.exampass.cse_sub')).toBe('exam_pass_cse_sub');
    expect(storeSkuForCanonical('com.reviewnatin.exampass.let_elem')).toBe('exam_pass_let_elem');
    expect(storeSkuForCanonical('com.reviewnatin.exampass.let_sec')).toBe('exam_pass_let_sec');
    expect(storeSkuForCanonical('com.reviewnatin.exampass.pnle')).toBe('exam_pass_pnle');
  });

  it('normalizes Google Play product IDs back to canonical entitlement SKUs', () => {
    platformState.os = 'android';

    expect(canonicalSkuForStore('plus_six_months')).toBe('com.reviewnatin.plus.six_months');
    expect(canonicalSkuForStore('exam_pass_cse_pro')).toBe('com.reviewnatin.exampass.cse_pro');
  });
});
