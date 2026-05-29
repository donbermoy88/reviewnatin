# Privacy and Legal Compliance Review
**Date:** 2026-05-29

## Account deletion

- Mobile entry point: Settings → Delete account. Confirmed via `AppSheet` modal (destructive style).
- Backend: `public.delete_user_account()` RPC defined in `20260524140000_p2_app_store.sql`. Function is `SECURITY DEFINER`, scoped to the calling user, and revokes PUBLIC + grants `authenticated`. It cascades deletes across user-owned tables (entitlements, quiz sessions, bookmarks, etc.) and finally removes the auth user.
- Client wraps the RPC in `apps/mobile/lib/auth/delete-account.ts` and clears local onboarding + guest history before signing out.
- Apple App Store §5.1.1(v) requirement satisfied: the user can delete their account from inside the app, with no email/web detour.

## Privacy policy & Terms

- Marketing site exposes `/privacy` and `/terms` pages (`apps/marketing/app/privacy` and `/terms`).
- Mobile `apps/mobile/app/legal/index.tsx` deep-links to both via `LEGAL.privacyUrl` and `LEGAL.termsUrl` constants from `@reviewnatin/shared`.
- Subscribe screen and settings both surface the legal disclaimers from `DISCLAIMERS`.

## Data minimization in client

- `EXPO_PUBLIC_*` only contains the Supabase URL, anon key, OAuth client IDs, and AdMob IDs — none of which are personal data.
- No PII or device identifiers are logged client-side outside of Supabase auth and analytics events that are gated behind RLS.

## Recommendations (out of scope for this pass)

- Add an in-app "Export my data" button that calls a server-side function to bundle the user's data as JSON. Helpful for GDPR-style requests even if PH residency is the primary base.
- Add a periodic reminder in the admin dashboard to review the data-retention policy for `mistake_logs` and `quiz_answers` (these grow without bound).
- Consider scrubbing IP addresses from `payment_transactions.raw_receipt` after fulfillment.
