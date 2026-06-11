import { supabase, isSupabaseConfigured } from '../supabase';
import { shuffleArray } from '../shuffle';
import { cachedJson } from '../cache/json-cache';

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

  return cachedJson(`due-flashcard-count:${examSlug}`, async () => {
    const { data, error } = await supabase.rpc('get_due_flashcard_count', {
      p_exam_slug: examSlug,
    });

    if (error) return 0;
    return Number(data ?? 0);
  }, { ttlMs: 2 * 60 * 1000, staleTtlMs: 24 * 60 * 60 * 1000 });
}

export async function fetchSubjectFlashcardCount(
  examSlug: string,
  subjectSlug: string
): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  return cachedJson(`subject-flashcard-count:${examSlug}:${subjectSlug}`, async () => {
    const { count, error } = await supabase
      .from('flashcards')
      .select(
        `
        id,
        topics!inner (
          subject_areas!inner (
            slug,
            exam_types!inner ( slug )
          )
        )
      `,
        { count: 'exact', head: true }
      )
      .eq('topics.subject_areas.exam_types.slug', examSlug)
      .eq('topics.subject_areas.slug', subjectSlug);

    if (error) throw error;
    return count ?? 0;
  }, { ttlMs: 10 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 });
}

export async function fetchDueFlashcards(
  examSlug: string,
  options?: { limit?: number; topicSlug?: string; subjectSlug?: string }
): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return [];

  const limit = Math.max(options?.limit ?? 20, 1);
  const fetchLimit = Math.min(limit * 4, 200);
  const { data, error } = await supabase.rpc('get_due_flashcards', {
    p_exam_slug: examSlug,
    p_limit: fetchLimit,
    p_topic_slug: options?.topicSlug ?? null,
    p_subject_slug: options?.subjectSlug ?? null,
  });

  if (error) throw error;

  const cards = ((data ?? []) as {
    id: string;
    front: string;
    back: string;
    topic_slug: string;
    topic_name: string;
    subject_name: string;
    repetitions: number;
  }[]).map((row) => ({
    id: row.id,
    front: row.front,
    back: row.back,
    topicName: row.topic_name,
    subjectName: row.subject_name,
    topicSlug: row.topic_slug,
    repetitions: row.repetitions,
  }));
  return shuffleArray(cards).slice(0, limit);
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
export async function fetchFlashcardsByExam(
  examSlug: string,
  limit = 50,
  subjectSlug?: string
): Promise<Flashcard[]> {
  if (!isSupabaseConfigured) return [];

  const safeLimit = Math.max(limit, 1);
  const fetchLimit = Math.min(safeLimit * 4, 200);
  let query = supabase
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
    .eq('topics.subject_areas.exam_types.slug', examSlug);

  if (subjectSlug) {
    query = query.eq('topics.subject_areas.slug', subjectSlug);
  }

  const { data, error } = await query.limit(fetchLimit);

  if (error) throw error;

  return shuffleArray(((data ?? []) as unknown as FlashcardRow[]).map(mapRow)).slice(0, safeLimit);
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

  return shuffleArray(((data ?? []) as unknown as FlashcardRow[]).map(mapRow));
}
