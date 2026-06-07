/**
 * Background flusher for queued offline quiz sessions.
 *
 * Mounts once at the root and watches the network probe. The moment
 * we go from offline → online (or the user logs in while online), it
 * tries to push every queued PendingSession to Supabase. Sessions
 * that fail stay queued; sessions that succeed are removed.
 *
 * No UI — entirely a side-effect component.
 */
import { useEffect, useRef } from 'react';
import { useNetworkStatus } from '../hooks/use-network-status';
import { useAuth } from '../providers/auth-provider';
import { flushPendingAnswers } from '../lib/offline/answer-queue';
import { flushPendingContentReports } from '../lib/api/content-reports';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../lib/monitoring/events';

const RETRY_WHILE_ONLINE_MS = 60_000;

export function OfflineQueueFlusher() {
  const { user } = useAuth();
  const { isOnline, hasProbed } = useNetworkStatus();
  const lastOnline = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!hasProbed || !user) return;

    const transitionedToOnline = isOnline && !lastOnline.current;
    const onlineAtMount = isOnline && lastOnline.current;
    lastOnline.current = isOnline;

    if (!transitionedToOnline && !onlineAtMount) return;
    if (inFlight.current) return;

    inFlight.current = true;
    addAppBreadcrumb('offline_sync', 'flush started after online transition');
    void Promise.all([
      flushPendingAnswers(user.id),
      flushPendingContentReports(user.id),
    ])
      .then(([answers, reports]) => {
        if (answers.flushed || answers.failed || reports.flushed || reports.failed) {
          captureAppMessage('offline sync flush completed', { area: 'offline_sync', action: 'flush_completed' }, {
            answerFlushed: answers.flushed,
            answerFailed: answers.failed,
            reportFlushed: reports.flushed,
            reportFailed: reports.failed,
          }, answers.failed || reports.failed ? 'warning' : 'info');
        }
      })
      .catch((error) => {
        captureAppException(error, { area: 'offline_sync', action: 'flush_transition' });
      })
      .finally(() => { inFlight.current = false; });
  }, [isOnline, hasProbed, user]);

  useEffect(() => {
    if (!hasProbed || !isOnline || !user) return;

    const interval = setInterval(() => {
      if (inFlight.current) return;
      inFlight.current = true;
      void Promise.all([
        flushPendingAnswers(user.id),
        flushPendingContentReports(user.id),
      ])
        .then(([answers, reports]) => {
          if (answers.flushed || answers.failed || reports.flushed || reports.failed) {
            captureAppMessage('offline sync periodic flush completed', { area: 'offline_sync', action: 'flush_periodic' }, {
              answerFlushed: answers.flushed,
              answerFailed: answers.failed,
              reportFlushed: reports.flushed,
              reportFailed: reports.failed,
            }, answers.failed || reports.failed ? 'warning' : 'info');
          }
        })
        .catch((error) => {
          captureAppException(error, { area: 'offline_sync', action: 'flush_periodic' });
        })
        .finally(() => { inFlight.current = false; });
    }, RETRY_WHILE_ONLINE_MS);

    return () => clearInterval(interval);
  }, [isOnline, hasProbed, user]);

  return null;
}
