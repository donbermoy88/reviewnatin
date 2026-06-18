import { afterEach, describe, expect, it, vi } from 'vitest';
import { dedupeAsync, inFlightCount, resetInFlight } from './dedupe';

afterEach(() => resetInFlight());

/** A promise plus its resolve/reject, so tests control settle timing. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('dedupeAsync', () => {
  it('runs the loader once for concurrent calls with the same key', async () => {
    const d = deferred<number>();
    const loader = vi.fn(() => d.promise);

    const a = dedupeAsync('k', loader);
    const b = dedupeAsync('k', loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(inFlightCount()).toBe(1);

    d.resolve(42);
    await expect(a).resolves.toBe(42);
    await expect(b).resolves.toBe(42);
  });

  it('does not coalesce different keys', () => {
    const loader = vi.fn(() => Promise.resolve(1));
    dedupeAsync('a', loader);
    dedupeAsync('b', loader);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(inFlightCount()).toBe(2);
  });

  it('re-runs the loader for a call made after the first settles', async () => {
    const loader = vi.fn(() => Promise.resolve('v'));

    await dedupeAsync('k', loader);
    expect(inFlightCount()).toBe(0); // cleared after settle

    await dedupeAsync('k', loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('propagates rejection to every sharer and clears the entry', async () => {
    const d = deferred<number>();
    const loader = vi.fn(() => d.promise);

    const a = dedupeAsync('k', loader);
    const b = dedupeAsync('k', loader);

    d.reject(new Error('boom'));
    await expect(a).rejects.toThrow('boom');
    await expect(b).rejects.toThrow('boom');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(inFlightCount()).toBe(0);
  });
});
