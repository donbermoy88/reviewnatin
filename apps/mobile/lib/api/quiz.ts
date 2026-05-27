import type { QuizAnswerRecord } from '../types';
import { cleanStem } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export type QuizMode = 'practice' | 'timed' | 'mock' | 'mistake_review' | 'diagnostic' | 'weak_area' | 'barkada' | 'board';

export type SessionReviewItem = {
  questionId: string;
  stem: string;
  choices: { id: string; text: string }[];
  selectedChoiceId: string | null;
  isCorrect: boolean | null;
  correctChoiceId: string;
  explanationEn: string | null;
  explanationFil: string | null;
  timeSpentSeconds: number | null;
};

export async function createQuizSession(
  userId: string,
  examTypeId: string,
  itemCount: number,
  mode: QuizMode = 'practice',
  mockExamId?: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      exam_type_id: examTypeId,
      mode,
      mock_exam_id: mockExamId ?? null,
      item_count: itemCount,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function createPracticeSession(
  userId: string,
  examTypeId: string,
  itemCount: number
): Promise<string | null> {
  return createQuizSession(userId, examTypeId, itemCount, 'practice');
}

/** Server computes score_percent from graded quiz_answers rows. */
export async function completePracticeSession(
  sessionId: string,
  durationSeconds: number
): Promise<number | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('complete_quiz_session', {
    p_session_id: sessionId,
    p_duration_seconds: durationSeconds,
  });

  if (error) throw error;
  return typeof data === 'number' ? data : Number(data ?? 0);
}

/** is_correct is computed server-side by DB trigger — never send from client. */
export async function saveQuizAnswers(sessionId: string, answers: QuizAnswerRecord[]): Promise<void> {
  if (!isSupabaseConfigured || !sessionId) return;

  const rows = answers.map((a) => ({
    session_id: sessionId,
    question_id: a.questionId,
    selected_choice_id: a.selectedChoiceId,
    time_spent_seconds: a.timeSpentSeconds,
  }));

  const { error } = await supabase.from('quiz_answers').insert(rows);
  if (error) throw error;
}

export async function fetchRecentSessions(userId: string, limit = 5) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('id, score_percent, item_count, completed_at, mode')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function fetchSessionReview(sessionId: string): Promise<SessionReviewItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_session_review', {
    p_session_id: sessionId,
  });

  if (error) throw error;

  return ((data ?? []) as {
    question_id: string;
    stem: string;
    choices: { id: string; text: string }[];
    selected_choice_id: string | null;
    is_correct: boolean | null;
    correct_choice_id: string;
    explanation_en: string | null;
    explanation_fil: string | null;
    time_spent_seconds: number | null;
  }[]).map((row) => ({
    questionId: row.question_id,
    stem: cleanStem(row.stem),
    choices: row.choices,
    selectedChoiceId: row.selected_choice_id,
    isCorrect: row.is_correct,
    correctChoiceId: row.correct_choice_id,
    explanationEn: row.explanation_en,
    explanationFil: row.explanation_fil,
    timeSpentSeconds: row.time_spent_seconds,
  }));
}
