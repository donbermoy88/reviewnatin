import { supabase, isSupabaseConfigured } from '../supabase';

export type ExamScheduleEvent = {
  id: string;
  eventType: string;
  eventDate: string;
  sourceUrl: string | null;
  notes: string | null;
  daysUntil: number;
};

export async function fetchExamSchedules(examSlug: string): Promise<ExamScheduleEvent[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_exam_schedules_by_exam', {
    p_exam_slug: examSlug,
  });

  if (error) throw error;

  return ((data ?? []) as {
    id: string;
    event_type: string;
    event_date: string;
    source_url: string | null;
    notes: string | null;
    days_until: number;
  }[]).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    eventDate: row.event_date,
    sourceUrl: row.source_url,
    notes: row.notes,
    daysUntil: row.days_until,
  }));
}

export function formatEventType(eventType: string): string {
  return eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
