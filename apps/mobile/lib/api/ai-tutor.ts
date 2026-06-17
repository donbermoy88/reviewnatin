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
    // functions.invoke surfaces non-2xx as FunctionsHttpError and does NOT parse
    // the body — read the structured { error } code off the Response in .context
    // so we can distinguish premium_required / daily_limit_reached from a generic
    // failure (otherwise every non-2xx shows the same opaque message).
    let code: string | undefined;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        code = ((await ctx.json()) as { error?: string } | null)?.error;
      }
    } catch {
      /* body unavailable — fall back to message heuristics below */
    }
    if (code === 'premium_required' || error.message?.includes('403') || error.message?.includes('premium')) {
      return { ok: false, error: 'premium_required' };
    }
    if (code) return { ok: false, error: code };
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
