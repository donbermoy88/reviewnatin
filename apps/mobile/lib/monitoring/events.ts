import { Sentry } from './sentry';

type ContextValue = string | number | boolean | null | undefined;
type MonitoringContext = Record<string, ContextValue>;

function cleanContext(context?: MonitoringContext): MonitoringContext | undefined {
  if (!context) return undefined;
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined)
  ) as MonitoringContext;
}

export function addAppBreadcrumb(
  category: string,
  message: string,
  data?: MonitoringContext,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data: cleanContext(data),
  });
}

export function captureAppException(
  error: unknown,
  tags: { area: string; action: string },
  context?: MonitoringContext
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.withScope((scope) => {
    scope.setTag('area', tags.area);
    scope.setTag('action', tags.action);
    const cleaned = cleanContext(context);
    if (cleaned) scope.setContext('reviewnatin', cleaned);
    Sentry.captureException(err);
  });
}

export function captureAppMessage(
  message: string,
  tags: { area: string; action: string },
  context?: MonitoringContext,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  Sentry.withScope((scope) => {
    scope.setTag('area', tags.area);
    scope.setTag('action', tags.action);
    const cleaned = cleanContext(context);
    if (cleaned) scope.setContext('reviewnatin', cleaned);
    Sentry.captureMessage(message, level);
  });
}
