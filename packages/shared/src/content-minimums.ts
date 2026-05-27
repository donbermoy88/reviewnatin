import type { ExamSlug } from './exams';

export type ContentMinimum = {
  questions: number;
  mockExams: number;
};

/**
 * Minimum published content for each exam track.
 * Phase 1 targets — enough for a solid practice bank at launch.
 * These are raised over time as content is added.
 */
export const CONTENT_MINIMUMS: Record<ExamSlug, ContentMinimum> = {
  'cse-professional':    { questions: 300, mockExams: 2 },
  'cse-subprofessional': { questions: 200, mockExams: 2 },
  'let-elementary':      { questions: 150, mockExams: 1 },
  'let-secondary':       { questions: 200, mockExams: 1 },
  pnle:                  { questions: 200, mockExams: 1 },
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
