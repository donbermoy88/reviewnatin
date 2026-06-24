export const EXAM_TYPES = [
  { slug: 'cse-professional', name: 'CSE Professional', category: 'Civil Service' },
  { slug: 'cse-subprofessional', name: 'CSE Subprofessional', category: 'Civil Service' },
  { slug: 'pnle', name: 'PNLE (Nursing)', category: 'PRC' },
  { slug: 'let-elementary', name: 'LET Elementary', category: 'PRC' },
  { slug: 'let-secondary', name: 'LET Secondary', category: 'PRC' },
] as const;

export type ExamSlug = (typeof EXAM_TYPES)[number]['slug'];

export const DEFAULT_EXAM_SLUG: ExamSlug = 'cse-professional';

export type ExamCatalogItem = {
  slug: ExamSlug;
  name: string;
  shortName: string;
  abbr: string;
  sub: string;
  category: 'Civil Service' | 'PRC';
  color: string;
  bg: string;
  tag?: 'Popular' | 'New';
  users: string;
  sortOrder: number;
};

/** Onboarding + catalog UI — slugs match `exam_types` in Supabase */
export const EXAM_CATALOG: ExamCatalogItem[] = [
  {
    slug: 'cse-professional',
    name: 'CSE Professional',
    shortName: 'CSE Full',
    abbr: 'CSE',
    sub: 'Career Service Examination — Professional Level',
    category: 'Civil Service',
    color: '#08245C',
    bg: '#E5EAF5',
    tag: 'Popular',
    users: 'New',
    sortOrder: 1,
  },
  {
    slug: 'cse-subprofessional',
    name: 'CSE Subprofessional',
    shortName: 'CSE Sub',
    abbr: 'CSE',
    sub: 'Career Service Examination — Sub-Professional Level',
    category: 'Civil Service',
    color: '#0B5FFF',
    bg: '#E8F0FF',
    users: 'New',
    sortOrder: 2,
  },
  {
    slug: 'pnle',
    name: 'PNLE (Nursing)',
    shortName: 'PNLE',
    abbr: 'PNLE',
    sub: 'Philippine Nurse Licensure Examination',
    category: 'PRC',
    color: '#22C55E',
    bg: '#E4F8EC',
    users: 'New',
    sortOrder: 3,
  },
  {
    slug: 'let-elementary',
    name: 'LET Elementary',
    shortName: 'LET Elementary',
    abbr: 'LET',
    sub: 'Licensure Examination for Teachers — Elementary',
    category: 'PRC',
    color: '#0B5FFF',
    bg: '#E8F0FF',
    users: 'New',
    sortOrder: 4,
  },
  {
    slug: 'let-secondary',
    name: 'LET Secondary',
    shortName: 'LET Secondary',
    abbr: 'LET',
    sub: 'Licensure Examination for Teachers — Secondary',
    category: 'PRC',
    color: '#7B2CBF',
    bg: '#F1E8FA',
    users: 'New',
    sortOrder: 5,
  },
];

export function getExamCatalogItem(slug: string): ExamCatalogItem | undefined {
  return EXAM_CATALOG.find((e) => e.slug === slug);
}

export function getExamCategoryLabel(slug: string): string {
  const item = getExamCatalogItem(slug);
  if (!item) return 'EXAM';
  return item.category === 'Civil Service' ? 'CSE · CIVIL SERVICE' : 'PRC · BOARD EXAM';
}

/** LET Secondary major fields — stored in user_exam_goals.major_slug */
export const LET_SECONDARY_MAJORS = [
  { slug: 'english', name: 'English' },
  { slug: 'mathematics', name: 'Mathematics' },
  { slug: 'filipino', name: 'Filipino' },
  { slug: 'social-studies-araling-panlipunan', name: 'Social Studies / Araling Panlipunan' },
  { slug: 'general-science', name: 'General Science' },
  { slug: 'culture-and-arts-education', name: 'Culture and Arts Education' },
  { slug: 'biological-science', name: 'Biological Science' },
  { slug: 'physical-science', name: 'Physical Science' },
  { slug: 'values-education', name: 'Values Education' },
  { slug: 'mapeh', name: 'MAPEH' },
  { slug: 'tle', name: 'Technology and Livelihood Education (TLE)' },
] as const;

export type OnboardingLevel = 'beginner' | 'average' | 'advanced';

export const ONBOARDING_LEVELS: {
  id: OnboardingLevel;
  label: string;
  sub: string;
  emoji: string;
}[] = [
  { id: 'beginner', label: 'Beginner', sub: 'Just starting exam prep', emoji: '🌱' },
  { id: 'average', label: 'Average', sub: 'Have some review done', emoji: '📖' },
  { id: 'advanced', label: 'Advanced', sub: 'Retaker or have a solid base', emoji: '🎯' },
];
