import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeyPrefix } from '../storage-keys';

const CACHE_PREFIX = StorageKeyPrefix.cache;
const DEFAULT_STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEntry<T> = {
  savedAt: string;
  expiresAt: string;
  value: T;
};

type CachedJsonOptions = {
  ttlMs: number;
  staleTtlMs?: number;
};

function cacheKey(key: string): string {
  return `${CACHE_PREFIX}${key}`;
}

async function readEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(key));
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

async function writeEntry<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const now = Date.now();
  const entry: CacheEntry<T> = {
    savedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    value,
  };
  await AsyncStorage.setItem(cacheKey(key), JSON.stringify(entry));
}

function isFresh<T>(entry: CacheEntry<T>, now = Date.now()): boolean {
  return new Date(entry.expiresAt).getTime() > now;
}

function isUsableStale<T>(entry: CacheEntry<T>, staleTtlMs: number, now = Date.now()): boolean {
  return new Date(entry.savedAt).getTime() + staleTtlMs > now;
}

export async function cachedJson<T>(
  key: string,
  loader: () => Promise<T>,
  options: CachedJsonOptions
): Promise<T> {
  const staleTtlMs = options.staleTtlMs ?? DEFAULT_STALE_TTL_MS;
  const cached = await readEntry<T>(key);

  if (cached && isFresh(cached)) {
    return cached.value;
  }

  try {
    const value = await loader();
    await writeEntry(key, value, options.ttlMs);
    return value;
  } catch (error) {
    if (cached && isUsableStale(cached, staleTtlMs)) {
      return cached.value;
    }
    throw error;
  }
}

export async function clearJsonCache(prefix?: string): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const targetPrefix = prefix ? cacheKey(prefix) : CACHE_PREFIX;
  const matching = keys.filter((key) => key.startsWith(targetPrefix));
  if (matching.length) await AsyncStorage.multiRemove(matching);
}
