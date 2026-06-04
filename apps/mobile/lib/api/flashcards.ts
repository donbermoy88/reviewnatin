import { supabase, isSupabaseConfigured } from '../supabase';

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  topicName: string;
  subjectName: string;
  topicSlug?: string;
  repetitions?: number;
};

export type FlashcardRating = 1 | 2 | 3 | 4;

type FlashcardRow = {
  id: string;
  front: string;
  back: string;
  topics: {
    name: string;
    slug?: string;
    subject_areas: { name: string };
  };
};

function mapRow(row: FlashcardRow): Flashcard {
  return {
    id: row.id,
    front: row.front,
    back: row.back,
    topicName: row.topics.name,
    subjectName: row.topics.subject_areas.name,
    topicSlug: row.topics.slug,
  };
}

export async function fetchDueFlashcardCount(examSlug: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { data, error } = await supabase.rpc('get_due_flashcard_count', {
    p_exam_slug: examSlug,
  });

  if (error) return 0;
  return Number(data ?? 0);
}

export async function fetchDueFlashcards(
  examSlug: string,
  options?: { limit?: number; topicSlug?: string; subjectSlug?: string }
): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_due_flashcards', {
    p_exam_slug: examSlug,
    p_limit: options?.limit ?? 20,
    p_topic_slug: options?.topicSlug ?? null,
    p_subject_slug: options?.subjectSlug ?? null,
  });

  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    front: string;
    back: string;
    topic_slug: string;
    topic_name: string;
    subject_name: string;
    repetitions: number;
  }>).map((row) => ({
    id: row.id,
    front: row.front,
    back: row.back,
    topicName: row.topic_name,
    subjectName: row.subject_name,
    topicSlug: row.topic_slug,
    repetitions: row.repetitions,
  }));
}

export async function reviewFlashcard(
  flashcardId: string,
  rating: FlashcardRating
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.rpc('review_flashcard', {
    p_flashcard_id: flashcardId,
    p_rating: rating,
  });

  if (error) throw error;
}

/**
 * Legacy fetch — used when offline pack is unavailable or for guest fallback.
 *
 * IMPORTANT: the exam filter must happen IN THE DATABASE, not after the
 * fact in JavaScript. The previous implementation pulled `limit` random
 * rows from the entire flashcards table and then filtered by exam in JS —
 * so if the first 20 rows happened to contain only 3 CSE Professional
 * cards, the user only saw 3. We push the filter into the SQL query using
 * the `!inner` join on `exam_types.slug`, then apply LIMIT, so we always
 * return up to `limit` cards FOR THAT EXAM.
 */
export async function fetchFlashcardsByExam(examSlug: string, limit = 50): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('flashcards')
    .select(
      `
      id,
      front,
      back,
      topics!inner (
        name,
        slug,
        subject_areas!inner (
          name,
          exam_types!inner ( slug )
        )
      )
    `
    )
    .eq('topics.subject_areas.exam_types.slug', examSlug)
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as unknown as FlashcardRow[]).map(mapRow);
}

/**
 * Fetch flashcards for a single topic within a given exam.
 * Same fix as fetchFlashcardsByExam — both filters happen server-side so
 * the LIMIT applies to the already-filtered set.
 */
export async function fetchFlashcardsByTopic(topicSlug: string, examSlug: string): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('flashcards')
    .select(
      `
      id,
      front,
      back,
      topics!inner (
        slug,
        name,
        subject_areas!inner (
          name,
          exam_types!inner ( slug )
        )
      )
    `
    )
    .eq('topics.slug', topicSlug)
    .eq('topics.subject_areas.exam_types.slug', examSlug);

  if (error) throw error;

  return ((data ?? []) as unknown as FlashcardRow[]).map(mapRow);
}
