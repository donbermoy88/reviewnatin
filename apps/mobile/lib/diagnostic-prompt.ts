import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeyFor } from './storage-keys';

const dismissalKey = storageKeyFor.diagnosticDismissed;

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function dismissDiagnosticPrompt(userId: string, examSlug: string): Promise<void> {
  await AsyncStorage.setItem(dismissalKey(userId, examSlug), todayStamp());
}

export async function clearDiagnosticPromptDismissal(userId: string, examSlug: string): Promise<void> {
  await AsyncStorage.removeItem(dismissalKey(userId, examSlug));
}

export async function isDiagnosticPromptDismissed(userId: string, examSlug: string): Promise<boolean> {
  const value = await AsyncStorage.getItem(dismissalKey(userId, examSlug));
  return value === todayStamp();
}
