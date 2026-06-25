import { describe, expect, it } from 'vitest';
import { base64ToUint8Array } from './base64';

function toBase64Node(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

describe('base64ToUint8Array', () => {
  it('decodes a simple ASCII string ("Man" -> base64 "TWFu")', () => {
    expect(Array.from(base64ToUint8Array('TWFu'))).toEqual([77, 97, 110]);
  });

  it('decodes with single "=" padding', () => {
    // "Ma" -> base64 "TWE="
    expect(Array.from(base64ToUint8Array('TWE='))).toEqual([77, 97]);
  });

  it('decodes with double "=" padding', () => {
    // "M" -> base64 "TQ=="
    expect(Array.from(base64ToUint8Array('TQ=='))).toEqual([77]);
  });

  it('decodes binary byte values across the full 0-255 range', () => {
    const bytes = Array.from({ length: 256 }, (_, i) => i);
    const encoded = toBase64Node(bytes);
    expect(Array.from(base64ToUint8Array(encoded))).toEqual(bytes);
  });

  it('ignores embedded whitespace/newlines (defensive against wrapped base64)', () => {
    expect(Array.from(base64ToUint8Array('TW\nFu'))).toEqual([77, 97, 110]);
  });

  it('returns an empty array for an empty string', () => {
    expect(base64ToUint8Array('').length).toBe(0);
  });

  it('round-trips a realistic JPEG-header-like byte sequence', () => {
    const bytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
    const encoded = toBase64Node(bytes);
    expect(Array.from(base64ToUint8Array(encoded))).toEqual(bytes);
  });
});
