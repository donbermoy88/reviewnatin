import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'reviewnatin:login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type LockoutState = {
  attempts: number;
  lockedUntil: number | null;
};

async function readState(): Promise<LockoutState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    const parsed = JSON.parse(raw) as LockoutState;
    return {
      attempts: parsed.attempts ?? 0,
      lockedUntil: parsed.lockedUntil ?? null,
    };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

async function writeState(state: LockoutState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getLoginLockoutMessage(): Promise<string | null> {
  const state = await readState();
  if (!state.lockedUntil) return null;
  if (Date.now() >= state.lockedUntil) {
    await writeState({ attempts: 0, lockedUntil: null });
    return null;
  }
  const minutesLeft = Math.ceil((state.lockedUntil - Date.now()) / 60_000);
  return `Too many failed login attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`;
}

export async function recordFailedLoginAttempt(): Promise<string | null> {
  const state = await readState();
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    return getLoginLockoutMessage();
  }

  const attempts = state.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS;
    await writeState({ attempts, lockedUntil });
    return `Too many failed login attempts. Try again in 15 minutes.`;
  }

  await writeState({ attempts, lockedUntil: null });
  return null;
}

export async function clearLoginLockout(): Promise<void> {
  await writeState({ attempts: 0, lockedUntil: null });
}
