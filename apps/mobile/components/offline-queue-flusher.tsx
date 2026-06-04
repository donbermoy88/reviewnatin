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
    void flushPendingAnswers()
      .catch(() => { /* will retry on next online window */ })
      .finally(() => { inFlight.current = false; });
  }, [isOnline, hasProbed, user]);

  return null;
}
