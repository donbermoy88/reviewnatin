import { supabase, isSupabaseConfigured } from '../supabase';

export type AiExplainResult =
  | { ok: true; explanation: string; source: 'human' | 'ai' | 'fallback'; remaining: number | null }
  | { ok: false; error: 'daily_limit_reached' | 'not_authenticated' | 'network' | string };

export async function fetchAiExplanation(
  questionId: string,
  options?: { locale?: 'en' | 'fil'; examSlug?: string }
): Promise<AiExplainResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'network' };
  }

  const { data, error } = await supabase.functions.invoke('ai-explain', {
    body: {
      question_id: questionId,
      locale: options?.locale ?? 'en',
      exam_slug: options?.examSlug,
    },
  });

  if (error) {
    if (error.message?.includes('429') || error.message?.includes('daily_limit')) {
      return { ok: false, error: 'daily_limit_reached' };
    }
    return { ok: false, error: error.message };
  }

  const body = data as {
    success?: boolean;
    explanation?: string;
    source?: 'human' | 'ai' | 'fallback';
    remaining?: number | null;
    error?: string;
  } | null;

  if (!body?.success || !body.explanation) {
    if (body?.error === 'daily_limit_reached') {
      return { ok: false, error: 'daily_limit_reached' };
    }
    return { ok: false, error: body?.error ?? 'unknown' };
  }

  return {
    ok: true,
    explanation: body.explanation,
    source: body.source ?? 'fallback',
    remaining: body.remaining ?? null,
  };
}
