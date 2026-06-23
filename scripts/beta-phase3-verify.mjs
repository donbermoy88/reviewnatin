#!/usr/bin/env node
/**
 * Verify Phase 3 (Onboarding Redesign) deliverables.
 *
 * Run: npm run beta:phase3:verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const REQUIRED_FILES = [
  'docs/android-beta-program-phase-3.md',
  'apps/mobile/components/onboarding-step-hero.tsx',
  'apps/mobile/components/pasapath-coach-mark.tsx',
  'apps/mobile/lib/onboarding-first-practice.ts',
  'apps/mobile/lib/onboarding-first-practice.test.ts',
  'apps/mobile/lib/onboarding-activation.ts',
  'apps/mobile/lib/onboarding-nav.ts',
  'apps/mobile/lib/onboarding-store.ts',
  'apps/mobile/app/onboarding/index.tsx',
  'apps/mobile/.maestro/flows/guest-onboarding-quiz.yaml',
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

  console.log('Phase 3 deliverable check — ReviewNatin PH Android Beta Program\n');

  for (const rel of REQUIRED_FILES) {
    const path = join(REPO_ROOT, rel);
    if (existsSync(path)) ok(`file:${rel}`);
    else fail(`file:${rel}`, 'missing');
  }

  const onboarding = readFileSync(
    join(REPO_ROOT, 'apps/mobile/app/onboarding/index.tsx'),
    'utf8',
  );
  if (onboarding.includes('OnboardingStepHero') && onboarding.includes('previewReadinessPercent')) {
    ok('onboarding:step-hero-and-preview');
  } else {
    fail('onboarding:step-hero-and-preview');
  }
  if (onboarding.includes('Simulan ang unang practice') && onboarding.includes('startPractice')) {
    ok('onboarding:first-practice-cta');
  } else {
    fail('onboarding:first-practice-cta');
  }
  if (onboarding.includes('Handa ka na bang pumasa')) {
    ok('onboarding:taglish-headline');
  } else {
    fail('onboarding:taglish-headline');
  }
  if (onboarding.includes('markOnboardingActivationPending')) {
    ok('onboarding:activation-pending');
  } else {
    fail('onboarding:activation-pending');
  }

  const coach = readFileSync(
    join(REPO_ROOT, 'apps/mobile/components/pasapath-coach-mark.tsx'),
    'utf8',
  );
  if (coach.includes('Simulan ang PasaPath')) {
    ok('coach:taglish-copy');
  } else {
    fail('coach:taglish-copy');
  }

  const nav = readFileSync(join(REPO_ROOT, 'apps/mobile/lib/onboarding-nav.ts'), 'utf8');
  if (nav.includes('startPractice') && nav.includes('firstPracticeHref')) {
    ok('nav:first-practice-deeplink');
  } else {
    fail('nav:first-practice-deeplink');
  }

  const dashboard = readFileSync(join(REPO_ROOT, 'apps/mobile/app/(tabs)/index.tsx'), 'utf8');
  if (dashboard.includes('consumeOnboardingActivationPending')) {
    ok('dashboard:activation-coach');
  } else {
    fail('dashboard:activation-coach');
  }

  try {
    execSync('npm run mobile:test -- onboarding-first-practice onboarding-nav', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    ok('mobile:test:phase3');
  } catch (e) {
    fail('mobile:test:phase3', e instanceof Error ? e.message : String(e));
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    phase: 3,
    title: 'Onboarding Redesign',
    checkedAt: new Date().toISOString(),
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase3-verify.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: dist/beta/phase3-verify.json`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nPhase 3 local verification passed.');
}

main();
