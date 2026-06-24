import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Linking, Platform } from 'react-native';
import type { BetaCohort } from './beta-cohort';
import { resolveBetaCohort } from './beta-cohort';

const BETA_FEEDBACK_EMAIL = 'beta@reviewnatinph.com';

export type { BetaCohort };

export type BetaFeedbackContext = {
  userId?: string | null;
  cohortHint?: BetaCohort;
  isPremiumActive?: boolean;
  currentRoute?: string;
};

export function buildBetaFeedbackMailto(ctx: BetaFeedbackContext = {}): string {
  const version = Constants.expoConfig?.version ?? 'unknown';
  const build =
    Platform.OS === 'android'
      ? Constants.expoConfig?.android?.versionCode
      : Constants.expoConfig?.ios?.buildNumber;
  const device = Device.modelName ?? 'unknown';
  const os = `${Platform.OS} ${Platform.Version}`;

  const cohort =
    ctx.cohortHint ??
    resolveBetaCohort(ctx.userId, ctx.isPremiumActive ?? false);

  const subject = encodeURIComponent(`[ReviewNatin Beta] Issue report (${cohort})`);
  const body = encodeURIComponent(
    `Describe the issue:\n\n\n` +
      `---\n` +
      `App version: ${version} (build ${build ?? '?'})\n` +
      `Device: ${device}\n` +
      `OS: ${os}\n` +
      `Cohort: ${cohort}\n` +
      `User ID: ${ctx.userId ?? 'guest'}\n` +
      `Screen: ${ctx.currentRoute ?? 'unknown'}\n`
  );

  return `mailto:${BETA_FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

export async function openBetaFeedback(ctx: BetaFeedbackContext = {}): Promise<void> {
  const url = buildBetaFeedbackMailto(ctx);
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
}
