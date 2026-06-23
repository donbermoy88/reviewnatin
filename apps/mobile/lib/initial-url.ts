import * as Linking from 'expo-linking';

/** Single read of Linking.getInitialURL — shared by deeplink handler and auth screens. */
let cachedInitialUrl: string | null | undefined;

export async function consumeInitialUrl(): Promise<string | null> {
  if (cachedInitialUrl !== undefined) return cachedInitialUrl;
  try {
    cachedInitialUrl = (await Linking.getInitialURL()) ?? null;
  } catch {
    cachedInitialUrl = null;
  }
  return cachedInitialUrl;
}

export function peekInitialUrl(): string | null | undefined {
  return cachedInitialUrl;
}
