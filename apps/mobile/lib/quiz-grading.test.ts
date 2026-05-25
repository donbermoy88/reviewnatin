import { describe, expect, it } from 'vitest';
import {
  computeScorePercent,
  gradeSelectedAnswer,
  summarizeQuizAnswers,
} from './quiz-grading';

describe('gradeSelectedAnswer', () => {
  it('returns true when choice matches', () => {
    expect(gradeSelectedAnswer('b', 'b')).toBe(true);
  });

  it('returns false on mismatch or missing selection', () => {
    expect(gradeSelectedAnswer('a', 'b')).toBe(false);
    expect(gradeSelectedAnswer(null, 'b')).toBe(false);
    expect(gradeSelectedAnswer('a', null)).toBe(false);
  });
});

describe('computeScorePercent', () => {
  it('matches server ROUND(correct * 100 / total, 2)', () => {
    expect(computeScorePercent(3, 4)).toBe(75);
    expect(computeScorePercent(1, 3)).toBe(33.33);
    expect(computeScorePercent(0, 5)).toBe(0);
    expect(computeScorePercent(0, 0)).toBe(0);
  });
});

describe('summarizeQuizAnswers', () => {
  it('grades a full session', () => {
    const result = summarizeQuizAnswers([
      { questionId: '1', selectedChoiceId: 'a', correctChoiceId: 'a' },
      { questionId: '2', selectedChoiceId: 'b', correctChoiceId: 'c' },
      { questionId: '3', selectedChoiceId: 'd', correctChoiceId: 'd' },
    ]);
    expect(result.correct).toBe(2);
    expect(result.total).toBe(3);
    expect(result.scorePercent).toBe(66.67);
  });

  it('ignores unanswered items', () => {
    const result = summarizeQuizAnswers([
      { questionId: '1', selectedChoiceId: null, correctChoiceId: 'a' },
      { questionId: '2', selectedChoiceId: 'b', correctChoiceId: 'b' },
    ]);
    expect(result.total).toBe(1);
    expect(result.scorePercent).toBe(100);
  });
});
