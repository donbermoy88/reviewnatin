import type { QuizAnswerRecord } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export async function createPracticeSession(
  userId: string,
  examTypeId: string,
  itemCount: number
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('quiz_sessions')
    .insert({
      user_id: userId,
      exam_type_id: examTypeId,
      mode: 'practice',
      item_count: itemCount,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function completePracticeSession(
  sessionId: string,
  scorePercent: number,
  durationSeconds: number
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('quiz_sessions')
    .update({
      score_percent: scorePercent,
      duration_seconds: durationSeconds,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function saveQuizAnswers(sessionId: string, answers: QuizAnswerRecord[]): Promise<void> {
  if (!isSupabaseConfigured || !sessionId) return;

  const rows = answers.map((a) => ({
    session_id: sessionId,
    question_id: a.questionId,
    selected_choice_id: a.selectedChoiceId,
    is_correct: a.isCorrect,
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
