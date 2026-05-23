# Pricing and In-App Purchase (IAP) Specification

Three tiers only for MVP. Payments via **Apple App Store** and **Google Play Billing** first. GCash/Maya deferred to Phase 2 web checkout.

---

## Tier comparison

| Feature | Free | Exam Pass | ReviewNatin Plus |
|---------|------|-----------|------------------|
| Price | ₱0 | **₱499** one-time per exam (6 months) | **₱149/mo** or **₱999/yr** |
| Exams unlocked | 1 active (chosen at onboarding) | 1 purchased exam | All Phase 1 exams |
| Daily practice questions | 20/day | Unlimited | Unlimited |
| Diagnostic | Yes | Yes | Yes |
| PasaPath daily plan | Basic (1 task/day) | Full multi-task | Full + priority regen |
| Taglish explanations | On answered items | All | All |
| Mistake Bank | Last 7 days | Full history | Full history |
| Mini-mock | 1/week | Unlimited mini | Unlimited |
| Full mock exam | Preview (10 items) | Unlimited | Unlimited |
| Board Exam Mode | No | Yes | Yes |
| Offline content pack | No | 1 exam pack | All packs |
| Advanced analytics | Basic | Full | Full + readiness trends |
| AI-generated explanations | 5/day | 20/day | Unlimited |
| Ads | Banner (not during quiz/mock) | None | None |
| Content updates | Standard | Standard | Priority |

**Competitive positioning:**
- Undercuts Super Tutor yearly all-access (₱999 vs ₱1,999)
- Per-exam unlock matches Filipino "pay for my exam only" behavior
- Beats free AI reviewers on **trust** (verified content, report flow) not price

---

## SKU catalog

### Apple App Store

| SKU ID | Product type | Price tier (PHP) | Notes |
|--------|--------------|------------------|-------|
| `com.reviewnatin.exampass.cse_pro` | Non-consumable | ₱499 | 6-month entitlement |
| `com.reviewnatin.exampass.cse_sub` | Non-consumable | ₱499 | |
| `com.reviewnatin.exampass.let_elem` | Non-consumable | ₱499 | |
| `com.reviewnatin.exampass.let_sec` | Non-consumable | ₱599 | Includes major content |
| `com.reviewnatin.exampass.pnle` | Non-consumable | ₱599 | |
| `com.reviewnatin.plus.monthly` | Auto-renewable sub | ₱149 | |
| `com.reviewnatin.plus.yearly` | Auto-renewable sub | ₱999 | Best value badge |

### Google Play

| Product ID | Type | Price |
|------------|------|-------|
| `exam_pass_cse_pro` | One-time (managed) | ₱499 |
| `exam_pass_cse_sub` | One-time | ₱499 |
| `exam_pass_let_elem` | One-time | ₱499 |
| `exam_pass_let_sec` | One-time | ₱599 |
| `exam_pass_pnle` | One-time | ₱599 |
| `plus_monthly` | Subscription | ₱149 |
| `plus_yearly` | Subscription | ₱999 |

---

## Entitlement logic

```typescript
function hasAccess(userId: string, examTypeId: string, feature: Feature): boolean {
  const entitlements = await getActiveEntitlements(userId);

  if (entitlements.some(e => e.tier === 'plus' && !isExpired(e))) {
    return true; // Plus unlocks everything
  }

  if (entitlements.some(e => e.tier === 'exam_pass' && e.examTypeId === examTypeId && !isExpired(e))) {
    return EXAM_PASS_FEATURES.includes(feature);
  }

  return FREE_FEATURES.includes(feature);
}
```

### Exam Pass duration

- `expires_at = purchase_date + 180 days`
- Show countdown in Settings: "CSE Pro access: 142 days left"
- Renewal: purchase again (non-consumable — use new SKU or consumable extension SKU in Phase 2)

### Plus subscription

- Monthly: 30-day rolling from renewal
- Yearly: 365-day rolling
- Grace period: follow store policies (3–16 days)
- Restore purchases on new device required

---

## Paywall trigger points

| Trigger | Screen | Message |
|---------|--------|---------|
| Daily question limit hit | Practice Quiz | "You've used 20/20 free questions today. Unlock unlimited." |
| Full mock attempt | Mock Exam list | "Full mock requires Exam Pass or Plus." |
| Mistake older than 7 days | Mistake Bank | "Unlock full Mistake Bank history." |
| Offline download | Topic List | "Download reviewer pack for offline study." |
| Board Exam Mode | Practice mode picker | "Simulate real exam pressure with Exam Pass." |
| AI explanation limit | Result screen | "Daily AI explanations used. Upgrade for more." |

**Never show paywall:** During active mock timer, mid-question, or diagnostic.

---

## IAP implementation flow

```mermaid
sequenceDiagram
    participant App
    participant Store as AppStore_or_Play
    participant API as ReviewNatin_API
    participant DB

    App->>Store: Request purchase SKU
    Store-->>App: Receipt / purchase token
    App->>API: POST /iap/verify
    API->>Store: Validate receipt server-side
    Store-->>API: Valid
    API->>DB: Insert user_entitlements + payment_transactions
    API-->>App: Entitlements updated
    App->>App: Refresh feature flags
```

### Server-side verification (required)

| Store | Endpoint | Library |
|-------|----------|---------|
| Apple | App Store Server API v2 | Verify JWS transaction |
| Google | Google Play Developer API | `purchases.subscriptions` / `products` |

**Never trust client-only receipt validation.**

### API: `POST /api/v1/iap/verify`

```json
{
  "platform": "apple",
  "product_id": "com.reviewnatin.exampass.cse_pro",
  "transaction_id": "...",
  "receipt_data": "..."
}
```

Response:

```json
{
  "success": true,
  "entitlements": [
    {
      "tier": "exam_pass",
      "exam_type_slug": "cse-professional",
      "expires_at": "2026-11-23T00:00:00+08:00"
    }
  ]
}
```

---

## Expo / React Native packages

| Package | Purpose |
|---------|---------|
| `expo-in-app-purchases` or `react-native-iap` | Store connection, purchase flow |
| RevenueCat (optional) | Cross-platform entitlement sync — reduces custom backend work |

**Recommendation:** RevenueCat for MVP speed if budget allows; otherwise `react-native-iap` + custom Supabase edge function for verification.

---

## Feature flags (client)

Store resolved entitlements in Zustand/Context on app launch and after purchase:

```typescript
type Entitlements = {
  tier: 'free' | 'exam_pass' | 'plus';
  unlockedExamSlugs: string[];
  expiresAt: Record<string, string>;
  dailyQuestionsRemaining: number;
  aiExplanationsRemaining: number;
};
```

Refresh on:
- App foreground
- Purchase complete
- `POST /iap/restore`

---

## Ads (free tier only)

| Placement | Allowed |
|-----------|---------|
| Dashboard bottom | Yes |
| Between practice sessions | Yes (interstitial max 1 per 30 min) |
| During practice question | **No** |
| During mock exam | **No** |
| Result screen | Banner only |

Use AdMob with child-directed settings off (17+ education app).

---

## Phase 2 monetization (not MVP)

| Model | Notes |
|-------|-------|
| GCash / Maya | Web checkout → manual entitlement grant or Xendit webhook |
| Review Center bulk | B2B invoice, seat licenses |
| School plan | Similar to bulk |
| Per-major LET unlock | ₱299 add-on if not on Plus |
| Sponsored materials | Carefully labeled, editorial review |

---

## Legal and store compliance

- Subscription terms: auto-renew disclosure before purchase (Apple requirement)
- Privacy policy: disclose payment data handling (RA 10173)
- Refunds: direct users to Apple/Google refund policies
- Pricing display: show PHP equivalent; store handles localized currency
- "Not affiliated with PRC/CSC" on subscription screen

---

## Analytics events

| Event | Properties |
|-------|------------|
| `paywall_viewed` | `trigger`, `exam_slug` |
| `purchase_started` | `sku`, `tier` |
| `purchase_completed` | `sku`, `revenue_php` |
| `purchase_failed` | `sku`, `error` |
| `restore_completed` | `entitlements_count` |

---

## Testing checklist

- [ ] Sandbox purchase each SKU (Apple Sandbox, Google test account)
- [ ] Restore purchases on second device
- [ ] Expired Exam Pass reverts to free limits
- [ ] Plus subscription renewal extends `expires_at`
- [ ] Subscription cancellation retains access until period end
- [ ] Receipt replay attack rejected server-side
