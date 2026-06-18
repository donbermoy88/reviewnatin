import type { Question, QuestionChoice } from '../types';
import { cleanStem } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';
import { shuffleQuestionChoices } from '../question-randomization';
import { cachedJson } from '../cache/json-cache';
import { rowList } from './result';

export type MockExam = {
  id: string;
  title: string;
  itemCount: number;
  durationSeconds: number;
  examSlug: string;
};

type MockQuestionRow = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  difficulty: number;
  topic_name: string;
  subject_name: string;
  exam_slug: string;
  sort_order: number;
  is_preview?: boolean;
  preview_limit?: number | null;
};

export type MockExamQuestionsResult = {
  questions: Question[];
  isPreview: boolean;
  previewLimit: number | null;
};

export async function fetchMockExams(examSlug: string): Promise<MockExam[]> {
  if (!isSupabaseConfigured) return [];

  return cachedJson(`mock-exams:${examSlug}`, async () => {
    const { data, error } = await supabase
      .from('mock_exams')
      .select('id, title, item_count, duration_seconds, exam_types!inner(slug)')
      .eq('is_active', true)
      .eq('exam_types.slug', examSlug);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      itemCount: row.item_count,
      durationSeconds: row.duration_seconds,
      examSlug,
    }));
  }, { ttlMs: 10 * 60 * 1000, staleTtlMs: 7 * 24 * 60 * 60 * 1000 });
}

export async function fetchMockExamQuestions(mockExamId: string): Promise<MockExamQuestionsResult> {
  if (!isSupabaseConfigured) {
    return { questions: [], isPreview: false, previewLimit: null };
  }

  const { data, error } = await supabase.rpc('get_mock_exam_questions', {
    p_mock_exam_id: mockExamId,
  });

  if (error) throw error;

  const rows = rowList<MockQuestionRow>(data);
  const isPreview = rows.some((r) => r.is_preview);
  const previewLimit = rows.find((r) => r.preview_limit != null)?.preview_limit ?? null;

  return {
    questions: rows.map((row) => shuffleQuestionChoices({
      id: row.id,
      stem: cleanStem(row.stem),
      choices: row.choices,
      difficulty: row.difficulty,
      topic: {
        name: row.topic_name,
        subject: { name: row.subject_name, exam_slug: row.exam_slug },
      },
    })),
    isPreview,
    previewLimit,
  };
}

export async function fetchMockExamById(mockExamId: string): Promise<MockExam | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('mock_exams')
    .select('id, title, item_count, duration_seconds, exam_types(slug)')
    .eq('id', mockExamId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const etRaw = data.exam_types as { slug: string } | { slug: string }[] | null;
  const slug = Array.isArray(etRaw) ? etRaw[0]?.slug : etRaw?.slug;
  return {
    id: data.id,
    title: data.title,
    itemCount: data.item_count,
    durationSeconds: data.duration_seconds,
    examSlug: slug ?? '',
  };
}
