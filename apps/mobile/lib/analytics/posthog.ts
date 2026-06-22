import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

type PostHogProps = Record<string, string | number | boolean | null>;

function sanitizeProperties(
  properties?: Record<string, string | number | boolean | null | undefined>
): PostHogProps | undefined {
  if (!properties) return undefined;
  const out: PostHogProps = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined) out[key] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function getPostHogApiKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
  return key || undefined;
}

export function getPostHogHost(): string {
  return process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
}

export function isPostHogEnabled(): boolean {
  return Boolean(getPostHogApiKey());
}

/** Initialize the shared PostHog client (no-op when API key is missing). */
export function initPostHog(): PostHog | null {
  const apiKey = getPostHogApiKey();
  if (!apiKey) return null;
  if (client) return client;

  client = new PostHog(apiKey, {
    host: getPostHogHost(),
    captureAppLifecycleEvents: true,
  });
  return client;
}

export function getPostHogClient(): PostHog | null {
  return client;
}

export function shutdownPostHog(): void {
  const ph = client;
  client = null;
  void ph?.flush?.();
}

export function capturePostHog(
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.capture(event, sanitizeProperties(properties));
}

export function screenPostHog(
  screenName: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.screen(screenName, sanitizeProperties(properties));
}

export function identifyPostHog(
  distinctId: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): void {
  const ph = getPostHogClient();
  if (!ph) return;
  ph.identify(distinctId, sanitizeProperties(properties));
}

export function resetPostHog(): void {
  getPostHogClient()?.reset();
}
