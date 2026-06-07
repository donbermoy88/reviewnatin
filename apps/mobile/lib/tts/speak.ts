import { Platform } from 'react-native';
import { sanitizeSpeechText } from './sanitize';

let speechModule: typeof import('expo-speech') | null = null;

async function getSpeech() {
  if (Platform.OS === 'web') return null;
  if (!speechModule) {
    speechModule = await import('expo-speech');
  }
  return speechModule;
}

export async function speakText(
  text: string,
  locale: 'en' | 'fil' = 'en',
  options?: {
    onDone?: () => void;
    onError?: () => void;
  }
): Promise<boolean> {
  const trimmed = sanitizeSpeechText(text);
  if (!trimmed) return false;

  const Speech = await getSpeech();
  if (!Speech) return false;

  try {
    await Speech.stop();
    Speech.speak(trimmed, {
      language: locale === 'fil' ? 'fil-PH' : 'en-PH',
      rate: Platform.OS === 'ios' ? 0.48 : 0.9,
      onDone: options?.onDone,
      onStopped: options?.onDone,
      onError: options?.onError,
    });
    return true;
  } catch {
    options?.onError?.();
    return false;
  }
}

export async function stopSpeaking(): Promise<void> {
  const Speech = await getSpeech();
  if (Speech) await Speech.stop();
}

export function canUseTts(): boolean {
  return Platform.OS !== 'web';
}
