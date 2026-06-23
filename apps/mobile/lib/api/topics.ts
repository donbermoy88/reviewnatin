import { fetchExamBySlug, fetchSubjectAreas } from './catalog';
import { supabase, isSupabaseConfigured } from '../supabase';

export type TopicRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

const LET_SECONDARY_MAJOR_SLUGS = new Set([
  'english',
  'mathematics',
  'filipino',
  'social-studies-araling-panlipunan',
  'biological-science',
  'physical-science',
  'values-education',
  'mapeh',
  'tle',
]);

export async function fetchTopicsBySubjectSlug(
  examSlug: string,
  subjectSlug: string
): Promise<TopicRow[]> {
  if (!isSupabaseConfigured) return [];

  const exam = await fetchExamBySlug(examSlug);
  if (!exam) return [];

  const subjects = await fetchSubjectAreas(exam.id);
  const subject = subjects.find((s) => s.slug === subjectSlug);
  if (!subject) return [];

  const { data, error } = await supabase
    .from('topics')
    .select('id, slug, name, sort_order')
    .eq('subject_area_id', subject.id)
    .order('sort_order');

  if (error) throw error;
  const rows = data ?? [];
  if (examSlug === 'let-secondary' && subjectSlug === 'major') {
    return rows.filter((topic) => LET_SECONDARY_MAJOR_SLUGS.has(topic.slug));
  }
  return rows;
}

/**
 * Published-question count per topic slug for an exam + subject.
 * Best-effort: returns an empty map if the RPC isn't deployed yet (the caller
 * then falls back to treating counts as unknown), so the UI never breaks.
 */
export async function fetchTopicQuestionCounts(
  examSlug: string,
  subjectSlug: string
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!isSupabaseConfigured) return counts;

  try {
    const { data, error } = await supabase.rpc('get_topic_question_counts', {
      p_exam_slug: examSlug,
      p_subject_slug: subjectSlug,
    });
    if (error || !data) return counts;
    for (const row of data) counts.set(row.topic_slug, row.published_count);
  } catch {
    /* RPC not deployed or transient failure — treat counts as unknown */
  }
  return counts;
}
