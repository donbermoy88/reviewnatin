# Phase 0 — Beta Program Infrastructure

**Sprint:** Week 1, Days 1–3  
**Status:** Complete (local) — distribution to 12 testers is manual each release  
**Current ship candidate:** [Build 28](./beta-distribution-build-28.md)

Parent program: [android-beta-program.md](./android-beta-program.md)  
Next phase: [Phase 1 — Auth hardening & P0 blockers](./android-beta-program-phase-1.md)

---

## Goal

Stand up the **continuous feedback loop** before auth hardening: APK build/distribute pipeline, 12-tester roster, in-app + GitHub feedback, and daily triage SOP.

---

## Deliverables checklist

### 0.1 APK distribution pipeline

| Item | Status | Location / command |
|------|--------|-------------------|
| EAS `preview` profile (APK, internal) | ✅ | `apps/mobile/eas.json` |
| Build command documented | ✅ | `apps/mobile/BUILDING.md`, [android-beta-program.md](./android-beta-program.md) |
| Versioning (`versionCode` + git tag) | ✅ | `apps/mobile/app.json`, automate script |
| SHA-256 in release notes | ✅ | `npm run beta:automate` → `dist/beta/release-notes-build-*.md` |
| 12-tester roster (Guest / Free / Premium) | ✅ | [beta-testers.md](./beta-testers.md) |
| Cohort audit matrix | ✅ | [beta-audit-matrix.md](./beta-audit-matrix.md) |
| Automated build + Maestro gate | ✅ | `npm run beta:automate:local` |

### 0.2 Feedback collection

| Item | Status | Location |
|------|--------|----------|
| Settings → "Report a problem" | ✅ | `apps/mobile/app/(tabs)/settings.tsx` |
| Pre-filled mailto (version, device, cohort, route) | ✅ | `apps/mobile/lib/beta-feedback.ts` |
| GitHub issue template | ✅ | `.github/ISSUE_TEMPLATE/beta-feedback.yml` |
| Maestro guest feedback smoke | ✅ | `apps/mobile/.maestro/flows/guest-settings-feedback.yaml` |

### 0.3 Daily beta cycle (SOP)

| Item | Status | Location |
|------|--------|----------|
| Morning triage (P0–P3) | ✅ | [android-beta-program.md § Daily beta cycle](./android-beta-program.md#daily-beta-cycle-sop) |
| Afternoon build + cohort smokes | ✅ | Same + `npm run beta:maestro` |
| Evening Taglish release notes | ✅ | Release notes template in program doc |
| Release gate (no open P0 / crash spike) | ✅ | [release-readiness-checklist.md](./release-readiness-checklist.md) |

---

## Commands

### Local verification (required before first beta ship)

```bash
npm run beta:phase0:verify
```

Writes `dist/beta/phase0-verify.json`.

### Build and distribute to testers

```bash
# Full pipeline: bump version → EAS/local APK → Maestro → release notes
npm run beta:automate:local

# Or cloud EAS only
cd apps/mobile && npm run eas:build:android:preview
```

After build:

1. Copy APK link or upload to Drive / Firebase App Distribution.
2. Post `dist/beta/release-notes-build-*.md` to tester group (add Taglish summary).
3. Tell each tester their cohort from [beta-testers.md](./beta-testers.md).

### Cohort smokes (Maestro)

```bash
npm run beta:maestro
```

---

## Acceptance criteria

- [ ] `npm run beta:phase0:verify` passes
- [ ] All 12 testers listed with device + Android version + cohort
- [ ] Settings "Report a problem" opens mail with version/device/cohort pre-filled
- [ ] GitHub beta-feedback template usable from repo Issues
- [ ] At least one distribution doc with APK path + SHA-256 (e.g. build 28)
- [ ] Daily SOP documented and team knows P0 release gate

---

## Manual steps (each release)

1. **Share APK** — Drive/Firebase/direct link; include SHA-256 from release notes.
2. **Install instructions** — Enable "Install from unknown sources" on Android.
3. **Cohort assignment** — Each tester knows Guest / Free / Premium setup from roster.
4. **Tester channel** — Post Taglish release notes + tomorrow's cohort focus.
5. **Plus on APK beta** — Remind Premium cohort: web checkout only (no Play Billing).

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [beta-distribution-build-28.md](./beta-distribution-build-28.md) | Current ship candidate |
| [BUILDING.md](../apps/mobile/BUILDING.md) | Preview env vars + sideload limits |
| [release-readiness-checklist.md](./release-readiness-checklist.md) | Release gates |
