import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { saveExamSnapshot } from '../exam-resume';
import type { Question } from '../types';

export type UseExamAutosaveParams = {
  resumeKey: string | null;
  questions: Question[];
  answersByIndex: Record<number, string>;
  flaggedIndices: Set<number>;
  index: number;
  timeLeft: number;
  loading: boolean;
};

/** Persists strict-exam progress (answer-sheet, flags, position, timer) for resume. */
export function useExamAutosave({
  resumeKey,
  questions,
  answersByIndex,
  flaggedIndices,
  index,
  timeLeft,
  loading,
}: UseExamAutosaveParams) {
  // Latest exam state in a ref so background/unmount saves capture the current
  // values without re-subscribing every render.
  const examStateRef = useRef({ questions, answersByIndex, flaggedIndices, index, timeLeft });
  useEffect(() => {
    examStateRef.current = { questions, answersByIndex, flaggedIndices, index, timeLeft };
  });

  const saveExamProgress = useCallback(() => {
    if (!resumeKey) return;
    const s = examStateRef.current;
    if (!s.questions.length) return;
    void saveExamSnapshot(resumeKey, {
      questionOrder: s.questions.map((q) => q.id),
      answers: s.answersByIndex,
      flagged: [...s.flaggedIndices],
      index: s.index,
      timeLeft: s.timeLeft,
      savedAt: Date.now(),
    });
  }, [resumeKey]);

  // Persist progress on every answer/flag/navigation change.
  useEffect(() => {
    if (!resumeKey || loading || !questions.length) return;
    saveExamProgress();
  }, [answersByIndex, flaggedIndices, index, resumeKey, loading, questions.length, saveExamProgress]);

  // Capture the latest state (incl. remaining time) when the app is backgrounded.
  useEffect(() => {
    if (!resumeKey) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'inactive' || state === 'background') saveExamProgress();
    });
    return () => sub.remove();
  }, [resumeKey, saveExamProgress]);
}
