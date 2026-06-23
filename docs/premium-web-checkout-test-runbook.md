# Premium Web Checkout — Beta Test Runbook (Build 36)

**Cohort:** Premium P1–P4  
**APK:** [beta-distribution-build-36.md](./beta-distribution-build-36.md)

Two paths: **Path A (no real money, build 36 today)** or **Path B (live GCash/Maya)**.

---

## Preflight (laptop)

```bash
npm run beta:premium:verify
npm run beta:security:verify
```

Optional — instant demo on checkout page (no admin fulfill):

```bash
npm run checkout:demo:on
# Then redeploy marketing with NEXT_PUBLIC_CHECKOUT_DEMO=true, OR use build 37+ with EXPO_PUBLIC_CHECKOUT_DEMO in EAS
```

---

## Path A — Zero-money test (recommended first)

Works with **build 36** on a physical phone. No GCash/Maya transfer.

### Phone (tester — ~10 min)

1. **Uninstall** old ReviewNatin → install build 36  
   APK: https://expo.dev/artifacts/eas/Kl3gRkSk86vM-NjB-RElBEwNlXT9VKh_e0zp0iyZFEY.apk

2. **Register** with a real email you can access → enter **6-digit OTP** → finish onboarding.

3. Open **Subscribe** (Home Plus card, paywall, or `reviewnatin://subscribe`).

4. Confirm signed-in state:
   - Beta banner: *"Beta APK — magbayad via GCash o Maya web checkout…"*
   - Sticky CTA: **Magbayad via GCash/Maya · ₱…**

5. Tap CTA → pick **GCash** or **Maya** → in-app browser opens `reviewnatinph.com/checkout?ref=RN-…`

6. On checkout page, tap **"I sent payment — confirm"** (marks session `submitted`).

7. **Switch back to ReviewNatin** (Recent apps). Subscribe shows **Payment pending · Ref RN-…**

8. Tell your laptop operator the **reference code** (e.g. `RN-ABC123`).

### Laptop (operator — ~30 sec)

```bash
npm run beta:premium:fulfill -- RN-XXXXXXXX
# or list pending:
npm run beta:premium:fulfill -- --list
```

### Phone (verify — ~5 min)

9. On Subscribe, tap **Payment pending** card to refresh.

10. **Pass:** green *"Payment confirmed — your subscription is now active!"* + **ManagePlusCard**.

11. **Entitlements audit:**
    - Home / Study / Result → **no ads**
    - Practice **beyond 20 questions** → no paywall
    - Mock exam → full access (not preview-only)
    - AI tutor → no daily limit message
    - Offline pack → download without premium gate

12. Force-quit app → reopen → Plus still active.

### GitHub feedback

Create issue: https://github.com/donbermoy88/reviewnatin/issues/new?template=beta-feedback.yml

- **Severity:** P3 (if all pass) or P1/P2 if something failed  
- **Screen:** Subscribe → Web checkout  
- **Title prefix:** `[Beta][cohort:premium]`  
- Include: device model, Android version, build **36**, reference code, pass/fail per step 11

---

## Path B — Live GCash/Maya (production-like)

Same steps 1–7 on phone, but **actually send ₱{amount}** via GCash/Maya using reference code in payment notes.

Then either:
- Wait for manual admin verification (up to 24h per checkout copy), **or**
- Admin fulfills immediately: `npm run beta:premium:fulfill -- RN-…`

Continue verification at step 11 above.

---

## Path C — Instant demo (no admin fulfill)

Requires **both**:

1. `npm run checkout:demo:on` (Supabase edge secret)
2. Checkout page sends `confirm_demo: true` — either:
   - Marketing deploy with `NEXT_PUBLIC_CHECKOUT_DEMO=true`, **or**
   - Build **37+** with `EXPO_PUBLIC_CHECKOUT_DEMO=true` in EAS → in-app **"Beta: Kumpirmahin ang test payment"** on pending card

Then step 6 on checkout page (or in-app beta button) auto-grants Plus — skip laptop fulfill.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| OTP email not arriving | Check spam; confirm Resend SMTP (`npm run supabase:smtp`) |
| Checkout page "session not found" | Session expired — start checkout again from app |
| Payment pending never clears | Run `npm run beta:premium:fulfill -- RN-…` |
| Plus active but ads still show | Force-quit app; Settings → pull to refresh; check entitlement in Supabase |
| Guest sees login instead of checkout | Expected — register first (Premium cohort) |

---

## Automated backend check only

```bash
npm run beta:premium:verify
npm run beta:premium:fulfill -- --list
```

Does **not** replace physical-device UI verification.
