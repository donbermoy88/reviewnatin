export type QuestionChoice = { id: string; text: string };

export type Question = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  /** Only populated after server-side check_question_answer RPC */
  correct_choice_id?: string;
  explanation_en?: string | null;
  explanation_fil?: string | null;
  difficulty: number;
  topic?: { name: string; subject?: { name: string; exam_slug?: string } };
};

export type SubjectArea = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type ExamType = {
  id: string;
  slug: string;
  name: string;
};

export type QuizAnswerRecord = {
  questionId: string;
  selectedChoiceId: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
};
