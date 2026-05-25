import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchQuestionsByIds } from './catalog';
import { supabase, isSupabaseConfigured } from '../supabase';

export type BookmarkItem = {
  questionId: string;
  stem: string;
  subjectName: string;
  topicName: string;
  bookmarkedAt: string;
};

export type MaterialBookmarkItem = {
  materialId: string;
  title: string;
  preview: string;
  materialType: string;
  subjectName: string;
  topicName: string;
  bookmarkedAt: string;
};

export async function fetchBookmarkedQuestionIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('question_id')
    .eq('user_id', userId)
    .not('question_id', 'is', null);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.question_id).filter(Boolean) as string[]);
}

export async function fetchBookmarkedMaterialIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured) return new Set();

  const { data, error } = await supabase
    .from('bookmarks')
    .select('review_material_id')
    .eq('user_id', userId)
    .not('review_material_id', 'is', null);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.review_material_id).filter(Boolean) as string[]);
}

export async function toggleBookmark(userId: string, questionId: string, bookmarked: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;

  if (bookmarked) {
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId).eq('question_id', questionId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('bookmarks').insert({ user_id: userId, question_id: questionId });
  if (error && error.code !== '23505') throw error;
}

export async function toggleMaterialBookmark(
  userId: string,
  materialId: string,
  bookmarked: boolean
): Promise<void> {
  if (!isSupabaseConfigured) return;

  if (bookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('review_material_id', materialId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('bookmarks').insert({
    user_id: userId,
    review_material_id: materialId,
  });
  if (error && error.code !== '23505') throw error;
}

export async function fetchBookmarkedQuestions(userId: string): Promise<BookmarkItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('bookmarks')
    .select('question_id, created_at')
    .eq('user_id', userId)
    .not('question_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const ids = (data ?? []).map((r) => r.question_id).filter(Boolean) as string[];
  if (!ids.length) return [];

  const questions = await fetchQuestionsByIds(ids);
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));

  return (data ?? [])
    .map((row) => {
      const q = byId[row.question_id as string];
      if (!q) return null;
      return {
        questionId: q.id,
        stem: q.stem,
        subjectName: q.topic?.subject?.name ?? '',
        topicName: q.topic?.name ?? '',
        bookmarkedAt: row.created_at as string,
      };
    })
    .filter(Boolean) as BookmarkItem[];
}

export async function fetchBookmarkedMaterials(examSlug?: string): Promise<MaterialBookmarkItem[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_bookmarked_materials', {
    p_exam_slug: examSlug ?? null,
  });

  if (error) throw error;

  return ((data ?? []) as Array<{
    material_id: string;
    title: string;
    body: string;
    material_type: string;
    topic_name: string;
    subject_name: string;
    bookmarked_at: string;
  }>).map((row) => ({
    materialId: row.material_id,
    title: row.title,
    preview: row.body,
    materialType: row.material_type,
    subjectName: row.subject_name,
    topicName: row.topic_name,
    bookmarkedAt: row.bookmarked_at,
  }));
}

/** Local cache for bookmark IDs when offline */
export async function cacheBookmarkIds(userId: string): Promise<void> {
  const [questions, materials] = await Promise.all([
    fetchBookmarkedQuestionIds(userId),
    fetchBookmarkedMaterialIds(userId),
  ]);
  await AsyncStorage.setItem(
    `reviewnatin:bookmarks:${userId}`,
    JSON.stringify({ questions: [...questions], materials: [...materials] })
  );
}
