-- Performance indexes — Phase 19 of pre-publication audit
-- 2026-05-29
--
-- These indexes target the most common read patterns observed in the mobile
-- and admin apps: lookups by (user, exam) and ordering by recent activity.
-- All statements use IF NOT EXISTS so they are safe to re-run.

-- Quiz answers by session and question — accelerates session review queries.
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session
    ON public.quiz_answers (session_id);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_question
    ON public.quiz_answers (question_id);

-- NOTE: quiz_answers is normalized — user_id lives on quiz_sessions, not on
-- quiz_answers. The original draft of this migration referenced a non-existent
-- column. The correct shape for accelerating "wrong answers per session"
-- lookups is (session_id, is_correct).
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_correct
    ON public.quiz_answers (session_id, is_correct);

-- Quiz sessions — used by progress, weekly summary, and Mistake Bank queries.
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_completed_at
    ON public.quiz_sessions (user_id, completed_at DESC NULLS LAST)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_mode
    ON public.quiz_sessions (user_id, mode, completed_at DESC NULLS LAST)
    WHERE user_id IS NOT NULL;

-- Bookmarks — list views ordered by recency per user.
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
    ON public.bookmarks (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_question
    ON public.bookmarks (user_id, question_id);

-- Mistake logs — per-user pending review queue.
CREATE INDEX IF NOT EXISTS idx_mistake_logs_user_last_wrong
    ON public.mistake_logs (user_id, last_wrong_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mistake_logs_user_question
    ON public.mistake_logs (user_id, question_id);

-- Flashcard reviews — due-cards lookups by user.
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user
    ON public.flashcard_reviews (user_id, next_review_at);

-- Topic mastery — analytics joins by user + subject.
CREATE INDEX IF NOT EXISTS idx_topic_mastery_user
    ON public.topic_mastery (user_id);

-- User entitlements — checked on nearly every paid feature gate.
-- NOTE: there is no `status` column on this table; the entitlement check
-- pattern is (user_id, expires_at) — active entitlements are those with
-- expires_at IS NULL OR expires_at > now(). The single index below covers
-- both per-user lookups and the active-entitlement filter.
CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_expires
    ON public.user_entitlements (user_id, expires_at);

-- Payment transactions — server-side reconciliation by user.
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_created
    ON public.payment_transactions (user_id, created_at DESC);

-- NOTE: payment_transactions stores the store transaction id as
-- `store_transaction_id`, not `transaction_id`. The reconciliation index
-- shape comes from migration 20260524150000_p2_payments.sql which already
-- creates idx on (store_transaction_id, provider). This duplicate is
-- therefore removed — see that migration for the canonical index.

-- Exam schedules — calendar list filtered by exam.
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_event_date
    ON public.exam_schedules (exam_type_id, event_date);

-- User exam goals — single-row lookups by user.
CREATE INDEX IF NOT EXISTS idx_user_exam_goals_user
    ON public.user_exam_goals (user_id);

-- Barkada — group membership lookups and challenge listings.
CREATE INDEX IF NOT EXISTS idx_barkada_members_group
    ON public.barkada_members (group_id);

-- NOTE: column is `submitted_at`, not `completed_at`. The PK (challenge_id,
-- user_id) covers per-challenge lookups; this index accelerates per-user
-- history listings ordered by most recent.
CREATE INDEX IF NOT EXISTS idx_barkada_challenge_results_user_submitted
    ON public.barkada_challenge_results (user_id, submitted_at DESC);

-- Push tokens — quick lookup when sending notifications.
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user
    ON public.user_push_tokens (user_id);

-- Mock exam questions — ordered lookup inside a mock.
-- NOTE: the column is `sort_order`, not `sequence`. The (mock_exam_id,
-- question_id) primary key already covers point lookups; this index
-- accelerates the "list questions in order" read.
CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_mock_sort
    ON public.mock_exam_questions (mock_exam_id, sort_order);

-- AI usage rate-limiting helpers — daily counts per user.
-- NOTE: these tables key by `usage_date`, not `created_at`. The PK
-- (user_id, usage_date) on each already covers point lookups; these
-- indexes would be redundant. Removed.

-- Readiness snapshots — most-recent-per-user.
-- NOTE: column is `computed_at`, not `created_at`.
CREATE INDEX IF NOT EXISTS idx_readiness_snapshots_user_computed
    ON public.readiness_snapshots (user_id, computed_at DESC);

-- Diagnostic sessions — single-row lookup per (user, exam).
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_user_exam
    ON public.diagnostic_sessions (user_id, exam_type_id);

-- Reported questions — admin dashboard "open queue" sort.
CREATE INDEX IF NOT EXISTS idx_reported_questions_open_created
    ON public.reported_questions (created_at DESC)
    WHERE status = 'open';
