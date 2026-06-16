/**
 * Lightweight online/offline detector.
 *
 * We intentionally avoid adding @react-native-community/netinfo as a
 * dependency since it requires a native rebuild (expo prebuild) which
 * complicates Expo Go and CI builds. Instead, we probe a tiny endpoint
 * with a short timeout on a regular interval. This is "best effort" but
 * matches how the rest of the offline pipeline already behaves: we try
 * the network first, and fall back to the cached pack on any failure.
 *
 * Probing every 20s with a 4s timeout costs ~5 bytes of bandwidth per
 * minute when the app is in the foreground, and zero when it is in the
 * background (React Native suspends the interval).
 */
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const PROBE_INTERVAL_MS = 20_000;
const PROBE_TIMEOUT_MS = 4_000;

type NetworkStatus = {
  isOnline: boolean;
  /** Has the hook completed its first probe? Avoids a false "offline" flash on launch. */
  hasProbed: boolean;
};

let cachedSupabaseUrl: string | null = null;
function probeUrl(): string {
  if (cachedSupabaseUrl) return cachedSupabaseUrl;
  // Probe our own backend so "online" means "the API is reachable", not just
  // "some internet exists". Use the public env value rather than supabase-js
  // internals (which change across minor versions). Fall back to a known-cheap
  // 204 endpoint only when the URL isn't configured.
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  cachedSupabaseUrl = base ? `${base}/rest/v1/` : 'https://www.gstatic.com/generate_204';
  return cachedSupabaseUrl;
}

async function probeOnce(): Promise<boolean> {
  const url = probeUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // HEAD is cheapest. Some endpoints reject HEAD; fall back to GET.
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res.ok || res.status === 401 || res.status === 405; // 405 → fallback method
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(true);
  const [hasProbed, setHasProbed] = useState(false);
  const mounted = useRef(true);
  const consecutiveFailures = useRef(0);

  useEffect(() => {
    mounted.current = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Require two consecutive failures before declaring offline. A single HEAD
    // probe routinely times out during the heavy JS cold start even when the
    // network is fine, which flashed a false "Offline" banner for ~20s.
    // Recovery is immediate: any successful probe clears the offline state.
    const FAILURES_BEFORE_OFFLINE = 2;

    const probe = async () => {
      const online = await probeOnce();
      if (!mounted.current) return;
      if (online) {
        consecutiveFailures.current = 0;
        setIsOnline(true);
        setHasProbed(true);
        return;
      }
      consecutiveFailures.current += 1;
      if (consecutiveFailures.current >= FAILURES_BEFORE_OFFLINE) {
        setIsOnline(false);
        setHasProbed(true);
      }
    };

    const startPolling = () => {
      if (intervalId) return;
      void probe();
      intervalId = setInterval(probe, PROBE_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    startPolling();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') startPolling();
      else stopPolling();
    });

    return () => {
      mounted.current = false;
      stopPolling();
      sub.remove();
    };
  }, []);

  return { isOnline, hasProbed };
}
