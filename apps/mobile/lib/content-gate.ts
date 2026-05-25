import { evaluateContentGate, type ContentGateStatus } from '@reviewnatin/shared';
import { fetchExamQuestionCount } from './api/catalog';
import { fetchMockExams } from './api/mock-exams';

export type { ContentGateStatus };

export async function fetchContentGateStatus(examSlug: string): Promise<ContentGateStatus | null> {
  const [questions, mocks] = await Promise.all([
    fetchExamQuestionCount(examSlug),
    fetchMockExams(examSlug),
  ]);

  return evaluateContentGate(examSlug, {
    questions,
    mockExams: mocks.length,
  });
}
