import { fetchExamBySlug, fetchSubjectAreas } from './catalog';
import { supabase, isSupabaseConfigured } from '../supabase';

export type TopicRow = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

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
  return data ?? [];
}
