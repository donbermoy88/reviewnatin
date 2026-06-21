import Constants from 'expo-constants';

type PublicExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as PublicExtra;

export function getPublicEnv(processKey: string, extraKey: keyof PublicExtra): string {
  const fromProcess = process.env[processKey]?.trim();
  if (fromProcess) return fromProcess;

  return extra[extraKey]?.trim() ?? '';
}
