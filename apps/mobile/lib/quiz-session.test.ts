import { describe, expect, it } from 'vitest';
import { buildStrictAnswers, computeSessionScore, finalizeAnswers } from './quiz-session';
import type { Question, QuizAnswerRecord } from './types';
import type { AnswerCheckResult } from './api/catalog';

const q = (id: string): Question => ({ id } as Question);
const reveal = (isCorrect: boolean): AnswerCheckResult => ({ isCorrect } as AnswerCheckResult);

describe('finalizeAnswers', () => {
  it('appends a graded answer when answered + revealed', () => {
    const out = finalizeAnswers([], q('q1'), 'c1', true, 12, reveal(true));
    expect(out).toEqual([
      { questionId: 'q1', selectedChoiceId: 'c1', isCorrect: true, timeSpentSeconds: 12 },
    ]);
  });

  it('is a no-op when not revealed / not selected / no result', () => {
    const prev: QuizAnswerRecord[] = [];
    expect(finalizeAnswers(prev, q('q1'), 'c1', false, 1, reveal(true))).toBe(prev);
    expect(finalizeAnswers(prev, q('q1'), null, true, 1, reveal(true))).toBe(prev);
    expect(finalizeAnswers(prev, q('q1'), 'c1', true, 1, null)).toBe(prev);
    expect(finalizeAnswers(prev, undefined, 'c1', true, 1, reveal(true))).toBe(prev);
  });

  it('never double-records the same question', () => {
    const prev: QuizAnswerRecord[] = [
      { questionId: 'q1', selectedChoiceId: 'c1', isCorrect: true, timeSpentSeconds: 5 },
    ];
    expect(finalizeAnswers(prev, q('q1'), 'c2', true, 9, reveal(false))).toBe(prev);
  });
});

describe('buildStrictAnswers', () => {
  it('includes only answered questions, in order, ungraded', () => {
    const questions = [q('q1'), q('q2'), q('q3')];
    const out = buildStrictAnswers(questions, { 0: 'a', 2: 'c' });
    expect(out).toEqual([
      { questionId: 'q1', selectedChoiceId: 'a', isCorrect: false, timeSpentSeconds: 0 },
      { questionId: 'q3', selectedChoiceId: 'c', isCorrect: false, timeSpentSeconds: 0 },
    ]);
  });

  it('returns empty when nothing is answered', () => {
    expect(buildStrictAnswers([q('q1')], {})).toEqual([]);
  });
});

describe('computeSessionScore', () => {
  it('scores correct over total question count (unanswered = wrong)', () => {
    const answers: QuizAnswerRecord[] = [
      { questionId: 'q1', selectedChoiceId: 'a', isCorrect: true, timeSpentSeconds: 0 },
      { questionId: 'q2', selectedChoiceId: 'b', isCorrect: false, timeSpentSeconds: 0 },
    ];
    expect(computeSessionScore(answers, 4)).toBe(25); // 1 of 4
    expect(computeSessionScore(answers, 2)).toBe(50); // 1 of 2
  });

  it('returns 0 for an empty quiz', () => {
    expect(computeSessionScore([], 0)).toBe(0);
  });
});
