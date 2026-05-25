import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Question } from '../types';
import { supabase, isSupabaseConfigured } from '../supabase';

export type OfflinePackMeta = {
  examSlug: string;
  downloadedAt: string;
  questionCount: number;
  flashcardCount: number;
  materialCount: number;
};

type OfflinePackContent = {
  exam_slug: string;
  downloaded_at: string;
  questions: unknown[];
  flashcards: unknown[];
  review_materials: unknown[];
};

const packKey = (examSlug: string) => `reviewnatin:offline:${examSlug}`;

type OfflineQuestionRow = {
  id: string;
  stem: string;
  choices: { id: string; text: string }[];
  correct_choice_id: string;
  explanation_en?: string | null;
  explanation_fil?: string | null;
  difficulty: number;
  topic_name: string;
  topic_slug: string;
  subject_name: string;
};

async function readPack(examSlug: string): Promise<OfflinePackContent | null> {
  try {
    const raw = await AsyncStorage.getItem(packKey(examSlug));
    if (!raw) return null;
    return JSON.parse(raw) as OfflinePackContent;
  } catch {
    return null;
  }
}

function mapOfflineQuestion(row: OfflineQuestionRow): Question {
  return {
    id: row.id,
    stem: row.stem,
    choices: row.choices,
    correct_choice_id: row.correct_choice_id,
    explanation_en: row.explanation_en,
    explanation_fil: row.explanation_fil,
    difficulty: row.difficulty,
    topic: { name: row.topic_name, subject: { name: row.subject_name } },
  };
}

export async function hasOfflinePack(examSlug: string): Promise<boolean> {
  const pack = await readPack(examSlug);
  return (pack?.questions?.length ?? 0) > 0;
}

export async function getOfflineQuestions(examSlug: string): Promise<Question[]> {
  const pack = await readPack(examSlug);
  if (!pack?.questions?.length) return [];
  return (pack.questions as OfflineQuestionRow[]).map(mapOfflineQuestion);
}

export async function pickOfflinePracticeQuestions(
  examSlug: string,
  limit: number,
  topicSlug?: string
): Promise<Question[]> {
  let rows = await getOfflineQuestions(examSlug);
  if (topicSlug) {
    const pack = await readPack(examSlug);
    const filtered = (pack?.questions as OfflineQuestionRow[] | undefined)?.filter(
      (q) => q.topic_slug === topicSlug
    );
    rows = (filtered ?? []).map(mapOfflineQuestion);
  }
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.max(limit, 1));
}

export function checkOfflineAnswer(question: Question, choiceId: string) {
  const correct = question.correct_choice_id ?? '';
  return {
    isCorrect: choiceId === correct,
    correctChoiceId: correct,
    explanationEn: question.explanation_en ?? null,
    explanationFil: question.explanation_fil ?? null,
  };
}

export async function getOfflinePackMeta(examSlug: string): Promise<OfflinePackMeta | null> {
  try {
    const parsed = await readPack(examSlug);
    if (!parsed) return null;
    return {
      examSlug: parsed.exam_slug,
      downloadedAt: parsed.downloaded_at,
      questionCount: parsed.questions?.length ?? 0,
      flashcardCount: parsed.flashcards?.length ?? 0,
      materialCount: parsed.review_materials?.length ?? 0,
    };
  } catch {
    return null;
  }
}

export async function downloadOfflinePack(examSlug: string): Promise<
  | { ok: true; meta: OfflinePackMeta }
  | { ok: false; error: 'not_authenticated' | 'premium_required' | 'network' | string }
> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'network' };
  }

  const { data, error } = await supabase.rpc('get_offline_pack_content', {
    p_exam_slug: examSlug,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const body = data as OfflinePackContent & { error?: string };
  if (body.error === 'premium_required') {
    return { ok: false, error: 'premium_required' };
  }
  if (body.error === 'not_authenticated') {
    return { ok: false, error: 'not_authenticated' };
  }
  if (body.error) {
    return { ok: false, error: body.error };
  }

  await AsyncStorage.setItem(packKey(examSlug), JSON.stringify(body));

  return {
    ok: true,
    meta: {
      examSlug: body.exam_slug,
      downloadedAt: body.downloaded_at,
      questionCount: body.questions?.length ?? 0,
      flashcardCount: body.flashcards?.length ?? 0,
      materialCount: body.review_materials?.length ?? 0,
    },
  };
}

export async function deleteOfflinePack(examSlug: string): Promise<void> {
  await AsyncStorage.removeItem(packKey(examSlug));
}

export async function getOfflineFlashcards(examSlug: string): Promise<
  Array<{ id: string; front: string; back: string; topic_name: string; subject_name: string; topic_slug?: string }>
> {
  const pack = await readPack(examSlug);
  if (!pack?.flashcards?.length) return [];
  return pack.flashcards as Array<{
    id: string;
    front: string;
    back: string;
    topic_name: string;
    subject_name: string;
    topic_slug?: string;
  }>;
}

export type OfflineMaterial = {
  id: string;
  title: string;
  body: string;
  materialType: string;
  topicSlug?: string;
  subjectName: string;
};

export async function getOfflineMaterials(examSlug: string): Promise<OfflineMaterial[]> {
  const pack = await readPack(examSlug);
  if (!pack?.review_materials?.length) return [];
  return (pack.review_materials as Array<{
    id: string;
    title: string;
    body: string;
    material_type: string;
    topic_slug?: string;
    subject_name: string;
  }>).map((m) => ({
    id: m.id,
    title: m.title,
    body: m.body,
    materialType: m.material_type,
    topicSlug: m.topic_slug,
    subjectName: m.subject_name,
  }));
}

export async function getOfflineMaterialById(
  examSlug: string,
  materialId: string
): Promise<OfflineMaterial | null> {
  const materials = await getOfflineMaterials(examSlug);
  return materials.find((m) => m.id === materialId) ?? null;
}
