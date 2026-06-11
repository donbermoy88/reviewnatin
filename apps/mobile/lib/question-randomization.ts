import type { Question } from './types';
import { shuffleArray } from './shuffle';

export function shuffleQuestionChoices(question: Question): Question {
  return {
    ...question,
    choices: shuffleArray(question.choices),
  };
}

export function randomizeQuestionSet(questions: Question[]): Question[] {
  return shuffleArray(questions).map(shuffleQuestionChoices);
}
