import { supabase, isSupabaseConfigured } from '../supabase';

export type AiTutorMessage = { role: 'user' | 'assistant'; content: string };

export type AiTutorResult =
  | { ok: true; reply: string; source: 'ai' | 'fallback' }
  | { ok: false; error: 'premium_required' | 'not_authenticated' | 'network' | string };

export async function sendAiTutorMessage(
  messages: AiTutorMessage[],
  options?: { examSlug?: string; locale?: 'en' | 'fil' }
): Promise<AiTutorResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'network' };
  }

  const { data, error } = await supabase.functions.invoke('ai-tutor', {
    body: {
      messages,
      exam_slug: options?.examSlug,
      locale: options?.locale ?? 'en',
    },
  });

  if (error) {
    if (error.message?.includes('403') || error.message?.includes('premium')) {
      return { ok: false, error: 'premium_required' };
    }
    return { ok: false, error: error.message };
  }

  const body = data as {
    success?: boolean;
    reply?: string;
    source?: 'ai' | 'fallback';
    error?: string;
  } | null;

  if (!body?.success || !body.reply) {
    if (body?.error === 'premium_required') {
      return { ok: false, error: 'premium_required' };
    }
    return { ok: false, error: body?.error ?? 'unknown' };
  }

  return {
    ok: true,
    reply: body.reply,
    source: body.source ?? 'fallback',
  };
}
