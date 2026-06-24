import { deleteSecureItem, getSecureItem, setSecureItem } from '../secure-storage';

// Stored in the keychain/keystore (via secure-storage) so the lockout cannot be
// trivially reset by clearing AsyncStorage / app data.
const STORAGE_KEY = 'reviewnatin:login_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function isDevBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

type LockoutState = {
  attempts: number;
  lockedUntil: number | null;
};

async function readState(): Promise<LockoutState> {
  try {
    const raw = await getSecureItem(STORAGE_KEY);
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
  if (state.attempts === 0 && state.lockedUntil === null) {
    await deleteSecureItem(STORAGE_KEY);
    return;
  }
  await setSecureItem(STORAGE_KEY, JSON.stringify(state));
}

export async function getLoginLockoutMessage(): Promise<string | null> {
  if (isDevBuild()) return null;
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
  if (isDevBuild()) return null;
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
