import { describe, expect, it } from 'vitest';
import { deriveQuizMode } from './mode';
import { BOARD_DURATION_SECONDS } from './constants';

describe('deriveQuizMode', () => {
  it('defaults to practice mode with no strict-exam flags', () => {
    const m = deriveQuizMode({ examSlug: 'nle' });
    expect(m.slug).toBe('nle');
    expect(m.isStrictExam).toBe(false);
    expect(m.resumeKey).toBeNull();
    expect(m.initialTimeLeft).toBe(0);
  });

  it('falls back to the shared default exam slug when none is given', () => {
    const m = deriveQuizMode({});
    expect(m.slug).toBeTruthy();
  });

  it('derives mock as a strict exam with a resume key keyed by mockExamId', () => {
    const m = deriveQuizMode({ examSlug: 'nle', mode: 'mock', mockExamId: 'abc', durationSeconds: '1800' });
    expect(m.isMock).toBe(true);
    expect(m.isStrictExam).toBe(true);
    expect(m.resumeKey).toContain('abc');
    expect(m.initialTimeLeft).toBe(1800);
  });

  it('derives board as a strict exam with the fixed board duration', () => {
    const m = deriveQuizMode({ examSlug: 'nle', mode: 'board' });
    expect(m.isBoard).toBe(true);
    expect(m.isStrictExam).toBe(true);
    expect(m.resumeKey).toContain('board');
    expect(m.initialTimeLeft).toBe(BOARD_DURATION_SECONDS);
  });

  it('clamps barkadaLimit to a minimum of 5', () => {
    expect(deriveQuizMode({ mode: 'barkada', questionLimit: '2' }).barkadaLimit).toBe(5);
    expect(deriveQuizMode({ mode: 'barkada', questionLimit: '20' }).barkadaLimit).toBe(20);
    expect(deriveQuizMode({ mode: 'barkada' }).barkadaLimit).toBe(10);
  });

  it('only accepts a positive, finite previewLimit', () => {
    expect(deriveQuizMode({ previewLimit: '15.7' }).previewItemLimit).toBe(15);
    expect(deriveQuizMode({ previewLimit: '0' }).previewItemLimit).toBeNull();
    expect(deriveQuizMode({ previewLimit: 'nope' }).previewItemLimit).toBeNull();
    expect(deriveQuizMode({}).previewItemLimit).toBeNull();
  });

  it('defaults timed duration to 600s when durationSeconds is missing/invalid', () => {
    expect(deriveQuizMode({ mode: 'timed' }).timedDuration).toBe(600);
    expect(deriveQuizMode({ mode: 'timed', durationSeconds: '900' }).timedDuration).toBe(900);
  });
});
