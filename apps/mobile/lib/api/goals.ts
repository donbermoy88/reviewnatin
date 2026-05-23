import { supabase, isSupabaseConfigured } from '../supabase';
import type { OnboardingData } from '../onboarding-store';

export async function syncExamGoal(userId: string, onboarding: OnboardingData): Promise<void> {
  if (!isSupabaseConfigured || !onboarding.examSlug) return;

  const { data: exam, error: examErr } = await supabase
    .from('exam_types')
    .select('id')
    .eq('slug', onboarding.examSlug)
    .single();

  if (examErr || !exam) throw examErr ?? new Error('Exam type not found');

  await supabase.from('user_exam_goals').update({ is_active: false }).eq('user_id', userId);

  const { error } = await supabase.from('user_exam_goals').insert({
    user_id: userId,
    exam_type_id: exam.id,
    target_exam_date: onboarding.targetDate,
    daily_minutes: onboarding.dailyMinutes,
    current_level: onboarding.level,
    onboarding_completed_at: new Date().toISOString(),
    is_active: true,
  });

  if (error) throw error;
}

export async function fetchActiveGoal(userId: string) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('user_exam_goals')
    .select(
      `target_exam_date, daily_minutes, current_level,
       exam_types ( slug, name )`
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
