import { supabase, isSupabaseConfigured } from '../supabase';
import type { Question, QuestionChoice } from '../types';
import { cleanStem } from '../types';
import { shuffleQuestionChoices } from '../question-randomization';

type DiagnosticRow = {
  id: string;
  stem: string;
  choices: QuestionChoice[];
  difficulty: number;
  topic_name: string;
  subject_name: string;
  exam_slug: string;
};

export type DiagnosticResult = {
  score: number;
  readiness: number;
  weakSubjects: string[];
  scoreBySubject: Record<string, number>;
};

export async function hasCompletedDiagnostic(examSlug: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const { data, error } = await supabase.rpc('has_completed_diagnostic', {
    p_exam_slug: examSlug,
  });

  if (error) throw error;
  return Boolean(data);
}

export async function fetchDiagnosticQuestions(examSlug: string, limit = 40): Promise<Question[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_diagnostic_questions', {
    p_exam_slug: examSlug,
    p_limit: limit,
  });

  if (error) throw error;

  return ((data ?? []) as DiagnosticRow[]).map((row) => shuffleQuestionChoices({
    id: row.id,
    stem: cleanStem(row.stem),
    choices: row.choices,
    difficulty: row.difficulty,
    topic: {
      name: row.topic_name,
      subject: { name: row.subject_name, exam_slug: row.exam_slug },
    },
  }));
}

export async function completeDiagnostic(
  sessionId: string,
  durationSeconds: number
): Promise<DiagnosticResult | null> {
  if (!isSupabaseConfigured || !sessionId) return null;

  const { data, error } = await supabase.rpc('complete_diagnostic', {
    p_session_id: sessionId,
    p_duration_seconds: durationSeconds,
  });

  if (error) throw error;

  const row = data as {
    score: number;
    readiness: number;
    weak_subjects: string[];
    score_by_subject: Record<string, number>;
  };

  return {
    score: Number(row.score ?? 0),
    readiness: Number(row.readiness ?? 0),
    weakSubjects: row.weak_subjects ?? [],
    scoreBySubject: row.score_by_subject ?? {},
  };
}
