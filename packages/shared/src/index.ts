export * from './tokens';
export const EXAM_TYPES = [
  { slug: 'cse-professional', name: 'CSE Professional', category: 'Civil Service' },
  { slug: 'cse-subprofessional', name: 'CSE Subprofessional', category: 'Civil Service' },
  { slug: 'let-elementary', name: 'LET Elementary', category: 'PRC' },
  { slug: 'let-secondary', name: 'LET Secondary', category: 'PRC' },
  { slug: 'pnle', name: 'PNLE (Nursing)', category: 'PRC' },
] as const;

export type ExamSlug = (typeof EXAM_TYPES)[number]['slug'];

export const SITE_URL = 'https://reviewnatinph.com';
export const ADMIN_URL = 'https://admin.reviewnatinph.com';

export const DISCLAIMERS = {
  short:
    'ReviewNatin is not affiliated with CSC, PRC, or any government agency. No pass guarantee.',
  officialLinks: [
    { label: 'CSC', url: 'https://www.csc.gov.ph' },
    { label: 'PRC / LERIS', url: 'https://online.prc.gov.ph' },
  ],
};
