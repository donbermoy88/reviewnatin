import { flushPendingContentReports } from '../api/content-reports';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../monitoring/events';
import { flushPendingAnswers, pendingSessionCount } from './answer-queue';
import { pendingContentReportCount } from './content-report-queue';

export type OfflineSyncCounts = {
  answerSessions: number;
  contentReports: number;
  total: number;
};

export type OfflineSyncResult = {
  flushed: number;
  failed: number;
  remaining: number;
  answers: Awaited<ReturnType<typeof flushPendingAnswers>>;
  reports: Awaited<ReturnType<typeof flushPendingContentReports>>;
};

export async function getPendingOfflineSyncCount(userId?: string): Promise<OfflineSyncCounts> {
  const [answerSessions, contentReports] = await Promise.all([
    pendingSessionCount(userId),
    pendingContentReportCount(userId),
  ]);

  return {
    answerSessions,
    contentReports,
    total: answerSessions + contentReports,
  };
}

export async function flushOfflineSync(userId: string): Promise<OfflineSyncResult> {
  addAppBreadcrumb('offline_sync', 'manual sync started');

  try {
    const [answers, reports] = await Promise.all([
      flushPendingAnswers(userId),
      flushPendingContentReports(userId),
    ]);
    const counts = await getPendingOfflineSyncCount(userId);
    const result = {
      flushed: answers.flushed + reports.flushed,
      failed: answers.failed + reports.failed,
      remaining: counts.total,
      answers,
      reports,
    };

    captureAppMessage(
      'manual offline sync completed',
      { area: 'offline_sync', action: 'manual_sync' },
      {
        flushed: result.flushed,
        failed: result.failed,
        remaining: result.remaining,
      },
      result.failed > 0 ? 'warning' : 'info'
    );

    return result;
  } catch (error) {
    captureAppException(error, { area: 'offline_sync', action: 'manual_sync' });
    throw error;
  }
}
