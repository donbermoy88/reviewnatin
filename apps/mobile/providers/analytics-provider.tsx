import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PostHogProvider } from 'posthog-react-native';
import {
  initPostHog,
  isPostHogEnabled,
  shutdownPostHog,
} from '../lib/analytics/posthog';
import { trackEvent, type AnalyticsEventName, type AnalyticsProperties } from '../lib/analytics/events';

const DAILY_ACTIVE_KEY = 'reviewnatin:analytics:daily_active';

type AnalyticsContextValue = {
  track: (name: AnalyticsEventName, properties?: AnalyticsProperties) => void;
  enabled: boolean;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function AnalyticsRuntime({ children }: { children: React.ReactNode }) {
  const firedDaily = useRef(false);

  const track = useCallback((name: AnalyticsEventName, properties?: AnalyticsProperties) => {
    trackEvent(name, properties);
  }, []);

  useEffect(() => {
    const recordDailyActive = async () => {
      if (firedDaily.current) return;
      try {
        const today = new Date().toISOString().slice(0, 10);
        const last = await AsyncStorage.getItem(DAILY_ACTIVE_KEY);
        if (last === today) {
          firedDaily.current = true;
          return;
        }
        await AsyncStorage.setItem(DAILY_ACTIVE_KEY, today);
        firedDaily.current = true;
        track('daily_active', { date: today });
      } catch {
        // ignore
      }
    };

    void recordDailyActive();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void recordDailyActive();
    });
    return () => sub.remove();
  }, [track]);

  const value = useMemo(
    () => ({ track, enabled: isPostHogEnabled() }),
    [track]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const posthogClient = useMemo(() => initPostHog(), []);

  useEffect(() => () => shutdownPostHog(), []);

  if (!posthogClient) {
    return <AnalyticsRuntime>{children}</AnalyticsRuntime>;
  }

  return (
    <PostHogProvider
      client={posthogClient}
      autocapture={{
        captureScreens: false,
        captureTouches: false,
      }}
    >
      <AnalyticsRuntime>{children}</AnalyticsRuntime>
    </PostHogProvider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return ctx;
}

/** Safe hook when provider may be absent (e.g. tests). */
export function useAnalyticsOptional() {
  return useContext(AnalyticsContext);
}
