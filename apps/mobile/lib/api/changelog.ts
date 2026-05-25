import { supabase, isSupabaseConfigured } from '../supabase';

export type ChangelogEntry = {
  id: string;
  title: string;
  body: string;
  examSlug: string | null;
  publishedAt: string;
};

export async function fetchContentChangelog(
  examSlug?: string,
  limit = 10
): Promise<ChangelogEntry[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_content_changelog', {
    p_exam_slug: examSlug ?? null,
    p_limit: limit,
  });

  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    exam_slug: string | null;
    published_at: string;
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    examSlug: row.exam_slug,
    publishedAt: row.published_at,
  }));
}
