import type { ReportContentType, ReportReason } from '../api/content-reports';
import { createQueueStorage } from './queue-storage';
import { nextRetryAt } from './retry-policy';

// Re-exported so existing consumers (lib/api/content-reports.ts) keep importing
// the backoff schedule from the queue module.
export { nextRetryAt };

const QUEUE_KEY = 'reviewnatin:offline:content-reports:v1';
const MAX_QUEUE_ITEMS = 100;

export type PendingContentReport = {
  localId: string;
  userId: string;
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
  details?: string | null;
  createdAt: string;
  attemptCount?: number;
  nextAttemptAt?: string;
  lastError?: string;
};

export function createPendingReportId(params: {
  userId: string;
  contentType: ReportContentType;
  contentId: string;
}): string {
  return `${params.userId}:${params.contentType}:${params.contentId}`;
}

const storage = createQueueStorage<PendingContentReport>(QUEUE_KEY, MAX_QUEUE_ITEMS);

export async function readPendingContentReports(): Promise<PendingContentReport[]> {
  return storage.read();
}

export async function writePendingContentReports(items: PendingContentReport[]): Promise<void> {
  return storage.write(items);
}

export async function queueContentReport(report: PendingContentReport): Promise<void> {
  const queue = await readPendingContentReports();
  const existingIndex = queue.findIndex((item) => item.localId === report.localId);
  const normalized = {
    ...report,
    attemptCount: report.attemptCount ?? 0,
    nextAttemptAt: report.nextAttemptAt ?? new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    queue[existingIndex] = {
      ...queue[existingIndex],
      reason: normalized.reason,
      details: normalized.details,
      nextAttemptAt: normalized.nextAttemptAt,
      lastError: normalized.lastError,
    };
  } else {
    queue.push(normalized);
  }

  await writePendingContentReports(queue);
}

export async function pendingContentReportCount(userId?: string): Promise<number> {
  const queue = await readPendingContentReports();
  return userId ? queue.filter((item) => item.userId === userId).length : queue.length;
}

export async function clearPendingContentReports(): Promise<void> {
  await storage.clear();
}
