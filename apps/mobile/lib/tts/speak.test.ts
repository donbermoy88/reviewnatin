import { describe, expect, it } from 'vitest';
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
