import { useEffect, useRef, useState } from 'react';
import { DIAGNOSTIC_SOFT_SECONDS } from './constants';

export type UseQuizTimerFlags = {
  isMock: boolean;
  isTimed: boolean;
  isBoard: boolean;
  isDiagnostic: boolean;
};

/** Ticks `elapsed` every second and counts `timeLeft` down for timer-bound modes. */
export function useQuizTimer(
  { isMock, isTimed, isBoard, isDiagnostic }: UseQuizTimerFlags,
  setTimeLeft: (updater: (t: number) => number) => void
) {
  const startedAt = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [softTimerWarn, setSoftTimerWarn] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(sec);
      if (isMock || isTimed || isBoard) {
        setTimeLeft((t) => Math.max(0, t - 1));
      }
      if (isDiagnostic && sec >= DIAGNOSTIC_SOFT_SECONDS) {
        setSoftTimerWarn(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isMock, isTimed, isBoard, isDiagnostic, setTimeLeft]);

  return { startedAt, elapsed, softTimerWarn };
}
