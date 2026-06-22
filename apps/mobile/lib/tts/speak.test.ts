import { describe, expect, it } from 'vitest';
import { resolveSpeechChunkLimit, splitSpeechText } from './chunks';
import { sanitizeSpeechText } from './sanitize';

describe('sanitizeSpeechText', () => {
  it('removes markdown markers before sending text to TTS', () => {
    expect(
      sanitizeSpeechText('**Key point**\n\n- Read `carefully`\n1. Eliminate *wrong* choices')
    ).toBe('Key point Read carefully Eliminate wrong choices');
  });

  it('removes markdown table syntax', () => {
    expect(
      sanitizeSpeechText('| Type | Rule |\n| --- | --- |\n| Detail | Exact sentence |')
    ).toBe('Type Rule Detail Exact sentence');
  });
});

describe('splitSpeechText', () => {
  it('keeps chunks within the native TTS limit', () => {
    const chunks = splitSpeechText('One sentence. Two sentence. Three sentence.', 18);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 18)).toBe(true);
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe('One sentence. Two sentence. Three sentence.');
  });

  it('reserves headroom for finite native speech limits', () => {
    expect(resolveSpeechChunkLimit(4000)).toBe(3600);
    expect(resolveSpeechChunkLimit(Number.MAX_VALUE)).toBe(3500);
  });
});
