import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReportContentType, ReportReason } from '../api/content-reports';

const QUEUE_KEY = 'reviewnatin:offline:content-reports:v1';
const MAX_QUEUE_ITEMS = 100;
const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 30 * 60 * 1000;

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

export function nextRetryAt(attemptCount: number, now = Date.now()): string {
  const delay = Math.min(BASE_BACKOFF_MS * 2 ** Math.max(attemptCount - 1, 0), MAX_BACKOFF_MS);
  return new Date(now + delay).toISOString();
}

export async function readPendingContentReports(): Promise<PendingContentReport[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingContentReport[]) : [];
  } catch {
    return [];
  }
}

export async function writePendingContentReports(items: PendingContentReport[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE_ITEMS)));
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
  await AsyncStorage.removeItem(QUEUE_KEY);
}
