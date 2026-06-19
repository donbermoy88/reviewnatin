import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AppSheet } from '../components/app-sheet';

type Feedback = {
  title: string;
  subtitle?: string;
  actions?: { label: string; onPress: () => void; variant?: 'primary' | 'outline' | 'ghost' }[];
};

type IapFeedbackContextValue = {
  showFeedback: (feedback: Feedback) => void;
  clearFeedback: () => void;
};

const IapFeedbackContext = createContext<IapFeedbackContextValue | null>(null);

export function IapFeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const showFeedback = useCallback((next: Feedback) => setFeedback(next), []);
  const clearFeedback = useCallback(() => setFeedback(null), []);

  const value = useMemo(() => ({ showFeedback, clearFeedback }), [showFeedback, clearFeedback]);

  return (
    <IapFeedbackContext.Provider value={value}>
      {children}
      <AppSheet
        visible={!!feedback}
        title={feedback?.title ?? ''}
        subtitle={feedback?.subtitle}
        onClose={clearFeedback}
        actions={
          feedback?.actions ?? [{ label: 'OK', onPress: clearFeedback, variant: 'outline' }]
        }
      />
    </IapFeedbackContext.Provider>
  );
}

export function useIapFeedback() {
  const ctx = useContext(IapFeedbackContext);
  if (!ctx) throw new Error('useIapFeedback must be used within IapFeedbackProvider');
  return ctx;
}

/** Safe hook for IapProvider when feedback provider wraps it */
export function useIapFeedbackOptional() {
  return useContext(IapFeedbackContext);
}
