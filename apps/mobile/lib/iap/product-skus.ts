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
