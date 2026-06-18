import { describe, expect, it } from 'vitest';
import { asNumber, firstRow, rowList } from './result';

describe('rowList', () => {
  it('returns the array as-is', () => {
    const rows = [{ a: 1 }, { a: 2 }];
    expect(rowList<{ a: number }>(rows)).toBe(rows);
  });

  it('maps null/undefined to an empty array', () => {
    expect(rowList(null)).toEqual([]);
    expect(rowList(undefined)).toEqual([]);
  });
});

describe('firstRow', () => {
  it('returns the first element', () => {
    expect(firstRow<{ x: number }>([{ x: 7 }, { x: 8 }])).toEqual({ x: 7 });
  });

  it('returns undefined for null / empty', () => {
    expect(firstRow(null)).toBeUndefined();
    expect(firstRow([])).toBeUndefined();
  });
});

describe('asNumber', () => {
  it('returns numeric results unchanged (including 0)', () => {
    expect(asNumber(42, 3)).toBe(42);
    expect(asNumber(0, 3)).toBe(0);
  });

  it('returns the fallback for non-numbers', () => {
    expect(asNumber(null, 3)).toBe(3);
    expect(asNumber(undefined, 0)).toBe(0);
    expect(asNumber('5', 9)).toBe(9);
  });
});
