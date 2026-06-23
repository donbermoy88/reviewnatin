import * as Linking from 'expo-linking';

/** Single read of Linking.getInitialURL — shared by deeplink handler and auth screens. */
let cachedInitialUrl: string | null | undefined;
let initialUrlPromise: Promise<string | null> | null = null;
const INITIAL_URL_TIMEOUT_MS = 1500;

function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

function fetchInitialUrl(): Promise<string | null> {
  if (initialUrlPromise) return initialUrlPromise;
  initialUrlPromise = withTimeout(Linking.getInitialURL(), null, INITIAL_URL_TIMEOUT_MS)
    .then((url) => {
      cachedInitialUrl = url ?? null;
      return cachedInitialUrl;
    })
    .catch(() => {
      cachedInitialUrl = null;
      return null;
    });
  return initialUrlPromise;
}

export async function consumeInitialUrl(): Promise<string | null> {
  if (cachedInitialUrl !== undefined) return cachedInitialUrl;
  return fetchInitialUrl();
}

export function peekInitialUrl(): string | null | undefined {
  return cachedInitialUrl;
}
