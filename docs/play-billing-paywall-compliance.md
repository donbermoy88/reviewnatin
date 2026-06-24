# Google Play Billing Paywall Compliance

ReviewNatin Android (build 37+) uses **Google Play Billing only** for in-app Premium purchases. External payment flows (GCash/Maya picker, in-app browser checkout, proof upload, admin activation) are removed from the mobile app.

Legacy `web_*` entitlements in Supabase remain honored but are not sold in-app.

Distribution: [Play Console internal testing](./play-console-migration.md) — sideload APK web-checkout beta (build 36) is deprecated.

---

## In-app purchase path

```text
Subscribe screen → Continue to Secure Payment → Google Play purchase sheet
  → react-native-iap → iap-verify Edge Function → Supabase entitlements
```

Dev builds (`__DEV__`) use `grant_demo_entitlement` only — not production billing.

---

## Policy-safe copy rules

| Allowed | Not allowed in app UI |
|---------|------------------------|
| GCash/Maya/ShopeePay **inside Google Play checkout** (help text) | “Pay with GCash” / “Pay with Maya” buttons |
| “Continue to Secure Payment” primary CTA | Links to `reviewnatinph.com/checkout` |
| “View Premium Plans” on locked features | QR codes, bank transfer, proof upload |
| “Prepaid Plus access” for legacy web entitlements | “GCash checkout” / “Web checkout” labels |

Central strings: `apps/mobile/lib/subscription/paywall-copy.ts`

---

## QA checklist (Play internal testing track)

Run on a **physical device** with a build installed from **Play internal testing** (not sideload APK).

- [ ] No GCash/Maya/QR/bank/proof/admin/website payment UI in app
- [ ] Paywall CTA opens Google Play purchase sheet only
- [ ] Products/prices load from Play
- [ ] Purchase success → Premium unlocked
- [ ] Cancelled purchase → user stays Free
- [ ] Restore purchases works (Subscribe + Settings)
- [ ] Settings → Manage Subscription opens Google Play (IAP subscribers)
- [ ] Locked screens → View Premium Plans → paywall
- [ ] Help text mentions GCash/Maya **only inside Google Play checkout** context
- [ ] `reviewnatin://checkout?ref=…` deep link opens `/subscribe` with no pending web checkout

---

## Automated checks

```bash
npm run mobile:test -- paywall-copy availability deep-link-routes
npm run mobile:typecheck
npm run beta:phase5:verify
```

Maestro (emulator smoke — guest paywall copy):

```bash
# Terminal 1 — Metro
cd apps/mobile && npx expo start --dev-client

# Terminal 2 — emulator + screenshots (requires debug APK from expo run:android)
npm run emulator:paywall-demo
```

---

## Superseded docs

- [premium-web-checkout-test-runbook.md](./premium-web-checkout-test-runbook.md) — web checkout beta ops only (legacy entitlements)
- [beta-distribution-build-36.md](./beta-distribution-build-36.md) — last sideload web-checkout APK; use Play internal testing for build 37+
