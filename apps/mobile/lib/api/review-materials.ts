import { supabase, isSupabaseConfigured } from '../supabase';

export type ReviewMaterial = {
  id: string;
  title: string;
  body: string;
  materialType: string;
  isPremium: boolean;
  topicSlug: string;
  topicName: string;
  subjectName: string;
  subjectSlug: string;
};

export async function fetchReviewMaterialsByExam(
  examSlug: string,
  materialType?: string | null
): Promise<ReviewMaterial[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_review_materials_by_exam', {
    p_exam_slug: examSlug,
    p_material_type: materialType ?? null,
  });

  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    material_type: string;
    is_premium: boolean;
    topic_slug: string;
    topic_name: string;
    subject_name: string;
    subject_slug: string;
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    materialType: row.material_type,
    isPremium: row.is_premium,
    topicSlug: row.topic_slug,
    topicName: row.topic_name,
    subjectName: row.subject_name,
    subjectSlug: row.subject_slug,
  }));
}

export async function fetchReviewMaterialById(
  examSlug: string,
  materialId: string
): Promise<ReviewMaterial | null> {
  const materials = await fetchReviewMaterialsByExam(examSlug);
  return materials.find((m) => m.id === materialId) ?? null;
}
