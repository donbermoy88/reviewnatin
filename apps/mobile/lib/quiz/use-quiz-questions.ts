import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import type { ImperativeRouter } from 'expo-router';
import {
  isEligibleForOfflineFallback,
  loadOfflineFallback,
  loadQuizAttempt,
  loadQuizUserExtras,
} from './load-questions';
import type { QuizMode } from './mode';
import type { Question } from '../types';

export type UseQuizQuestionsParams = {
  topicSlug?: string;
  mockExamId?: string;
  durationSeconds?: string;
  focusQuestionId?: string;
};

/**
 * Owns the per-mode question fetch (the 9-way branch in loadQuizAttempt) and the
 * interactive state that the loaded attempt seeds: the question set, the strict-exam
 * answer-sheet/flags/position/selection, and the loading/paywall/offline outcomes.
 */
export function useQuizQuestions(
  modeFlags: QuizMode,
  params: UseQuizQuestionsParams,
  user: { id: string } | null,
  isPremium: (examTypeId?: string | null) => boolean,
  router: ImperativeRouter
) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'daily' | 'board'>('daily');
  const [offlineMode, setOfflineMode] = useState(modeFlags.isOffline);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [hintCredits, setHintCredits] = useState(3);
  const [mockTitle, setMockTitle] = useState('Mock Exam');
  const [mockPreviewActive, setMockPreviewActive] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [answersByIndex, setAnswersByIndex] = useState<Record<number, string>>({});
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(modeFlags.initialTimeLeft);

  const { topicSlug, mockExamId, durationSeconds, focusQuestionId } = params;
  const { slug, isMock, isBoard, isOffline, isMistakeReview, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, barkadaLimit, previewItemLimit, resumeKey } = modeFlags;

  useEffect(() => {
    (async () => {
      try {
        const result = await loadQuizAttempt({ modeFlags, topicSlug, mockExamId, durationSeconds, focusQuestionId, user, isPremium });

        switch (result.kind) {
          case 'needs_login':
            router.replace('/(auth)/login');
            return;
          case 'paywall':
            setPaywallReason(result.reason);
            setPaywallBlocked(true);
            return;
          case 'mini_mock_limit':
            setPaywallBlocked(true);
            return;
          case 'no_offline_pack':
            Alert.alert('Walang offline pack', 'I-download muna ang offline pack sa Settings.');
            router.back();
            return;
          case 'ready':
            setQuestions(result.questions);
            setOfflineMode(result.offlineMode);
            if (result.mockTitle !== undefined) setMockTitle(result.mockTitle);
            setMockPreviewActive(result.mockPreviewActive);
            if (result.timeLeft != null) setTimeLeft(result.timeLeft);
            if (result.strict) {
              setAnswersByIndex(result.strict.answersByIndex);
              setFlaggedIndices(new Set(result.strict.flagged));
              setIndex(result.strict.index);
              setSelected(result.strict.selected);
              setResumed(result.strict.resumed);
            }
            break;
        }

        if (user) {
          const extras = await loadQuizUserExtras(user.id);
          setBookmarkedIds(extras.bookmarkedIds);
          setHintCredits(extras.hintCredits);
        }
      } catch {
        if (isEligibleForOfflineFallback(modeFlags)) {
          const offlineQs = await loadOfflineFallback(slug, topicSlug);
          if (offlineQs) {
            setOfflineMode(true);
            setQuestions(offlineQs);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // `modeFlags` is a freshly derived object every render — depend on its primitive
    // fields instead so this only refetches when the actual mode params change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, topicSlug, isMock, isBoard, isOffline, isMistakeReview, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, barkadaLimit, mockExamId, durationSeconds, previewItemLimit, focusQuestionId, resumeKey, user, isPremium, router]);

  return {
    loading,
    questions,
    paywallBlocked,
    paywallReason,
    offlineMode,
    bookmarkedIds,
    setBookmarkedIds,
    hintCredits,
    setHintCredits,
    mockTitle,
    mockPreviewActive,
    resumed,
    answersByIndex,
    setAnswersByIndex,
    flaggedIndices,
    setFlaggedIndices,
    index,
    setIndex,
    selected,
    setSelected,
    timeLeft,
    setTimeLeft,
  };
}
