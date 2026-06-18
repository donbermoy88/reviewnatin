import type { ExamType, Question, QuestionChoice, SubjectArea } from '../types';
import { cleanStem } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { isDailyLimitError } from './iap';
import { shuffleQuestionChoices } from '../question-randomization';
import { cachedJson } from '../cache/json-cache';
import { rowList } from './result';

export type PracticeFetchError = 'daily_limit' | 'unknown';

type PracticeQuestionRow = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  difficulty: number;
  topic_name: string;
  subject_name: string;
  exam_slug: string;
  image_url?: string | null;
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
  return shuffleQuestionChoices({
    id: row.id,
    stem: cleanStem(row.stem),
    choices: row.choices,
    image_url: row.image_url ?? null,
    difficulty: row.difficulty,
    topic: {
      name: row.topic_name,
      subject: {
        name: row.subject_name,
        exam_slug: row.exam_slug,
      },
    },
  });
}

export async function fetchExamTypes(): Promise<ExamType[]> {
  if (!isSupabaseConfigured) return [];
  return cachedJson('exam-types', async () => {
    const { data, error } = await supabase.from('exam_types').select('id, slug, name').eq('is_active', true).order('name');
    if (error) throw error;
    return data ?? [];
  }, { ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 30 * 24 * 60 * 60 * 1000 });
}

export async function fetchExamBySlug(slug: string): Promise<ExamType | null> {
  if (!isSupabaseConfigured) return null;
  return cachedJson(`exam-by-slug:${slug}`, async () => {
    const { data, error } = await supabase.from('exam_types').select('id, slug, name').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data;
  }, { ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 30 * 24 * 60 * 60 * 1000 });
}

export async function fetchSubjectAreas(examTypeId: string): Promise<SubjectArea[]> {
  if (!isSupabaseConfigured) return [];
  return cachedJson(`subject-areas:${examTypeId}`, async () => {
    const { data, error } = await supabase
      .from('subject_areas')
      .select('id, slug, name, sort_order')
      .eq('exam_type_id', examTypeId)
      .order('sort_order');
    if (error) throw error;
    return data ?? [];
  }, { ttlMs: 24 * 60 * 60 * 1000, staleTtlMs: 30 * 24 * 60 * 60 * 1000 });
}

export async function fetchExamQuestionCount(examSlug: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  return cachedJson(`content-counts:questions:${examSlug}`, async () => {
    // Use get_content_counts (the true published-question total for the exam),
    // NOT get_practice_questions — the latter is the quiz-serving RPC, which is
    // capped at p_limit and subject to the per-user daily limit, so counting its
    // rows undercounts the real bank (e.g. showed "20" instead of 822).
    const { data, error } = await supabase.rpc('get_content_counts', {
      p_exam_slug: examSlug,
    });

    if (error || !data) return 0;
    const counts = data as { questions?: number } | null;
    return counts?.questions ?? 0;
  }, { ttlMs: 10 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 });
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
    questions: rowList<PracticeQuestionRow>(data).map(mapPracticeQuestion),
  };
}

export async function fetchQuestionsByIds(ids: string[]): Promise<Question[]> {
  if (!isSupabaseConfigured || !ids.length) return [];

  const { data, error } = await supabase.rpc('get_questions_by_ids', {
    p_ids: ids,
  });

  if (error) throw error;
  return rowList<PracticeQuestionRow>(data).map(mapPracticeQuestion);
}

/**
 * Returns one genuinely incorrect choice id to eliminate for the "hint" feature.
 * Selected server-side so the answer key never reaches the client and the hint
 * can never remove the correct answer. Returns null when nothing is eliminable.
 */
export async function fetchQuestionHint(
  questionId: string,
  selectedChoiceId: string | null
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_question_hint', {
    p_question_id: questionId,
    p_selected_choice_id: selectedChoiceId,
  });

  if (error) throw error;
  return typeof data === 'string' && data ? data : null;
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
