import { Alert, NativeModules, Share } from 'react-native';
import { SITE_URL } from '@reviewnatin/shared';

export type ScoreSharePayload = {
  displayName: string;
  examName: string;
  modeLabel: string;
  score: number;
  correct: number;
  total: number;
};

/** Native module is only linked after a dev-client / EAS rebuild — not in Expo Go or old sim builds. */
export function canUseViewShot(): boolean {
  return !!NativeModules.RNViewShot;
}

export function buildScoreShareMessage({
  displayName,
  examName,
  modeLabel,
  score,
  correct,
  total,
}: ScoreSharePayload): string {
  return `${displayName} scored ${score}% on ${modeLabel} (${correct}/${total}) with ReviewNatin — ${examName}. ${SITE_URL}`;
}

export async function shareQuizScore(payload: ScoreSharePayload): Promise<void> {
  const message = buildScoreShareMessage(payload);

  try {
    await Share.share({ message });
  } catch {
    Alert.alert('Could not share', 'Subukan ulit later.');
  }
}

/**
 * Optional PNG share — only call after dynamically loading view-shot in a build
 * where `canUseViewShot()` is true (production / rebuilt dev client).
 */
export async function shareQuizScoreImage(
  capture: () => Promise<string | undefined>
): Promise<boolean> {
  if (!canUseViewShot()) return false;

  try {
    const Sharing = await import('expo-sharing');
    const uri = await capture();
    if (!uri || !(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your score' });
    return true;
  } catch {
    return false;
  }
}
