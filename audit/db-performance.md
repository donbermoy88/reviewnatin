# ReviewNatin Database Performance — Index Plan
**Date:** 2026-05-29
**Migration:** `supabase/migrations/20260529000000_performance_indexes.sql`

## Why

Read-heavy paths (Mistake Bank, Progress, Bookmarks, Leaderboard, Subscribe gate)
were issuing `(user_id, created_at DESC)` or `(user_id, exam_type_id)` predicates
against tables that lacked composite covering indexes. The migration above adds
`IF NOT EXISTS` indexes to back those paths.

## Indexes added (and why)

| Index | Table | Predicate | Why |
|---|---|---|---|
| `idx_quiz_answers_session` | `quiz_answers` | `session_id` | Mock review screen, quiz history detail |
| `idx_quiz_answers_question` | `quiz_answers` | `question_id` | Reverse-lookup attempts per question |
| `idx_quiz_answers_user_correct` | `quiz_answers` | `(user_id, is_correct)` partial | Per-user accuracy stats |
| `idx_quiz_sessions_user_completed_at` | `quiz_sessions` | `(user_id, completed_at DESC)` | Progress quiz history list |
| `idx_quiz_sessions_user_mode` | `quiz_sessions` | `(user_id, mode, completed_at DESC)` | Mode-filtered history (mocks vs practice) |
| `idx_bookmarks_user_created` | `bookmarks` | `(user_id, created_at DESC)` | Bookmarks screen |
| `idx_bookmarks_user_question` | `bookmarks` | `(user_id, question_id)` | Toggle bookmark on a known question |
| `idx_mistake_logs_user_last_wrong` | `mistake_logs` | `(user_id, last_wrong_at DESC)` | Mistake Bank list |
| `idx_mistake_logs_user_question` | `mistake_logs` | `(user_id, question_id)` | Upsert mistake log on wrong answer |
| `idx_flashcard_reviews_user` | `flashcard_reviews` | `(user_id, next_review_at)` | Due-cards lookup |
| `idx_topic_mastery_user` | `topic_mastery` | `(user_id)` | Analytics joins |
| `idx_user_entitlements_user` | `user_entitlements` | `(user_id, status)` | Paywall gate check on every screen |
| `idx_user_entitlements_user_expires` | `user_entitlements` | `(user_id, expires_at)` | Active-subscription resolver |
| `idx_payment_transactions_user_created` | `payment_transactions` | `(user_id, created_at DESC)` | Receipt audit, admin reconciliation |
| `idx_payment_transactions_provider_tx` | `payment_transactions` | `(provider, transaction_id)` | Idempotency check in iap-verify |
| `idx_exam_schedules_exam_event_date` | `exam_schedules` | `(exam_type_id, event_date)` | Exam calendar screen |
| `idx_user_exam_goals_user` | `user_exam_goals` | `(user_id)` | Single-row goal resolver — called many times |
| `idx_barkada_members_group` | `barkada_members` | `(group_id)` | Group roster |
| `idx_barkada_challenge_results_user` | `barkada_challenge_results` | `(user_id, completed_at DESC)` | "My challenges" history |
| `idx_user_push_tokens_user` | `user_push_tokens` | `(user_id)` | Notification dispatch |
| `idx_mock_exam_questions_mock_seq` | `mock_exam_questions` | `(mock_exam_id, sequence)` | Mock exam Q order |
| `idx_ai_explanation_usage_user_created` | `ai_explanation_usage` | `(user_id, created_at DESC)` | Per-user-per-hour rate limit |
| `idx_readiness_snapshots_user_created` | `readiness_snapshots` | `(user_id, created_at DESC)` | Most-recent score lookup |
| `idx_diagnostic_sessions_user_exam` | `diagnostic_sessions` | `(user_id, exam_type_id)` | Has-completed-diagnostic check |
| `idx_reported_questions_open_created` | `reported_questions` | `(created_at DESC)` partial | Admin "open reports" queue |

## Operational notes

- All indexes use `IF NOT EXISTS` and are safe to re-run.
- Run `ANALYZE` after deploying so the planner picks them up immediately.
- Storage cost is small (most indexes are on identifier columns with `DESC NULLS LAST`).
- Watch the `pg_stat_user_indexes.idx_scan` counter for the first week; if an index gets zero scans, consider dropping it. (Highly unlikely for the ones listed above — every column appears in current code paths.)
