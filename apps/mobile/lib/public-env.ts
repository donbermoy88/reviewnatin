import Constants from 'expo-constants';

type PublicExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

type ConstantsWithManifests = typeof Constants & {
  manifest?: { extra?: PublicExtra } | null;
  manifest2?: { extra?: { expoClient?: { extra?: PublicExtra } } & PublicExtra } | null;
};

function readExtra(extraKey: keyof PublicExtra): string {
  const constants = Constants as ConstantsWithManifests;
  const extraSources = [
    constants.expoConfig?.extra,
    constants.manifest?.extra,
    constants.manifest2?.extra?.expoClient?.extra,
    constants.manifest2?.extra,
  ] as Array<PublicExtra | undefined>;

  for (const extra of extraSources) {
    const value = extra?.[extraKey]?.trim();
    if (value) return value;
  }

  return '';
}

export function getPublicEnv(processKey: string, extraKey: keyof PublicExtra): string {
  const fromProcess = process.env[processKey]?.trim();
  if (fromProcess) return fromProcess;

  return readExtra(extraKey);
}
