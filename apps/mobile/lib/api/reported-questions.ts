import { supabase, isSupabaseConfigured } from '../supabase';

export type ReportReason = 'wrong_answer' | 'unclear_question' | 'outdated' | 'typo' | 'other';

export async function reportQuestion(
  questionId: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not signed in');

  const { error } = await supabase.from('reported_questions').insert({
    user_id: userId,
    question_id: questionId,
    reason,
    details: details?.trim() ? details.trim().slice(0, 500) : null,
  });

  if (error) throw error;
}
