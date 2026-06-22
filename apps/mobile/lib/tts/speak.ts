import { Platform } from 'react-native';
import { resolveSpeechChunkLimit, splitSpeechText } from './chunks';
import { sanitizeSpeechText } from './sanitize';

type SpeechModule = typeof import('expo-speech');
type SpeechVoice = Awaited<ReturnType<SpeechModule['getAvailableVoicesAsync']>>[number];

let speechModule: SpeechModule | null = null;
let voicesCache: SpeechVoice[] | null = null;

async function getSpeech() {
  if (Platform.OS === 'web') return null;
  if (!speechModule) {
    speechModule = await import('expo-speech');
  }
  return speechModule;
}

async function getAvailableVoices(Speech: SpeechModule): Promise<SpeechVoice[]> {
  if (voicesCache) return voicesCache;
  try {
    voicesCache = await Speech.getAvailableVoicesAsync();
  } catch {
    voicesCache = [];
  }
  return voicesCache;
}

function normalizeLanguage(language: string): string {
  return language.toLowerCase().replace(/_/g, '-');
}

function chooseVoice(voices: SpeechVoice[], locale: 'en' | 'fil'): SpeechVoice | null {
  const candidates =
    locale === 'fil'
      ? ['fil-ph', 'fil', 'tl-ph', 'tl', 'en-us', 'en-ph', 'en']
      : ['en-us', 'en-ph', 'en'];

  for (const candidate of candidates) {
    const exact = voices.find((voice) => normalizeLanguage(voice.language) === candidate);
    if (exact) return exact;
  }

  for (const candidate of candidates) {
    const base = candidate.split('-')[0];
    const match = voices.find((voice) => {
      const language = normalizeLanguage(voice.language);
      return language === base || language.startsWith(`${base}-`);
    });
    if (match) return match;
  }

  return null;
}

async function resolveVoiceConfig(
  Speech: SpeechModule,
  locale: 'en' | 'fil'
): Promise<{ language: string; voice?: string }> {
  const voice = chooseVoice(await getAvailableVoices(Speech), locale);
  if (voice) return { language: voice.language, voice: voice.identifier };
  return { language: locale === 'fil' ? 'fil-PH' : 'en-US' };
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
    const voiceConfig = await resolveVoiceConfig(Speech, locale);
    const chunks = splitSpeechText(trimmed, resolveSpeechChunkLimit(Speech.maxSpeechInputLength));
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      options?.onDone?.();
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      options?.onError?.();
    };

    chunks.forEach((chunk, index) => {
      const isLast = index === chunks.length - 1;
      Speech.speak(chunk, {
        ...voiceConfig,
        rate: Platform.OS === 'ios' ? 0.48 : 0.9,
        pitch: 1,
        volume: 1,
        onDone: isLast ? finish : undefined,
        onStopped: finish,
        onError: fail,
      });
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
