# Android Beta Testing Program — ReviewNatin PH

Continuous feedback, testing, and release workflow for **12 daily Android beta testers** (4 per cohort) distributing via direct APK (EAS `preview` profile).

## Three tester cohorts

Every beta release must be validated across all three cohorts:

| Cohort | Account | Plus | Primary test focus |
|--------|---------|------|-------------------|
| **Guest** | None (guest mode) | No | Skip login, local progress, signup CTAs at limits |
| **Free** | Registered (email/OAuth + OTP if email) | No | 20 Q/day limit, ads, mock preview, web checkout paywall |
| **Premium** | Registered | Yes (web checkout on APK beta) | No ads, unlimited practice, full mocks, AI tutor, offline |

Roster: [beta-testers.md](./beta-testers.md) (4 testers each).  
Audit matrix: [beta-audit-matrix.md](./beta-audit-matrix.md).

### Daily cohort rotation

| Day | QA focus |
|-----|----------|
| Mon | Guest cohort smoke |
| Tue | Free cohort smoke |
| Wed | Premium cohort smoke |
| Thu | Cross-cohort regression (tester feedback) |
| Fri | All three cohorts on release candidate APK |

## Distribution pipeline

### Build

```bash
cd apps/mobile
npm run eas:build:android:preview
# or: eas build --profile preview --platform android
```

Output: APK (internal distribution). Download from EAS dashboard after build completes.

### Versioning

1. Bump `android.versionCode` in `apps/mobile/app.json` before each beta release.
2. Tag the repo: `git tag beta-v1.0.X && git push origin beta-vX.Y.Z`
3. Record SHA-256 checksum in release notes (from EAS build artifact page).

### Distribute to testers

Until Play Console internal testing is ready:

- Share APK via Firebase App Distribution, Google Drive, or direct download link.
- Include install instructions: enable "Install from unknown sources" for the browser/file manager.
- Post release notes to the tester group (Messenger/Viber/Telegram).
- Tell each tester their **cohort** (Guest / Free / Premium) and setup steps from [beta-testers.md](./beta-testers.md).

### Beta build environment

Use the `preview` EAS profile. Required env vars (set in EAS dashboard or `.env` for local preview builds):

| Variable | Required | Notes |
|----------|----------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Backend |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Backend |
| `EXPO_PUBLIC_SENTRY_DSN` | Optional | Crash reporting (recommended) |
| `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID` | Optional | Ads (test IDs OK for beta) |

**Beta limitations (APK sideload):**

- Google Play Billing IAP does not work — **Premium cohort** uses **web checkout** for ReviewNatin Plus.
- Remote push notifications require FCM + Play signing — local reminders only during APK beta.

## Feedback channels

1. **In-app:** Settings → "Report a problem" (pre-fills device + version + cohort-friendly context).
2. **GitHub:** Use the [Beta Feedback](../.github/ISSUE_TEMPLATE/beta-feedback.yml) issue template — tag `cohort:guest|free|premium`.
3. **Email:** beta@reviewnatinph.com

## Daily beta cycle (SOP)

Run this every weekday while beta is active:

### Morning (30 min)

1. Collect feedback from all channels; note reporter **cohort** if known.
2. Categorize each item:
   - **P0** — crash, data loss, auth broken, payment broken
   - **P1** — major UX blocker, incorrect answers, premium gate failure
   - **P2** — UI inconsistency, performance jank, copy issues
   - **P3** — polish, nice-to-have
3. Create or link GitHub issues. Assign owner and sprint slot.
4. Update [beta-audit-matrix.md](./beta-audit-matrix.md) status for affected flows.

### Midday (engineering)

5. Reproduce on **at least one device per affected cohort**.
6. Fix P0/P1 with regression tests where applicable.
7. Open PR; require `npm run mobile:test` pass.

### Afternoon (release)

8. If P0/P1 fixed: trigger EAS preview build.
9. Run **cohort smokes** per today's rotation (see table above):
   - Guest: onboarding → 20 Q → paywall
   - Free: OTP signup → practice → ads → mock preview
   - Premium: web checkout → no ads → full mock → offline pack
10. **Release gate:** Block beta push if any open P0 or Sentry crash spike in last 24h.

### Evening (communication)

11. Post release notes to tester group (Taglish summary + **which cohort** to focus tomorrow).
12. Update [beta-testers.md](./beta-testers.md) activity column.

## Release notes template

```markdown
## ReviewNatin Beta vX.Y.Z (build N)

**Install:** [APK link]
**SHA-256:** [checksum]

### Fixed
- ...

### Improved
- ...

### Please test today (cohort: Free)
- [ ] Signup + email OTP
- [ ] 20 Q daily limit paywall
- [ ] ...

### Known issues
- Plus subscription via web checkout only (Premium cohort; no Play Billing during APK beta)
```

## Release readiness gate (per beta build)

See also [release-readiness-checklist.md](./release-readiness-checklist.md).

- [ ] `npm run mobile:test` passes
- [ ] **Guest cohort** smoke on 1 device
- [ ] **Free cohort** smoke on 1 device (OTP → practice → limit)
- [ ] **Premium cohort** smoke on 1 device (web checkout → no ads)
- [ ] Offline: airplane mode quiz → reconnect sync (Free or Premium)
- [ ] Zero new P0 Sentry crashes in 24h post-release
- [ ] [beta-audit-matrix.md](./beta-audit-matrix.md) updated for changed flows
- [ ] Release notes posted to testers

## Transition to Play Console

When Play internal testing is ready, see [play-console-migration.md](./play-console-migration.md).
