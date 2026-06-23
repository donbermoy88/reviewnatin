#!/usr/bin/env node
/**
 * Verify Phase 0 (Beta Program Infrastructure) deliverables are present and tests pass.
 *
 * Run: npm run beta:phase0:verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const REQUIRED_FILES = [
  'docs/android-beta-program.md',
  'docs/android-beta-program-phase-0.md',
  'docs/beta-testers.md',
  'docs/beta-audit-matrix.md',
  'docs/release-readiness-checklist.md',
  '.github/ISSUE_TEMPLATE/beta-feedback.yml',
  'apps/mobile/lib/beta-feedback.ts',
  'apps/mobile/app/(tabs)/settings.tsx',
  'apps/mobile/BUILDING.md',
  'apps/mobile/eas.json',
  'apps/mobile/app.json',
  'scripts/beta-automate-all.mjs',
  'scripts/beta-maestro-run.mjs',
  'scripts/beta-release-notes.mjs',
  'apps/mobile/.maestro/flows/guest-settings-feedback.yaml',
];

function main() {
  const checks = [];
  const ok = (name, detail = '') => {
    checks.push({ name, status: 'ok', detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const fail = (name, detail = '') => {
    checks.push({ name, status: 'fail', detail });
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  };
  const warn = (name, detail = '') => {
    checks.push({ name, status: 'warn', detail });
    console.warn(`⚠ ${name}${detail ? ` — ${detail}` : ''}`);
  };

  console.log('Phase 0 deliverable check — ReviewNatin PH Android Beta Program\n');

  for (const rel of REQUIRED_FILES) {
    const path = join(REPO_ROOT, rel);
    if (existsSync(path)) ok(`file:${rel}`);
    else fail(`file:${rel}`, 'missing');
  }

  const settingsPath = join(REPO_ROOT, 'apps/mobile/app/(tabs)/settings.tsx');
  if (existsSync(settingsPath)) {
    const settings = readFileSync(settingsPath, 'utf8');
    if (settings.includes('Report a problem') && settings.includes('openBetaFeedback')) {
      ok('settings:beta-feedback-entry');
    } else {
      fail('settings:beta-feedback-entry', 'missing Report a problem or openBetaFeedback');
    }
  }

  const feedbackPath = join(REPO_ROOT, 'apps/mobile/lib/beta-feedback.ts');
  if (existsSync(feedbackPath)) {
    const feedback = readFileSync(feedbackPath, 'utf8');
    if (feedback.includes('beta@reviewnatinph.com') && feedback.includes('buildBetaFeedbackMailto')) {
      ok('beta-feedback:mailto-context');
    } else {
      fail('beta-feedback:mailto-context', 'missing email or buildBetaFeedbackMailto');
    }
  }

  const templatePath = join(REPO_ROOT, '.github/ISSUE_TEMPLATE/beta-feedback.yml');
  if (existsSync(templatePath)) {
    const template = readFileSync(templatePath, 'utf8');
    if (template.includes('severity') && template.includes('Steps to reproduce')) {
      ok('issue-template:beta-feedback');
    } else {
      fail('issue-template:beta-feedback', 'missing required fields');
    }
  }

  const buildingPath = join(REPO_ROOT, 'apps/mobile/BUILDING.md');
  if (existsSync(buildingPath)) {
    const building = readFileSync(buildingPath, 'utf8');
    if (
      building.includes('EXPO_PUBLIC_SUPABASE_URL') &&
      building.includes('preview') &&
      building.includes('sideload')
    ) {
      ok('building:preview-env');
    } else {
      fail('building:preview-env', 'missing preview env or sideload notes');
    }
  }

  const programPath = join(REPO_ROOT, 'docs/android-beta-program.md');
  if (existsSync(programPath)) {
    const program = readFileSync(programPath, 'utf8');
    if (
      program.includes('Daily beta cycle') &&
      program.includes('Release gate') &&
      program.includes('Phase 0')
    ) {
      ok('sop:daily-beta-cycle');
    } else {
      fail('sop:daily-beta-cycle', 'missing daily SOP or Phase 0 link');
    }
  }

  const rosterPath = join(REPO_ROOT, 'docs/beta-testers.md');
  if (existsSync(rosterPath)) {
    const roster = readFileSync(rosterPath, 'utf8');
    const guest = (roster.match(/\bG[1-4]\b/g) ?? []).length;
    const free = (roster.match(/\bF[1-4]\b/g) ?? []).length;
    const premium = (roster.match(/\bP[1-4]\b/g) ?? []).length;
    if (guest >= 4 && free >= 4 && premium >= 4) {
      ok('roster:12-testers', 'G1–G4, F1–F4, P1–P4');
    } else {
      fail('roster:12-testers', `found guest=${guest} free=${free} premium=${premium}`);
    }
  }

  const distDoc = join(REPO_ROOT, 'docs/beta-distribution-build-28.md');
  if (existsSync(distDoc)) {
    ok('distribution:build-28');
  } else {
    warn('distribution:ship-doc', 'add docs/beta-distribution-build-N.md for current APK');
  }

  try {
    execSync('npm run test --workspace=apps/mobile -- beta-cohort', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    ok('mobile:test:beta-cohort', 'Vitest subset');
  } catch (e) {
    fail('mobile:test:beta-cohort', e instanceof Error ? e.message : String(e));
  }

  const apk = join(REPO_ROOT, 'dist/beta/reviewnatin-beta-v28.apk');
  if (existsSync(apk)) {
    ok('dist/beta/reviewnatin-beta-v28.apk', 'current ship candidate');
  } else {
    warn('ship_apk', 'run npm run beta:automate:local or install build 28');
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    phase: 0,
    title: 'Beta Program Infrastructure',
    checkedAt: new Date().toISOString(),
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase0-verify.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: dist/beta/phase0-verify.json`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nPhase 0 local verification passed.');
  console.log('Next: npm run beta:release-notes -- --build N --apk dist/beta/...');
}

main();
