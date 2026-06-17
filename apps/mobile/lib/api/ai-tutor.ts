import { supabase, isSupabaseConfigured } from '../supabase';

export type AiTutorMessage = { role: 'user' | 'assistant'; content: string };

export type AiTutorResult =
  | { ok: true; reply: string; source: 'ai' | 'fallback'; remaining?: number; limit?: number }
  | {
      ok: false;
      error:
        | 'premium_required'
        | 'not_authenticated'
        | 'daily_limit_reached'
        | 'cooldown'
        | 'input_too_long'
        | 'network'
        | string;
      retryAfter?: number;
      limit?: number;
    };

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
    let parsed: { error?: string; retry_after?: number; limit?: number } | null = null;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        parsed = (await ctx.json()) as { error?: string; retry_after?: number; limit?: number } | null;
      }
    } catch {
      /* body unavailable — fall back to message heuristics below */
    }
    const code = parsed?.error;
    if (code === 'premium_required' || error.message?.includes('403') || error.message?.includes('premium')) {
      return { ok: false, error: 'premium_required' };
    }
    if (code) return { ok: false, error: code, retryAfter: parsed?.retry_after, limit: parsed?.limit };
    return { ok: false, error: error.message };
  }

  const body = data as {
    success?: boolean;
    reply?: string;
    source?: 'ai' | 'fallback';
    error?: string;
    remaining?: number;
    limit?: number;
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
    remaining: body.remaining,
    limit: body.limit,
  };
}
