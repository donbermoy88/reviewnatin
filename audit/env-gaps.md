# Environment Variable Gaps
**Date:** 2026-05-29

## Files inspected

- `apps/mobile/.env` — populated with real Supabase + Google OAuth credentials.
- `apps/mobile/.env.example` — placeholder values present for all consumed keys.
- `apps/admin/.env.local` — populated with real Supabase URL, anon key, AND `SUPABASE_SERVICE_ROLE_KEY` (server-only, correctly NOT prefixed with `NEXT_PUBLIC_`).
- `apps/admin/.env.example` — placeholders for the same set.
- `apps/marketing/.env.local` — populated with Supabase URL, anon key, site URL.
- `apps/marketing/.env.example` — placeholders for the same set.
- Root `.env.example` — placeholders for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL`.

## Findings

- No `.env` or `.env.local` files have been committed to git history (`git log --all --full-history -- "**/.env"` returns nothing).
- Service-role key is only in `apps/admin/.env.local`. Verified via `grep -r service_role apps/` (no matches outside `.env.local` / `.env.example`).
- AdMob unit IDs are missing from the populated mobile `.env`. They are listed in `.env.example` but commented as "requires EAS / dev client rebuild". Acceptable for current dev cycle; needs real IDs before production publish.
- Google Sign-In Web/iOS client IDs are populated; no gap.
- `APPLE_IAP_SHARED_SECRET` and `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` are required by the `iap-verify` Edge Function (server-side). These should be set via `supabase secrets set` before enabling production IAP. Not gated client-side.

## Recommended actions

1. Populate the AdMob `EXPO_PUBLIC_ADMOB_*` values before the App Store / Play submission.
2. Provision `APPLE_IAP_SHARED_SECRET`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, and `ANDROID_PACKAGE` as Supabase function secrets.
3. Rotate the Supabase service-role key after any contractor offboarding.
4. Add `EXPO_PUBLIC_SENTRY_DSN` placeholder to `.env.example` if Sentry stays in the build.
