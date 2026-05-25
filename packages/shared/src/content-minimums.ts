import type { ExamSlug } from './exams';

export type ContentMinimum = {
  questions: number;
  mockExams: number;
};

/** Minimum published content before marketing an exam track */
export const CONTENT_MINIMUMS: Record<ExamSlug, ContentMinimum> = {
  'cse-professional': { questions: 1500, mockExams: 3 },
  'cse-subprofessional': { questions: 1500, mockExams: 3 },
  'let-elementary': { questions: 2000, mockExams: 2 },
  'let-secondary': { questions: 2000, mockExams: 2 },
  pnle: { questions: 2500, mockExams: 2 },
};

export type ContentCounts = {
  questions: number;
  mockExams: number;
};

export type ContentGateStatus = {
  slug: ExamSlug;
  minimum: ContentMinimum;
  counts: ContentCounts;
  meetsMinimum: boolean;
  questionPct: number;
  mockPct: number;
};

export function getContentMinimum(slug: string): ContentMinimum | null {
  if (slug in CONTENT_MINIMUMS) {
    return CONTENT_MINIMUMS[slug as ExamSlug];
  }
  return null;
}

export function evaluateContentGate(slug: string, counts: ContentCounts): ContentGateStatus | null {
  const minimum = getContentMinimum(slug);
  if (!minimum) return null;

  const questionPct =
    minimum.questions > 0 ? Math.min(100, Math.round((counts.questions / minimum.questions) * 100)) : 100;
  const mockPct =
    minimum.mockExams > 0 ? Math.min(100, Math.round((counts.mockExams / minimum.mockExams) * 100)) : 100;

  return {
    slug: slug as ExamSlug,
    minimum,
    counts,
    meetsMinimum: counts.questions >= minimum.questions && counts.mockExams >= minimum.mockExams,
    questionPct,
    mockPct,
  };
}
