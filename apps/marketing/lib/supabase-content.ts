import { createClient } from '@supabase/supabase-js';
import type { Database } from '@reviewnatin/shared';

export function createMarketingSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key);
}

export async function fetchMarketingAnnouncements(limit = 5) {
  const supabase = createMarketingSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('announcements')
    .select('id, title, body, published_at')
    .order('published_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function fetchContentChangelog(limit = 8) {
  const supabase = createMarketingSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from('content_changelog')
    .select('id, title, body, exam_type_id, published_at, exam_types ( name, slug )')
    .order('published_at', { ascending: false })
    .limit(limit);

  return data ?? [];
}

export type ContentCountsRow = {
  examSlug: string;
  questions: number;
  mockExams: number;
  lessons: number;
  flashcards: number;
};

export async function fetchContentCounts(examSlug: string): Promise<ContentCountsRow | null> {
  const supabase = createMarketingSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('get_content_counts', { p_exam_slug: examSlug });
  if (error || !data) return null;

  const row = data as {
    exam_slug: string;
    questions: number;
    mock_exams: number;
    lessons: number;
    flashcards: number;
  };

  return {
    examSlug: row.exam_slug,
    questions: Number(row.questions ?? 0),
    mockExams: Number(row.mock_exams ?? 0),
    lessons: Number(row.lessons ?? 0),
    flashcards: Number(row.flashcards ?? 0),
  };
}
