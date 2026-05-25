import { supabase, isSupabaseConfigured } from '../supabase';

export type PasaPathTask = {
  id: string;
  type: 'practice' | 'mistakes' | 'flashcards' | 'mock';
  title: string;
  minutes: number;
  question_count: number;
  completed: boolean;
};

export type PasaPathPlan = {
  date: string;
  days_until_exam: number;
  daily_minutes: number;
  readiness_hint: number;
  tasks: PasaPathTask[];
};

export type PasaPathWeekDay = {
  date: string;
  is_today: boolean;
  daily_minutes?: number;
  days_until_exam?: number;
  readiness_hint?: number;
  tasks_total: number;
  tasks_completed: number;
  tasks?: PasaPathTask[] | null;
};

export type PasaPathWeek = {
  exam_slug: string;
  start_date: string;
  end_date: string;
  days: PasaPathWeekDay[];
};

export async function fetchTodayPasaPath(examSlug: string): Promise<PasaPathPlan | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_today_pasapath', { p_exam_slug: examSlug });
  if (error) throw error;
  if (!data) return null;
  return data as PasaPathPlan;
}

export async function fetchPasaPathWeek(examSlug: string): Promise<PasaPathWeek | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_pasapath_week', { p_exam_slug: examSlug });
  if (error) throw error;
  if (!data) return null;
  return data as PasaPathWeek;
}

export async function completePasaPathTask(
  examSlug: string,
  taskId: string
): Promise<PasaPathPlan | null> {
  if (!isSupabaseConfigured || !taskId) return null;

  const { data, error } = await supabase.rpc('complete_pasapath_task', {
    p_exam_slug: examSlug,
    p_task_id: taskId,
  });

  if (error) throw error;
  if (!data) return null;
  return data as PasaPathPlan;
}
