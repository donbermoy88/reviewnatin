/** Pure helpers mirroring server quiz grading (quiz_answers_apply_grading + complete_quiz_session). */

export function gradeSelectedAnswer(
  selectedChoiceId: string | null | undefined,
  correctChoiceId: string | null | undefined
): boolean {
  if (!selectedChoiceId || !correctChoiceId) return false;
  return selectedChoiceId === correctChoiceId;
}

export function computeScorePercent(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.round((correctCount * 10000) / totalCount) / 100;
}

export type GradableAnswer = {
  questionId: string;
  selectedChoiceId: string | null;
  correctChoiceId: string;
};

/** Client-side preview of session score before server persist (server is authoritative). */
export function summarizeQuizAnswers(answers: GradableAnswer[]): {
  correct: number;
  total: number;
  scorePercent: number;
} {
  const graded = answers.filter((a) => a.selectedChoiceId != null);
  const correct = graded.filter((a) =>
    gradeSelectedAnswer(a.selectedChoiceId, a.correctChoiceId)
  ).length;
  const total = graded.length;
  return {
    correct,
    total,
    scorePercent: computeScorePercent(correct, total),
  };
}
