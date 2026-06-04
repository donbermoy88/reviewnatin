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
    // pnle minimum is 200 questions → 100/200 = 50%.
    // (Was 4 when the minimum was 2,500; updated when the minimum dropped.)
    expect(status?.questionPct).toBe(50);
  });
});
