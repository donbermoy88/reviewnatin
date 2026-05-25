import { describe, expect, it } from 'vitest';
import { evaluateContentGate } from '@reviewnatin/shared';

describe('evaluateContentGate', () => {
  it('passes when counts meet minimums', () => {
    const status = evaluateContentGate('cse-professional', {
      questions: 1500,
      mockExams: 3,
    });
    expect(status?.meetsMinimum).toBe(true);
  });

  it('fails when question bank is below threshold', () => {
    const status = evaluateContentGate('pnle', {
      questions: 100,
      mockExams: 2,
    });
    expect(status?.meetsMinimum).toBe(false);
    expect(status?.questionPct).toBe(4);
  });
});
