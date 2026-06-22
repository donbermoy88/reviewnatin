import { useEffect, useRef } from 'react';
import { usePathname, useGlobalSearchParams } from 'expo-router';
import { screenPostHog } from '../../lib/analytics/posthog';

/** Manual Expo Router screen tracking (PostHog autocapture screens breaks on SDK 56). */
export function PostHogScreenTracker() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    const safeParams = Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(',') : String(value ?? ''),
      ])
    );
    screenPostHog(pathname, safeParams);
  }, [pathname, params]);

  return null;
}
