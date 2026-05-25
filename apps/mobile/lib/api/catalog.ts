import type { ExamType, Question, QuestionChoice, SubjectArea } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { isDailyLimitError } from './iap';

export type PracticeFetchError = 'daily_limit' | 'unknown';

type PracticeQuestionRow = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  difficulty: number;
  topic_name: string;
  subject_name: string;
  exam_slug: string;
};

type AnswerCheckRow = {
  is_correct: boolean;
  correct_choice_id: string;
  explanation_en: string | null;
  explanation_fil: string | null;
};

export type AnswerCheckResult = {
  isCorrect: boolean;
  correctChoiceId: string;
  explanationEn: string | null;
  explanationFil: string | null;
};

function mapPracticeQuestion(row: PracticeQuestionRow): Question {
  return {
    id: row.id,
    stem: row.stem,
    choices: row.choices,
    difficulty: row.difficulty,
    topic: {
      name: row.topic_name,
      subject: {
        name: row.subject_name,
        exam_slug: row.exam_slug,
      },
    },
  };
}

export async function fetchExamTypes(): Promise<ExamType[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('exam_types').select('id, slug, name').eq('is_active', true).order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchExamBySlug(slug: string): Promise<ExamType | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('exam_types').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSubjectAreas(examTypeId: string): Promise<SubjectArea[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('subject_areas')
    .select('id, slug, name, sort_order')
    .eq('exam_type_id', examTypeId)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchExamQuestionCount(examSlug: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { data, error } = await supabase.rpc('get_practice_questions', {
    p_exam_slug: examSlug,
    p_limit: 500,
    p_topic_slug: null,
  });

  if (error) return 0;
  return (data as PracticeQuestionRow[] | null)?.length ?? 0;
}

export async function fetchPracticeQuestions(
  examSlug: string,
  limit = 12,
  topicSlug?: string
): Promise<{ questions: Question[]; error?: PracticeFetchError }> {
  if (!isSupabaseConfigured) return { questions: [] };

  const { data, error } = await supabase.rpc('get_practice_questions', {
    p_exam_slug: examSlug,
    p_limit: limit,
    p_topic_slug: topicSlug ?? null,
  });

  if (error) {
    if (isDailyLimitError(error)) return { questions: [], error: 'daily_limit' };
    throw error;
  }

  return {
    questions: ((data ?? []) as PracticeQuestionRow[]).map(mapPracticeQuestion),
  };
}

export async function fetchQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!isSupabaseConfigured || !ids.length) return [];

  const { data, error } = await supabase.rpc('get_questions_by_ids', {
    p_ids: ids,
  });

  if (error) throw error;
  return ((data ?? []) as PracticeQuestionRow[]).map(mapPracticeQuestion);
}

/** Grade a single answer server-side — answer key is not in list queries */
export async function checkQuestionAnswer(
  questionId: string,
  choiceId: string
): Promise<AnswerCheckResult | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('check_question_answer', {
    p_question_id: questionId,
    p_choice_id: choiceId,
  });

  if (error) throw error;

  const row = ((data ?? []) as AnswerCheckRow[])[0];
  if (!row) return null;

  return {
    isCorrect: row.is_correct,
    correctChoiceId: row.correct_choice_id,
    explanationEn: row.explanation_en,
    explanationFil: row.explanation_fil,
  };
}
