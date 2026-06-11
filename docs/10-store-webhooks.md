# Store Webhook Lifecycle

ReviewNatin uses two purchase paths:

- `iap-verify`: app-initiated purchase/restore verification.
- `store-webhook`: server-to-server lifecycle updates from Apple and Google.

The webhook path keeps Supabase entitlements correct when a user renews, cancels, enters billing retry/grace, expires, or gets refunded outside the app.

## Supabase Function

Function:

```text
store-webhook
```

JWT verification is disabled in `supabase/config.toml` because Apple and Google do not send a Supabase user JWT.

Required protection:

```text
STORE_WEBHOOK_SECRET=<long-random-secret>
```

Use the secret as either:

- Query token: `?token=<STORE_WEBHOOK_SECRET>`
- Header: `x-reviewnatin-webhook-secret: <STORE_WEBHOOK_SECRET>`

## Apple App Store Server Notifications V2

Configure App Store Connect server notification URL:

```text
https://<PROJECT_REF>.supabase.co/functions/v1/store-webhook/apple?token=<STORE_WEBHOOK_SECRET>
```

Recommended secrets:

```text
APPLE_BUNDLE_ID=ph.reviewnatin.app
STORE_WEBHOOK_SECRET=<long-random-secret>
```

The handler receives Apple's `signedPayload`, decodes notification, transaction, and renewal data, then updates `user_entitlements` through `apply_store_subscription_lifecycle`.

Handled Apple lifecycle outcomes:

- `SUBSCRIBED`, `DID_RENEW`, `DID_RECOVER`, `REFUND_REVERSED` -> `active`
- `DID_CHANGE_RENEWAL_STATUS` + `AUTO_RENEW_DISABLED` -> `cancelled`
- `DID_FAIL_TO_RENEW` -> `billing_retry` or `grace_period`
- `GRACE_PERIOD_EXPIRED`, `EXPIRED` -> `expired`
- `REFUND` -> `refunded`
- `REVOKE` -> `revoked`

## Google Play RTDN

Configure Google Pub/Sub push subscription URL:

```text
https://<PROJECT_REF>.supabase.co/functions/v1/store-webhook/google?token=<STORE_WEBHOOK_SECRET>
```

Required secrets:

```text
ANDROID_PACKAGE=ph.reviewnatin.app
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=<service-account-json>
STORE_WEBHOOK_SECRET=<long-random-secret>
```

Google RTDN only says that purchase state changed. The handler calls:

```text
purchases.subscriptionsv2.get
```

Then it updates `user_entitlements` from the returned `subscriptionState`, `lineItems.expiryTime`, and `autoRenewingPlan.autoRenewEnabled`.

Handled Google lifecycle outcomes:

- Active/recovered/renewed/restarted -> `active`
- Canceled but not expired -> `cancelled`
- Grace period -> `grace_period`
- On hold / paused -> `billing_retry`
- Expired / pending purchase canceled -> `expired`
- Revoked / voided purchase -> `revoked`

## Database Objects

Migration:

```text
supabase/migrations/20260607002906_store_webhook_lifecycle.sql
```

Objects:

- `store_subscription_events`: idempotent webhook event audit table.
- `apply_store_subscription_lifecycle(...)`: service-role RPC that updates entitlement lifecycle fields.

## Production Notes

- Apple and Google dashboards must use the deployed Supabase Function URL.
- The app should still call restore purchases on demand; webhooks are not a substitute for user-triggered restore.
- Entitlement access remains clean: Monthly, 6 Months, and Yearly are all `plus`; webhook status and period dates control whether access is active.
- If a webhook event cannot find an existing entitlement, it is still stored in `store_subscription_events` with `entitlement_found = false` so it can be investigated.
