import { supabase, isSupabaseConfigured } from '../supabase';
import { captureAppException, captureAppMessage } from '../monitoring/events';

export type IapVerifyPayload = {
  platform: 'apple' | 'google';
  product_id: string;
  transaction_id: string;
  receipt_data?: string;
  purchase_token?: string;
};

export type IapVerifyResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string };

/** Server-side receipt validation via Supabase Edge Function → payment_transactions + user_entitlements */
export async function verifyPurchaseWithServer(payload: IapVerifyPayload): Promise<IapVerifyResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase not configured' };
  }

  const { data, error } = await supabase.functions.invoke('iap-verify', { body: payload });

  if (error) {
    captureAppException(error, { area: 'iap', action: 'iap_verify_function' }, { platform: payload.platform, productId: payload.product_id });
    return { ok: false, error: error.message };
  }

  const body = data as { success?: boolean; error?: string; fulfillment?: { duplicate?: boolean } } | null;
  if (!body?.success) {
    captureAppMessage(
      'iap verification rejected',
      { area: 'iap', action: 'iap_verify_rejected' },
      { platform: payload.platform, productId: payload.product_id, error: body?.error },
      'warning'
    );
    return { ok: false, error: body?.error ?? 'Verification failed' };
  }

  return { ok: true, duplicate: body.fulfillment?.duplicate };
}

export type UsageLimits = {
  dailyQuestionsLimit: number | null;
  dailyQuestionsUsed: number;
  dailyQuestionsRemaining: number | null;
  isPremium: boolean;
  mistakeDays: number | null;
  miniMockAvailable: boolean;
  mockPreviewItems: number | null;
  aiExplanationsDailyLimit: number | null;
  aiExplanationsUsed: number;
  aiExplanationsRemaining: number | null;
  dueFlashcardsCount: number;
};

export async function fetchUsageLimits(examSlug: string): Promise<UsageLimits | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_usage_limits', { p_exam_slug: examSlug });
  if (error) return null;

  const row = data as Record<string, unknown>;
  return {
    dailyQuestionsLimit: (row.daily_questions_limit as number | null) ?? null,
    dailyQuestionsUsed: (row.daily_questions_used as number) ?? 0,
    dailyQuestionsRemaining: (row.daily_questions_remaining as number | null) ?? null,
    isPremium: Boolean(row.is_premium),
    mistakeDays: (row.mistake_days as number | null) ?? null,
    miniMockAvailable: row.mini_mock_available !== false,
    mockPreviewItems: (row.mock_preview_items as number | null) ?? null,
    aiExplanationsDailyLimit: (row.ai_explanations_daily_limit as number | null) ?? null,
    aiExplanationsUsed: (row.ai_explanations_used as number) ?? 0,
    aiExplanationsRemaining: (row.ai_explanations_remaining as number | null) ?? null,
    dueFlashcardsCount: (row.due_flashcards_count as number) ?? 0,
  };
}

export function isDailyLimitError(error: { message?: string; code?: string }): boolean {
  return (
    error.code === 'P0001' ||
    (error.message?.includes('daily_question_limit_reached') ?? false)
  );
}

export function isMiniMockLimitError(error: { message?: string; code?: string }): boolean {
  return error.message?.includes('mini_mock_weekly_limit_reached') ?? false;
}
