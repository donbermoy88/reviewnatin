import type { ExamType, Question, QuestionChoice, SubjectArea } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

type QuestionRow = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  correct_choice_id: string;
  explanation_en: string | null;
  explanation_fil: string | null;
  difficulty: number;
  topics: {
    name: string;
    subject_areas: { name: string; exam_types: { slug: string; name: string } | null } | null;
  } | null;
};

function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    stem: row.stem,
    choices: row.choices,
    correct_choice_id: row.correct_choice_id,
    explanation_en: row.explanation_en,
    explanation_fil: row.explanation_fil,
    difficulty: row.difficulty,
    topic: row.topics
      ? {
          name: row.topics.name,
          subject: row.topics.subject_areas
            ? {
                name: row.topics.subject_areas.name,
                exam_slug: row.topics.subject_areas.exam_types?.slug,
              }
            : undefined,
        }
      : undefined,
  };
}

export async function fetchExamTypes(): Promise<ExamType[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from('exam_types').select('id, slug, name').eq('is_active', true).order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchExamBySlug(slug: string): Promise<ExamType | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('exam_types').select('id, slug, name').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchSubjectAreas(examTypeId: string): Promise<SubjectArea[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('subject_areas')
    .select('id, slug, name, sort_order')
    .eq('exam_type_id', examTypeId)
    .order('sort_order');
  if (error) throw error;
  return data ?? [];
}

export async function fetchPracticeQuestions(examSlug: string, limit = 12): Promise<Question[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('questions')
    .select(
      `id, stem, choices, correct_choice_id, explanation_en, explanation_fil, difficulty,
       topics ( name, subject_areas ( name, exam_types ( slug, name ) ) )`
    )
    .eq('status', 'published')
    .limit(50);

  if (error) throw error;

  const rows = (data ?? []) as unknown as QuestionRow[];
  return rows
    .filter((q) => q.topics?.subject_areas?.exam_types?.slug === examSlug)
    .slice(0, limit)
    .map(mapQuestion);
}
