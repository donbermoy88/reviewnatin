import { supabase, isSupabaseConfigured } from '../supabase';
import { captureAppException, captureAppMessage } from '../monitoring/events';
import {
  createPendingReportId,
  nextRetryAt,
  queueContentReport,
  readPendingContentReports,
  writePendingContentReports,
  type PendingContentReport,
} from '../offline/content-report-queue';

export type ReportReason = 'wrong_answer' | 'unclear_question' | 'outdated' | 'typo' | 'other';
export type ReportContentType = 'question' | 'flashcard' | 'review_material';

type ReportContentParams = {
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
  details?: string;
};

type SubmitContentReportParams = ReportContentParams & {
  userId: string;
};

function targetPayload(contentType: ReportContentType, contentId: string) {
  return {
    question_id: contentType === 'question' ? contentId : null,
    flashcard_id: contentType === 'flashcard' ? contentId : null,
    review_material_id: contentType === 'review_material' ? contentId : null,
  };
}

function applyTargetFilter(query: any, contentType: ReportContentType, contentId: string) {
  if (contentType === 'question') return query.eq('question_id', contentId);
  if (contentType === 'flashcard') return query.eq('flashcard_id', contentId);
  return query.eq('review_material_id', contentId);
}

function cleanDetails(details?: string | null): string | null {
  return details?.trim() ? details.trim().slice(0, 1000) : null;
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

function shouldQueueReportError(error: unknown): boolean {
  const code = errorCode(error);
  if (!code) return true;
  // Constraint/auth errors are deterministic; queueing them would retry forever.
  return !['22', '23', '42501', 'PGRST'].some((prefix) => code.startsWith(prefix));
}

async function submitContentReport({
  userId,
  contentType,
  contentId,
  reason,
  details,
}: SubmitContentReportParams): Promise<void> {
  const normalizedDetails = cleanDetails(details);
  const payload = {
    user_id: userId,
    content_type: contentType,
    reason,
    details: normalizedDetails,
    ...targetPayload(contentType, contentId),
  };

  const { error } = await supabase.from('content_reports').insert(payload);
  if (!error) return;

  // If the user already has an open report for this item, refresh it instead
  // of failing. This keeps the UI forgiving while admin still sees one queue item.
  if (error.code !== '23505') throw error;

  let update = supabase
    .from('content_reports')
    .update({
      reason,
      details: normalizedDetails,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('status', 'open');

  update = applyTargetFilter(update, contentType, contentId);

  const { error: updateError } = await update;
  if (updateError) throw updateError;
}

export async function reportContent(params: ReportContentParams): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error('Not signed in');

  try {
    await submitContentReport({ ...params, userId });
  } catch (error) {
    if (!shouldQueueReportError(error)) throw error;

    captureAppMessage(
      'content report queued after submit failure',
      { area: 'content_reports', action: 'queue_report' },
      { contentType: params.contentType, reason: params.reason },
      'warning'
    );
    await queueContentReport({
      localId: createPendingReportId({ userId, contentType: params.contentType, contentId: params.contentId }),
      userId,
      contentType: params.contentType,
      contentId: params.contentId,
      reason: params.reason,
      details: cleanDetails(params.details),
      createdAt: new Date().toISOString(),
      attemptCount: 1,
      nextAttemptAt: nextRetryAt(1),
      lastError: error instanceof Error ? error.message : 'network_error',
    });
  }
}

function shouldAttempt(report: PendingContentReport, now = Date.now()): boolean {
  if (!report.nextAttemptAt) return true;
  return new Date(report.nextAttemptAt).getTime() <= now;
}

export async function flushPendingContentReports(userId: string): Promise<{
  flushed: number;
  failed: number;
  remaining: number;
}> {
  if (!isSupabaseConfigured) return { flushed: 0, failed: 0, remaining: 0 };

  const queue = await readPendingContentReports();
  if (queue.length === 0) return { flushed: 0, failed: 0, remaining: 0 };

  const survivors: PendingContentReport[] = [];
  let flushed = 0;
  let failed = 0;

  for (const report of queue) {
    if (report.userId !== userId || !shouldAttempt(report)) {
      survivors.push(report);
      continue;
    }

    try {
      await submitContentReport({ ...report, userId, details: report.details ?? undefined });
      flushed++;
    } catch (error) {
      if (!shouldQueueReportError(error)) {
        captureAppException(error, { area: 'content_reports', action: 'flush_drop_deterministic' }, { contentType: report.contentType });
        failed++;
        continue;
      }

      const attemptCount = (report.attemptCount ?? 0) + 1;
      captureAppException(error, { area: 'content_reports', action: 'flush_pending_report' }, { contentType: report.contentType, attemptCount });
      survivors.push({
        ...report,
        attemptCount,
        nextAttemptAt: nextRetryAt(attemptCount),
        lastError: error instanceof Error ? error.message : 'network_error',
      });
      failed++;
    }
  }

  await writePendingContentReports(survivors);
  return { flushed, failed, remaining: survivors.length };
}
