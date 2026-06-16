# ReviewNatin — Principal-Level Android & Premium Audit
**Date:** 2026-06-16 · **Platform priority:** Android / Google Play
**Runtime evidence:** Pixel emulator `Medium_Phone_API_35` (API 35), debug build from this repo, live interaction + logcat + screenshots.
**Method:** Code-first across `apps/mobile` + `supabase/`, then runtime pass (onboarding→dashboard→quiz→paywall→settings, deep links, hardware back).

> Scope note: this audit assumes the two fixes already landed this session — AdMob `app.config.js` hardening and the onboarding `BackHandler`. Those are not re-listed as open findings.

## REMEDIATION STATUS (updated 2026-06-16, round 2)
Applied + verified (tsc/eslint clean, 47/47 unit tests pass, runtime-checked on Pixel API 35 + low-end Nexus-4 AVD):
- **P0-2 / P1-1 FIXED** — `supabase/migrations/20260616120000_harden_content_access_gate.sql` redefines `user_has_content_access` to use `COALESCE(grace_period_expires_at, current_period_end, expires_at)`, exclude `revoked/refunded/expired`/`revoked_at`, and exclude `source='demo'` unless `app.demo_entitlements_enabled='true'`. **Still must `supabase db push` to prod and verify the demo flag is off.**
- **P2-1 FIXED** — `mock-review`, `mistakes`, `bookmarks`, `leaderboard` converted from `ScrollView`+`.map()` to `FlatList` (ListHeader/ListEmpty/ListFooter, `initialNumToRender`/`windowSize`). Leaderboard FlatList verified rendering at runtime.
- **P2-2 FIXED** — `app/subscribe/index.tsx` dev banner now platform-aware ("Google Play build / Play Billing" on Android). Verified at runtime.
- **P2-4 FIXED** — `hooks/use-network-status.ts` requires 2 consecutive probe failures before showing offline; clears immediately on success.
- **P3-1 FIXED** — `components/ad-banner.tsx` self-gates on `useEntitlements().isPremium()` (renders null for Plus).
- **P3-2 FIXED** — Restore purchases hidden for signed-out guests (`settings.tsx`, `subscribe/index.tsx`).
- **Low-end pass DONE** — created `lowend_api35` (Nexus 4, 768×1280, 2GB). App installs/runs; layout adapts. One dev-only artifact: Ionicons font failed to download from Metro over adb-reverse to the 2nd emulator — bundled in release builds, not a code bug.

Still open (external creds / not-yet-applied): P0-1, P1-2, P1-3, P2-3, plus pushing the gate migration to prod.

---

## 1. FINDINGS BY SEVERITY

### P0 — Critical (block closed testing)

**P0-1 — Production IAP / ads / crash-reporting are non-functional until external config is supplied.**
- Why it matters: The entire monetization + observability surface is inert in a real Play build. No products in Play Console → `requestStorePurchase`/`restorePurchases` return store errors; no `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` → `iap-verify` returns 503; no real AdMob ID → production prebuild **throws** (by design after this session's hardening); no `EXPO_PUBLIC_SENTRY_DSN` → production prebuild throws.
- Evidence: `supabase/functions/iap-verify/index.ts` (`"Google Play IAP not configured"` 503 when `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` unset); `apps/mobile/lib/iap/product-skus.ts` (`ANDROID_PRODUCT_SKUS` "deferred until Play Console setup"); `app.config.js` production throws for missing Sentry/AdMob.
- Fix: create the 8 Play Billing products matching `ANDROID_PRODUCT_SKUS`; upload service-account JSON to Supabase secrets; set real AdMob + Sentry env in the EAS `production` profile.
- Confidence: **confirmed** (config-level). External-credential blocker.

**P0-2 — Server content gate `user_has_content_access` ignores `source` and `status`; full paywall bypass is possible if `app.demo_entitlements_enabled='true'` in production.**
- Why it matters: `grant_demo_entitlement` is `SECURITY DEFINER`, `GRANT EXECUTE … TO authenticated`, and inserts `source='demo'`, `expires_at=now()+180d` for any product. The server gate `user_has_content_access()` only filters on `expires_at`; it does **not** exclude `source='demo'` and does not check `status`. So any logged-in user who can reach `grant_demo_entitlement` gets full server-side premium (tier `plus` → all gated RPCs/RLS return premium content). The only thing stopping this in prod is the env guard `current_setting('app.demo_entitlements_enabled')='true'`.
- Evidence: `supabase/migrations/20260523120003_security_rls.sql:7` (`user_has_content_access`, no source/status check); `supabase/migrations/20260606162254_update_entitlement_fulfillment_lifecycle.sql` (`grant_demo_entitlement` guard); client suppression only: `apps/mobile/lib/api/entitlements.ts` `.filter((e) => __DEV__ || e.source !== 'demo')`.
- Reproduction (must verify): on the prod DB, run `SHOW app.demo_entitlements_enabled;` (or check `ALTER DATABASE … SET`). If `true` → P0 live exploit. Regardless of the setting, harden the gate.
- Fix: (a) verify the setting is unset/false in prod; (b) add `AND ue.source <> 'demo'` and `AND COALESCE(ue.status,'active') NOT IN ('refunded','revoked','expired')` to `user_has_content_access`; redefine the function in a new migration (it was never updated after the lifecycle migrations).
- Confidence: **confirmed code path; needs runtime validation of the prod setting** to confirm whether it is currently live-exploitable.

### P1 — High

**P1-1 — `user_has_content_access` was never updated to the subscription-lifecycle model.**
- Why it matters: It checks `expires_at` only. `expires_at IS NULL` is treated as **unlimited access**. Real IAP rows always set `expires_at` (good), and the store-webhook syncs `expires_at` on refund/revoke (good) — so today the legacy field tracks access. But any future write path that sets only `current_period_end`/`grace_period_expires_at` (the "real" lifecycle fields the client uses) and leaves `expires_at` null would silently grant unlimited server access. Two sources of truth for the access window.
- Evidence: client uses `gracePeriodExpiresAt ?? currentPeriodEnd ?? expiresAt` (`lib/api/entitlements.ts entitlementAccessEnd`); server uses only `expires_at`.
- Fix: change the gate to `COALESCE(grace_period_expires_at, current_period_end, expires_at)` and add status/source filters (same migration as P0-2).
- Confidence: confirmed.

**P1-2 — Pricing has 3 sources of truth; client hardcodes prices that shadow the DB.**
- Why it matters: `CANONICAL_PRODUCT_PRICING` in `lib/api/entitlements.ts` overrides DB `subscription_products.price_php` (`pricePhp: canonical?.pricePhp ?? row.price_php`). The *actual* charge is a third value set in Play Console. If any two drift, the paywall shows a price that doesn't match what Google charges → refunds, policy complaints, mistrust on a paid exam product.
- Evidence: `lib/api/entitlements.ts` `CANONICAL_PRODUCT_PRICING` (₱159/699/1499/…); DB pricing migration `supabase/migrations/20260606010000_update_subscription_pricing.sql`.
- Fix: pick ONE source. Either drive display purely from the store product (react-native-iap `fetchProducts` localized price) or purely from DB; delete the hardcoded map. For an IAP app, the store-reported localized price is the correct display value.
- Confidence: confirmed.

**P1-3 — Push notifications cannot work on Android as configured; not runtime-validatable here.**
- Why it matters: No `google-services.json` / FCM v1 credential. `expo-notifications` remote push on Android requires both. Also `canUseLocalNotifications()`/`canUseRemotePushNotifications()` gate on `Device.isDevice`, which is false on the emulator — so notification scheduling/registration is fully untestable on this emulator and currently disabled in this build.
- Evidence: `lib/device-capabilities.ts` (`canUseExpoNotifications` → `canUseSecureKeychain` → `Device.isDevice`); manifest has FCM metadata but no `google-services.json` present.
- Fix: add `google-services.json`, configure FCM v1 key in EAS, and validate on a physical device. Until then, do not advertise reminders as working.
- Confidence: confirmed (config) / needs physical-device validation.

**P1-4 — Low-end / small-screen Android pass NOT performed.**
- Why it matters: You explicitly asked for a low-end profile. Only a modern Pixel (API 35, 1080×2400) was exercised. Layout uses safe-area insets correctly (33 files), but text scaling, `ScrollView` list memory, and the unvirtualized mock-review (P2-1) are exactly what breaks on low-end devices, and that is unverified.
- Evidence: emulator list shows only `Medium_Phone_API_35` and `flutter_emulator`; no low-RAM/small-screen AVD.
- Fix: `avdmanager create avd -n lowend_api26 -k "system-images;android-35;google_apis;arm64-v8a" --device "Nexus 4"` (or a 2GB-RAM, 320dpi profile), boot with `-memory 2048`, and re-run the flow pass. I can do this on request.
- Confidence: confirmed gap.

### P2 — Medium

**P2-1 — All lists are unvirtualized (`ScrollView` + `.map()`); zero `FlatList`/`FlashList` in the app.**
- Why it matters: `mock-review/[sessionId].tsx` renders an entire mock (CSE full ≈ 150–170 questions), each with a nested `item.choices.map()` (4 rows) → ~600+ views mounted at once, no recycling. Leaderboard/mistakes/bookmarks do the same (capped at 50/50/200). On low-end Android this is the most likely source of jank, slow screen-open, and memory pressure.
- Evidence: `grep` → 0 `FlatList`/`FlashList`, 26 `ScrollView`; `app/mock-review/[sessionId].tsx:122` `review.map(...)` + `:151` `item.choices.map(...)`; `app/(tabs)/leaderboard.tsx:215`; `app/mistakes/index.tsx:152`; `app/bookmarks/index.tsx:176`.
- Fix: migrate the long lists (mock-review, leaderboard, bookmarks, mistakes) to `FlatList` with `keyExtractor` + `windowSize`/`initialNumToRender`. Mock-review is the priority.
- Confidence: confirmed (code). Runtime jank severity needs low-end profiling (P1-4).

**P2-2 — iOS-centric copy leaking into Android.**
- Why it matters: On Android the subscribe screen's dev banner reads "Dev build — purchases are simulated. **On TestFlight/App Store, real StoreKit billing applies.**" StoreKit/TestFlight are iOS-only. An Android tester/reviewer sees wrong-platform language.
- Evidence: runtime screenshot of `reviewnatin://subscribe` (this audit); copy in `app/subscribe/index.tsx`.
- Fix: platform-conditional copy ("Google Play billing" on Android).
- Confidence: confirmed (runtime).

**P2-3 — No component/integration/e2e tests; no entitlement or purchase-verification tests.**
- Why it matters: 10 unit-test files, all pure-logic (`quiz-grading`, `question-randomization`, `content-gate`, `validation`, `manage-subscription`, `goals`, …). The highest-risk surfaces — entitlement evaluation against the lifecycle fields, the server gate, the IAP verify→fulfill path, deep-link gating — have **no** tests. Regressions in `isActiveEntitlement`/`hasPremiumAccess` would ship silently.
- Evidence: `find apps/mobile -name '*.test.ts*'` → 10 files, none touching `entitlements-provider`, `iap-verify`, or RLS.
- Fix: add tests for `isActiveEntitlement` (expired/refunded/grace/demo matrix), `hasPremiumAccess` (plus vs exam_pass scoping), and a contract test for `iap-verify` rejection paths.
- Confidence: confirmed.

**P2-4 — Cold-start "Offline — using saved content" false flash.**
- Why it matters: On launch the network probe (`hooks/use-network-status.ts`, HEAD, 4s timeout) can time out while the JS thread is busy, showing a scary orange offline banner for ~20s even when online. Bad first impression; self-clears.
- Evidence: runtime — banner appeared on a connected emulator (ping to Supabase 49ms) and cleared on next probe.
- Fix: delay first probe slightly, or require 2 consecutive failures before showing offline; consider `@react-native-community/netinfo` (real connectivity) instead of a HEAD probe.
- Confidence: confirmed (runtime).

### P3 — Low

**P3-1 — `AdBanner` doesn't self-gate on `isPremium`.** All 3 current call sites gate correctly (`app/(tabs)/index.tsx:905`, `study.tsx:370`, `practice/result.tsx:535`), but the component only checks `adConfig.bannerUnitId` (`components/ad-banner.tsx`). A future caller that forgets the wrap will show ads to paying "No-ads" users. Make the component itself consume `useEntitlements()` and render null when premium. Confidence: confirmed.

**P3-2 — "Restore purchases" shown to a not-signed-in guest** (settings screenshot). Restore has no account to attach to; tapping yields a store error. Hide/My-Account-gate it. Confidence: confirmed (runtime).

**P3-3 — Dependency drift.** `npx expo install --check` flags ~13 deps a patch behind their SDK-56 targets, incl. a major `react-native-view-shot` 4→5. Pre-existing; builds fine. Upgrade deliberately, not as part of Android work. Confidence: confirmed.

---

## 2. EXECUTIVE SUMMARY

- **Android readiness:** **7/10** — builds, launches, and runs cleanly on a modern emulator after this session's fixes; core flows work; low-end pass + push are unverified.
- **Google Play closed-testing readiness:** **4/10** — blocked almost entirely by external config (Billing products, service account, real AdMob/Sentry, store assets), not by app bugs.
- **Premium entitlement readiness:** **7.5/10** — architecture is genuinely server-enforced (RLS select-only, service-role-only fulfillment, real Apple/Google verification, no client-trust grants). Docked for the `user_has_content_access` demo/status gap (P0-2/P1-1) and the prod demo-flag dependency.

**Top 5 release blockers**
1. Google Play Billing products + service-account JSON not configured (P0-1).
2. `user_has_content_access` demo/status gap + verify `app.demo_entitlements_enabled` off in prod (P0-2).
3. Real AdMob app ID + Sentry DSN for the production EAS profile (P0-1).
4. FCM `google-services.json` for push; physical-device validation (P1-3).
5. Store listing assets (feature graphic 1024×500, ≥2 screenshots) — none exist.

**Top 5 high-value improvements**
1. Virtualize mock-review/leaderboard lists (P2-1) — biggest low-end UX win.
2. Single source of truth for pricing (P1-2).
3. Add entitlement + IAP contract tests (P2-3).
4. Platform-correct copy + 2-failure offline debounce (P2-2/P2-4).
5. Self-gating `AdBanner` (P3-1).

---

## 3. FINDINGS BY DISCIPLINE

- **QA:** No e2e/integration coverage; manual flow pass good (onboarding/dashboard/quiz/paywall/settings verified). Notification + restore + real purchase paths unverifiable on emulator (P1-3, P2-3).
- **UX/design:** Onboarding is strong (5 clear steps, Taglish, disclaimer present). Wrong-platform dev copy (P2-2). Offline flash (P2-4). Restore shown to guest (P3-2).
- **Frontend/mobile:** Clean provider tree (`Auth→Preferences→Entitlements→Iap`); lazy native imports; no client-trust entitlement grants. Unvirtualized lists (P2-1). `AdBanner` call-site-gating fragility (P3-1).
- **Android/native:** Config correct (package, target 36, adaptive icon, deep links, channels). Hardware-back fixed this session. Push not configured (P1-3).
- **Backend/Supabase:** Strong: RLS select-only on `user_entitlements`, `fulfill_iap_purchase` REVOKEd from PUBLIC, real store verification. Weak: `user_has_content_access` not lifecycle-aware (P0-2/P1-1).
- **Premium/subscription:** Server-verified, no local grants, refunds sync `expires_at`. Gaps: demo/status filtering, pricing drift.
- **Security/privacy:** No secrets/service-role key in client (`grep` clean — only anon key). Account deletion + privacy/terms URLs present. Deep links to gated content are safe because data is server-gated (the screen shell may open, but premium data is denied by `user_has_content_access`).
- **Performance:** Unvirtualized lists the main code-backed risk; cold start is heavy (New-Arch + many providers). Needs low-end profiling.
- **Release/operations:** EAS pipeline configured; CI script exists (`ci:local`). Missing store assets, external creds, push config.

---

## 4. FLOW AUDIT TABLE

| Flow | User type | Status | Main issue | Evidence | Next action |
|---|---|---|---|---|---|
| Onboarding (5 steps) | guest | pass | none | runtime screenshots | — |
| Hardware back in onboarding | guest | pass (fixed) | was exiting app | this session | — |
| Dashboard load | guest | pass | offline flash | `/tmp/dash_final.png` | debounce probe |
| Practice quiz | guest | pass | unvirtualized result list | runtime + `practice/result.tsx` | FlatList |
| Paywall / subscribe | guest | risky | iOS-only dev copy | `reviewnatin://subscribe` screenshot | platform copy |
| Settings | guest | risky | restore shown to guest | settings screenshot | gate restore |
| Purchase (buy) | free→premium | not verified | no store build/products | `lib/iap/store.ts` | Play Console + TestTrack |
| Restore purchases | premium | not verified | needs store build | `restorePurchases` | internal-track device |
| Payment cancel/interrupt | interrupted | pass (code) | handled, no grant | `iap-provider.tsx:87`, `store.ts requestStorePurchase` | device confirm |
| Expired/refunded | expired | pass (code) | webhook sets expires_at past | `20260607002906_store_webhook_lifecycle.sql` | device confirm |
| Deep link to gated content | guest | pass (server-gated) | UI shell may open; data denied | `user_has_content_access` | add UI redirect for polish |
| Push notifications | any | not verified | no FCM / emulator | `device-capabilities.ts` | physical device |
| Google Sign-In | guest | not verified | needs Android OAuth+SHA-1 | `lib/auth/google-sign-in.ts` | configure client |
| Low-end device | any | not verified | no low-end AVD | — | create AVD (P1-4) |

---

## 5. PREMIUM ENTITLEMENT AUDIT TABLE

| Feature | Expected by plan | Observed | Enforcement | Status | Fraud risk | Fix |
|---|---|---|---|---|---|---|
| Premium questions / full banks | Plus (all) / exam_pass (that exam) | gated | **Backend** `user_has_content_access` in RPCs/RLS | pass | low | add demo/status filter |
| Mock exams (full) | Plus / exam_pass | gated server-side | **Backend** (`get_mock_*` use the gate) | pass | low | same |
| No-ads | Plus / exam_pass(exam) | banners hidden when premium | Client (`!isPremium` at call sites) | risky | low (revenue only) | self-gate `AdBanner` |
| Entitlement grant | only after verified purchase | server-only | **Verified purchase** (`iap-verify`→`fulfill_iap_purchase`, service-role) | pass | low | — |
| Demo unlock | dev only | suppressed in client; server gate counts it | RPC gated by `app.demo_entitlements_enabled` | risky | med if flag on in prod | verify flag off + filter source server-side |
| Expiry/refund revoke | lose access | `expires_at` set to past on refund | Backend webhook | pass | low | also check `status` in gate |
| Pricing shown | match store charge | hardcoded client map | Client constant overrides DB | risky | n/a | one source of truth |

---

## 6. ARCHITECTURE ASSESSMENT

- **Structurally sound:** entitlement security model (RLS + service-role fulfillment + real store verification + no client-trust grants); provider composition; lazy native module loading (`canUseStorePurchases`/`Device.isDevice` gating) so dev/emulator never touches store-only natives; CNG config in `app.config.js`.
- **Fragile:** `user_has_content_access` frozen at the pre-lifecycle schema while the client moved on (classic drift); pricing duplicated across client constant + DB + store; ad gating by convention at every call site; offline detection via hand-rolled HEAD probe instead of NetInfo.
- **Looks AI-generated / weak reasoning:** `ScrollView` + `.map()` for *every* list including a 150-item mock review (no virtualization anywhere — a human RN engineer would reach for FlatList); two parallel pricing tables with a "canonical overrides DB" comment that doesn't explain why the DB column still exists; iOS-only copy shipped on the Android subscribe screen.
- **Refactor before scale:** list virtualization; collapse pricing to store-reported localized price; make `user_has_content_access` the single lifecycle-aware gate and unit-test it.

---

## 7. TEST & INSTRUMENTATION GAPS

- No integration/e2e (Detox/Maestro) tests; no React component tests.
- No entitlement matrix tests (expired/refunded/grace/demo/exam-pass scoping).
- No `iap-verify` contract tests (reject unverified, bind to caller, rate-limit).
- Crash reporting (Sentry) inert without DSN; `captureAppException` breadcrumbs exist in IAP paths but won't report until configured.
- No product analytics verified end-to-end on Android (events gated behind RLS; not validated here).

---

## 8. GOOGLE PLAY RELEASE CHECKLIST

**Ready:** package/version/targetSDK 36; adaptive icon; privacy (`reviewnatinph.com/privacy`) + terms URLs; support email; in-app account deletion; guest access for reviewers; affiliation disclaimer.
**Not ready (in-repo work):** list virtualization (low-end); platform copy; entitlement-gate hardening + tests; offline debounce.
**Blocked by external creds/config:** real AdMob app ID; Sentry DSN; Play Billing products; Play service-account JSON; Google OAuth Android client + SHA-1; FCM `google-services.json`.
**Manual Play Console:** Data Safety (email/name, app activity, advertising ID, deletion=yes), content rating, target audience, store listing (descriptions + feature graphic 1024×500 + ≥2 screenshots), closed-testing track + 12 testers / 14 days.

---

## 9. RELEASE VERDICT

**Shippable only for internal Android testing now; shippable for Google Play closed testing only after the P0/P1 items.**

Blunt version: the app *runs* well on Android and the premium/payment security is better than most AI-scaffolded apps — verification is genuinely server-side and there's no client-trust unlock. But it is not closed-testing-ready: monetization is entirely unwired for production (no Play products, no service account, AdMob/Sentry/Push unconfigured), the server entitlement gate is frozen at an older schema with a demo/status hole that must be closed and prod-verified, every list is unvirtualized (untested on the low-end devices your audience actually uses), and there are zero tests on the money-critical paths. None of these are deep rewrites — they're a focused hardening pass plus the external Play/credential setup. Do P0-2/P1-1 (gate hardening), the external config, and a low-end pass before inviting testers.
