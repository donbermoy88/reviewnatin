import { Platform } from 'react-native';

let speechModule: typeof import('expo-speech') | null = null;

async function getSpeech() {
  if (Platform.OS === 'web') return null;
  if (!speechModule) {
    speechModule = await import('expo-speech');
  }
  return speechModule;
}

export async function speakText(text: string, locale: 'en' | 'fil' = 'en'): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const Speech = await getSpeech();
  if (!Speech) return false;

  try {
    Speech.stop();
    await new Promise<void>((resolve) => {
      Speech.speak(trimmed, {
        language: locale === 'fil' ? 'fil-PH' : 'en-PH',
        rate: Platform.OS === 'ios' ? 0.48 : 0.9,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopSpeaking(): Promise<void> {
  const Speech = await getSpeech();
  if (Speech) Speech.stop();
}

export function canUseTts(): boolean {
  return Platform.OS !== 'web';
}
