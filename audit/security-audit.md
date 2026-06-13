# ReviewNatin Security Audit
**Date:** 2026-05-29
**Scope:** Mobile, admin, marketing, Supabase backend

---

## RLS coverage

- 42 tables defined across migrations
- 42 tables have `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- 51 policies defined across all migrations
- Coverage: 100% of public tables have RLS enabled

Tables verified (sample):
- `users`, `user_exam_goals`, `user_preferences`, `user_push_tokens`
- `quiz_sessions`, `quiz_answers`, `mistake_logs`, `bookmarks`
- `flashcards`, `flashcard_reviews`, `topic_mastery`
- `user_entitlements`, `payment_transactions`, `web_checkout_sessions`
- `barkada_groups`, `barkada_members`, `barkada_challenges`, `barkada_challenge_results`
- Reference data (`exam_types`, `topics`, `questions`, etc.) RLS-enabled with public-read policies

No tables missing RLS. No further policy migrations needed for Phase 15.

## Service-role key exposure

`grep -rn "service_role" apps/` returns NO hits in any client bundle (mobile, admin client, marketing).
The service role key only appears in:
- `apps/admin/.env.local` (server-only, gitignored)
- `apps/admin/.env.example` (placeholder)

`SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`, so Next.js will refuse to ship it to the browser. Verified.

## Third-party API keys

- `grep -rn "sk-ant\|ANTHROPIC" apps/mobile/` returns NO hits. Anthropic usage is server-side only for optional per-question explanations.
- No OpenAI key embedded in client.
- AdMob unit IDs are public IDs (intended for client embedding). Not secrets.

## Supabase Auth config (supabase/config.toml)

- `jwt_expiry = 3600` (1 hour — recommended)
- `enable_refresh_token_rotation = true` — refresh tokens rotate on every use
- `refresh_token_reuse_interval = 10` — short reuse window
- `enable_signup = true` (email auth) — required for the app
- `enable_confirmations = false` for email — recommend turning ON for production to verify ownership and reduce signup spam. (See Action Items.)
- Anonymous sign-ups disabled (`enable_signup = false` under the `[auth.external.anonymous]` block).

## Client-side secrets

Verified `EXPO_PUBLIC_*` vars in `apps/mobile/.env`:
- `EXPO_PUBLIC_SUPABASE_URL` — public endpoint, safe to embed
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — anon JWT (role: anon), safe to embed; row-level access is enforced by RLS
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` — public client IDs (OAuth pattern), safe to embed
- `EXPO_PUBLIC_ADMOB_*` — public ad unit IDs, safe to embed

NO sensitive keys with `EXPO_PUBLIC_` prefix detected.

`apps/admin/.env.local`:
- `NEXT_PUBLIC_*` keys are anon, safe
- `SUPABASE_SERVICE_ROLE_KEY` is NOT publicly prefixed and is only used in server components / Route Handlers.

`apps/marketing/.env.local`:
- Only anon Supabase key and public site URL. Safe.

## Headers and middleware

- `apps/admin/middleware.ts` exists at the correct location for Next.js 16 (it is `middleware.ts`, not the deprecated `proxy.ts`). No rename needed.
- HTTP security headers added to `apps/admin/next.config.ts` and `apps/marketing/next.config.ts` in Phase 17 of this audit.

## Edge functions

- `iap-verify` validates Apple/Google receipts server-side — receipt data never leaves trusted environments.
- Optional AI explanations keep the Anthropic key server-side.
- `web-checkout-submit` and `readiness-cron` use service role server-side.

Rate limiting (Phase 18) was added to `iap-verify` and a `rate_limit_checks` table was introduced in `20260529000002_rate_limiting.sql` to support it.

## Action items / follow-ups (not in scope of this audit pass)

- Turn ON `enable_confirmations` for email auth before production launch.
- Consider adding CAPTCHA on signup (Supabase supports hCaptcha) to deter bots.
- Add periodic rotation reminder for the service role key (Supabase dashboard).
- Add Sentry or a similar error reporter so failures in edge functions surface to engineers.
