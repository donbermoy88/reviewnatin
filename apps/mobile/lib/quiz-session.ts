/**
 * Pure helpers for assembling a quiz session's answer set and score.
 *
 * These were inlined in the ~1,150-line practice/quiz screen's `finishQuiz`
 * orchestration, untested. Extracting them keeps the screen thinner and lets the
 * answer-assembly / scoring logic be unit-tested in isolation. Server grading
 * remains authoritative; these mirror the client-side preview the screen shows.
 */
import type { AnswerCheckResult } from './api/catalog';
import type { Question, QuizAnswerRecord } from './types';

/**
 * Append the current question's graded answer to the running record for
 * non-strict modes. No-op unless the question was answered and revealed, and
 * never double-records the same question.
 */
export function finalizeAnswers(
  prev: QuizAnswerRecord[],
  current: Question | undefined,
  selected: string | null,
  revealed: boolean,
  timeSpentSeconds: number,
  revealResult: AnswerCheckResult | null
): QuizAnswerRecord[] {
  if (!current || !selected || !revealed || !revealResult) return prev;
  if (prev.some((a) => a.questionId === current.id)) return prev;
  return [
    ...prev,
    {
      questionId: current.id,
      selectedChoiceId: selected,
      isCorrect: revealResult.isCorrect,
      timeSpentSeconds,
    },
  ];
}

/**
 * Build the answer set for a strict exam (mock/board) from its answer-sheet.
 * Grading is deferred to the server, so `isCorrect` starts `false` (and
 * `timeSpentSeconds` is not tracked per item in this mode). Only answered
 * questions are included, preserving question order.
 */
export function buildStrictAnswers(
  questions: Question[],
  answersByIndex: Record<number, string>
): QuizAnswerRecord[] {
  return questions.flatMap((q, i) =>
    answersByIndex[i]
      ? [{ questionId: q.id, selectedChoiceId: answersByIndex[i], isCorrect: false, timeSpentSeconds: 0 }]
      : []
  );
}

/**
 * Integer score percent over the full question count (unanswered items count as
 * wrong), matching the screen's pre-server display value.
 */
export function computeSessionScore(answers: QuizAnswerRecord[], totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  const correct = answers.filter((a) => a.isCorrect).length;
  return Math.round((correct / totalQuestions) * 100);
}
