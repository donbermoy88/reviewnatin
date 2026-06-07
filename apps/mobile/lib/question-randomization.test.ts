import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomizeQuestionSet, shuffleQuestionChoices } from './question-randomization';
import type { Question } from './types';

const questions: Question[] = [
  {
    id: 'q1',
    stem: 'Question 1',
    difficulty: 1,
    correct_choice_id: 'a',
    choices: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
    ],
  },
  {
    id: 'q2',
    stem: 'Question 2',
    difficulty: 2,
    correct_choice_id: 'd',
    choices: [
      { id: 'd', text: 'D' },
      { id: 'e', text: 'E' },
      { id: 'f', text: 'F' },
    ],
  },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('question randomization', () => {
  it('shuffles choices without mutating the original question or changing choice IDs', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const shuffled = shuffleQuestionChoices(questions[0]);

    expect(shuffled).not.toBe(questions[0]);
    expect(shuffled.choices.map((choice) => choice.id)).toEqual(['b', 'c', 'a']);
    expect(questions[0].choices.map((choice) => choice.id)).toEqual(['a', 'b', 'c']);
    expect(shuffled.correct_choice_id).toBe('a');
  });

  it('shuffles question order and each question choice list', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const shuffled = randomizeQuestionSet(questions);

    expect(shuffled.map((question) => question.id)).toEqual(['q2', 'q1']);
    expect(shuffled[0].choices.map((choice) => choice.id)).toEqual(['e', 'f', 'd']);
    expect(shuffled[1].choices.map((choice) => choice.id)).toEqual(['b', 'c', 'a']);
    expect(questions.map((question) => question.id)).toEqual(['q1', 'q2']);
  });
});
