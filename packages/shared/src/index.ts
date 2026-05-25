export * from './tokens';
export * from './exams';
export * from './content-minimums';
export * from './question-import';
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types';

export const SITE_URL = 'https://reviewnatinph.com';
export const ADMIN_URL = 'https://admin.reviewnatinph.com';
export const SUPPORT_EMAIL = 'support@reviewnatinph.com';

export const LEGAL = {
  privacyUrl: `${SITE_URL}/privacy`,
  termsUrl: `${SITE_URL}/terms`,
  disclaimersUrl: `${SITE_URL}/disclaimers`,
} as const;

export const DISCLAIMERS = {
  short:
    'ReviewNatin is not affiliated with CSC, PRC, or any government agency. No pass guarantee.',
  title: 'Exam & content disclaimer',
  body:
    'ReviewNatin is an independent study application. We are not affiliated with, endorsed by, or authorized by the Civil Service Commission (CSC), Professional Regulation Commission (PRC), or any government agency. Content is for review and practice only. Exam schedules, requirements, and official results must be verified on government websites. We do not guarantee exam passage.',
  subscription:
    'Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID or Google Play account settings. Payment is charged to your store account at confirmation of purchase.',
  officialLinks: [
    { label: 'CSC', url: 'https://www.csc.gov.ph' },
    { label: 'PRC / LERIS', url: 'https://online.prc.gov.ph' },
  ],
};
