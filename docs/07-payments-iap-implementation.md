# Payments (IAP)

Real monetization uses **react-native-iap** + **Supabase Edge Function** (`iap-verify`) — not client-side entitlements.

## Flow

1. App completes purchase via App Store / Google Play
2. App calls `supabase.functions.invoke('iap-verify', { body })` with receipt
3. Edge function validates with Apple / Google
4. `fulfill_iap_purchase()` writes `payment_transactions` + `user_entitlements` (service_role only)
5. App refreshes entitlements context

## Edge function secrets

Set in Supabase Dashboard → Edge Functions → Secrets (or `supabase secrets set`):

| Secret | Purpose |
|--------|---------|
| `APPLE_IAP_SHARED_SECRET` | App Store Connect → app-specific shared secret |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Play Console service account (full JSON) |
| `ANDROID_PACKAGE` | `ph.reviewnatin.app` (optional, default set) |

Deploy:

```bash
supabase functions deploy iap-verify
```

## Server-side paywall (RPCs)

| RPC | Free tier enforcement |
|-----|----------------------|
| `get_practice_questions` | 20 questions/day (Manila timezone) |
| `get_mock_exam_questions` | Full mocks → 10Q preview; mini-mock → 1/week |
| `get_mistake_bank` | 7-day history (ignores client `p_days_back` when not premium) |
| `get_usage_limits` | Client UX hints only — not authoritative |

## Dev demo entitlements

Production blocks `grant_demo_entitlement` unless DB GUC is set:

```bash
npm run db:enable-demo-iap   # local/dev database only
```

Subscribe screen shows dev controls only when `__DEV__` is true.

## SKUs

Canonical SKUs live in `subscription_products.sku` (see `supabase/sql/catalog_seed.sql`). Google Play product IDs are mapped to these in `supabase/functions/iap-verify/index.ts`.
