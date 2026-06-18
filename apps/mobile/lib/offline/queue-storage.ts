/**
 * AsyncStorage-backed JSON queue helper.
 *
 * The offline answer queue and content-report queue each kept their own
 * copy of read/write/clear against AsyncStorage, with the same defensive
 * JSON.parse guard and the same "keep only the last N items" cap. This
 * factory removes that duplication while keeping each queue's key and cap
 * explicit at the call site.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type QueueStorage<T> = {
  read(): Promise<T[]>;
  write(items: T[]): Promise<void>;
  clear(): Promise<void>;
};

export function createQueueStorage<T>(key: string, maxItems: number): QueueStorage<T> {
  return {
    async read(): Promise<T[]> {
      try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T[]) : [];
      } catch {
        return [];
      }
    },
    async write(items: T[]): Promise<void> {
      // Cap the persisted queue so a long offline streak can't grow unbounded.
      await AsyncStorage.setItem(key, JSON.stringify(items.slice(-maxItems)));
    },
    async clear(): Promise<void> {
      await AsyncStorage.removeItem(key);
    },
  };
}
