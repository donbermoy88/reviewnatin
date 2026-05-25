import { supabase, isSupabaseConfigured } from '../supabase';

export type MistakeItem = {
  id: string;
  questionId: string;
  stem: string;
  subjectName: string;
  topicName: string;
  timesWrong: number;
  lastWrongAt: string;
  nextReviewAt: string | null;
};

export async function fetchMistakes(examSlug: string, limit = 50): Promise<MistakeItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_mistake_bank', {
    p_exam_slug: examSlug,
    p_limit: limit,
    p_days_back: null,
  });

  if (error) throw error;

  return ((data ?? []) as {
    id: string;
    question_id: string;
    stem: string;
    subject_name: string;
    topic_name: string;
    times_wrong: number;
    last_wrong_at: string;
    next_review_at: string | null;
  }[]).map((row) => ({
    id: row.id,
    questionId: row.question_id,
    stem: row.stem,
    subjectName: row.subject_name,
    topicName: row.topic_name,
    timesWrong: row.times_wrong,
    lastWrongAt: row.last_wrong_at,
    nextReviewAt: row.next_review_at,
  }));
}

export async function recordQuizOutcome(questionId: string, isCorrect: boolean, wrongChoiceId?: string) {
  if (!isSupabaseConfigured) return;

  await supabase.rpc('update_topic_mastery', {
    p_question_id: questionId,
    p_is_correct: isCorrect,
  });

  if (!isCorrect && wrongChoiceId) {
    await supabase.rpc('upsert_mistake_log', {
      p_question_id: questionId,
      p_wrong_choice_id: wrongChoiceId,
    });
  }
}

export async function fetchMistakeQuestionIds(examSlug: string, limit = 12): Promise<string[]> {
  const mistakes = await fetchMistakes(examSlug, limit);
  return mistakes.map((m) => m.questionId);
}
