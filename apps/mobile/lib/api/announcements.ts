import { supabase, isSupabaseConfigured } from '../supabase';

export type AppAnnouncement = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
};

export async function fetchAppAnnouncements(
  examSlug?: string,
  limit = 3
): Promise<AppAnnouncement[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_app_announcements', {
    p_exam_slug: examSlug ?? null,
    p_limit: limit,
  });

  if (error) throw error;

  return ((data ?? []) as {
    id: string;
    title: string;
    body: string;
    published_at: string;
  }[]).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.published_at,
  }));
}
