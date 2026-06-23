# Android Beta Testing Program — ReviewNatin PH

Continuous feedback, testing, and release workflow for **12 daily Android beta testers** (4 per cohort) distributing via direct APK (EAS `preview` profile).

**Phases:** [Phase 0 — Beta infrastructure](./android-beta-program-phase-0.md) · [Phase 1 — Auth hardening](./android-beta-program-phase-1.md) · [Phase 2 — Screen audit & UX](./android-beta-program-phase-2.md) · Phase 3+ (onboarding redesign, charts, Play migration)

Phase 0 verify: `npm run beta:phase0:verify` · Phase 1: `npm run beta:phase1:verify` · Phase 2: `npm run beta:phase2:verify` · **12 AI testers:** `npm run beta:agents`

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
| `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | Phase 1+ | Signup CAPTCHA (Cloudflare Turnstile) |

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

## Ops runbook (cloud + local)

### Phase 0 verification

Before standing up the 12-tester loop:

```bash
npm run beta:phase0:verify
```

Checklist and acceptance criteria: [android-beta-program-phase-0.md](./android-beta-program-phase-0.md).

### Phase 1 verification

Before shipping auth-related beta builds, run:

```bash
npm run beta:phase1:verify      # local files + tests
npm run beta:security:verify    # hosted Supabase security (needs .env.supabase)
```

Checklist and acceptance criteria: [android-beta-program-phase-1.md](./android-beta-program-phase-1.md).  
Current ship candidate: [beta-distribution-build-28.md](./beta-distribution-build-28.md).

### Phase 2 verification

Before shipping UX-heavy beta builds:

```bash
npm run beta:phase2:verify
npm run mobile:test -- user-facing deep-link-routes
npm run beta:maestro
```

Checklist: [android-beta-program-phase-2.md](./android-beta-program-phase-2.md) · [beta-route-audit-matrix.md](./beta-route-audit-matrix.md).

### 12 AI subagent testers (automated distribution)

All 12 roster personas are **Cursor AI subagents** — no Drive, Firebase, or chat required.

```bash
# Full: verify → Supabase cloud → local release notes → emulator → 12 persona Maestro runs
npm run beta:agents

# Cloud + release notes only (no emulator)
npm run beta:agents:cloud-only

# Reuse build 28 APK
npm run beta:agents -- --apk dist/beta/reviewnatin-beta-v28.apk --skip-cloud
```

Outputs:

- `dist/beta/last-ai-testers-report.json` — aggregate pass/fail per persona
- `dist/beta/agent-reports/G1-mara-santos.json` — per-agent detail
- `dist/beta/ai-testers-distribution-build-N.md` — local `file://` APK + Taglish
- `dist/beta/release-notes-taglish-build-N.txt` — copy for agent channel

Persona definitions: `scripts/lib/beta-ai-personas.mjs`.

### One-command automation (recommended)

Runs tests → Supabase OTP prod → auth migrations → EAS preview APK → emulator install → Maestro smokes → release notes.

```bash
npm run beta:automate
```

Options:
- `--skip-build` — reuse latest APK in `dist/beta/`
- `--skip-emulator` — skip adb install + Maestro
- `--skip-push` — do not auto-commit versionCode bump

CI: GitHub Actions workflow **Android Beta Release** (`workflow_dispatch`) with secrets `EXPO_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`.

Output: `dist/beta/last-automation-report.json`, `dist/beta/release-notes-build-*.md`, APK artifact.

### Manual steps (if automation blocked)

Run after each beta release cycle or when onboarding new testers.

### Local verification

```bash
npm run mobile:test
cd apps/mobile && npm run typecheck
```

### Supabase (hosted project)

Requires `.env.supabase` with `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`.

```bash
# Enable email OTP (disable auto-confirm) + OTP templates + password min 8
npm run supabase:auth:prod

# Turnstile CAPTCHA on signup (needs TURNSTILE_SECRET_KEY in .env.supabase)
npm run supabase:captcha

# SMTP for OTP delivery (automated — no dashboard clicks)
npm run supabase:resend:setup   # one-time: Resend API key + reviewnatinph.com DNS
npm run supabase:smtp           # re-apply after key is in .env.supabase
```

```bash
# Apply auth migrations (rate limits, login events, disposable email RPC)
npm run beta:migrations
```

If migrations fail, apply manually in Supabase SQL editor:
- `20260622120000_auth_rate_limits.sql`
- `20260622120001_auth_login_events.sql`
- `20260622120002_auth_login_rpc.sql`
- `20260622130000_grant_disposable_email_check.sql`

Add `RESEND_API_KEY` to `.env.supabase` (see `.env.supabase.example`). Domain `reviewnatinph.com` must be verified in Resend for beta testers to receive OTP.

### EAS preview APK (12 testers)

Requires `eas login` and env vars in EAS `preview` profile.

```bash
cd apps/mobile
# Bump android.versionCode in app.json first
npm run eas:build:android:preview
```

Download APK from EAS dashboard → distribute with SHA-256 in release notes.

### Emulator audit (optional)

```bash
adb devices
adb shell am start -a android.intent.action.VIEW -d "reviewnatin://subscribe" ph.reviewnatin.app
```

See [audit/android-emulator-beta-audit-2026-06-22.md](../audit/android-emulator-beta-audit-2026-06-22.md).

### Maestro cohort smokes (when CLI installed)

```bash
curl -Ls https://get.maestro.mobile.dev | bash
maestro test apps/mobile/.maestro/flows/
```

## Transition to Play Console

When Play internal testing is ready, see [play-console-migration.md](./play-console-migration.md).
