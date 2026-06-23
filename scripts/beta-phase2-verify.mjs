#!/usr/bin/env node
/**
 * Verify Phase 2 (Screen Audit & Critical UX Fixes) deliverables.
 *
 * Run: npm run beta:phase2:verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const REQUIRED_FILES = [
  'docs/android-beta-program-phase-2.md',
  'docs/beta-route-audit-matrix.md',
  'apps/mobile/lib/errors/user-facing.ts',
  'apps/mobile/lib/errors/user-facing.test.ts',
  'apps/mobile/components/error-state.tsx',
  'apps/mobile/components/offline-queue-flusher.tsx',
  'apps/mobile/components/choice-option.tsx',
  'apps/mobile/components/auth-labeled-field.tsx',
  'apps/mobile/components/primary-button.tsx',
  'apps/mobile/app/(tabs)/_layout.tsx',
  'apps/mobile/lib/deep-link-routes.test.ts',
  'apps/mobile/.maestro/flows/deeplink-verify-email.yaml',
];

const ERROR_STATE_SCREENS = [
  'apps/mobile/app/(tabs)/leaderboard.tsx',
  'apps/mobile/app/mistakes/index.tsx',
  'apps/mobile/app/bookmarks/index.tsx',
  'apps/mobile/app/mock-review/[sessionId].tsx',
  'apps/mobile/app/analytics/index.tsx',
];

function scanRawAlertMessages() {
  const mobileRoot = join(REPO_ROOT, 'apps/mobile');
  const hits = [];

  function walk(dir) {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, name.name);
      if (name.isDirectory()) {
        if (name.name === 'node_modules') continue;
        walk(path);
      } else if (/\.(tsx|ts)$/.test(name.name)) {
        const src = readFileSync(path, 'utf8');
        if (/Alert\.alert\([^)]*\.message/.test(src)) {
          hits.push(path.replace(REPO_ROOT + '/', ''));
        }
      }
    }
  }

  walk(mobileRoot);
  return hits;
}

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

  console.log('Phase 2 deliverable check — ReviewNatin PH Android Beta Program\n');

  for (const rel of REQUIRED_FILES) {
    const path = join(REPO_ROOT, rel);
    if (existsSync(path)) ok(`file:${rel}`);
    else fail(`file:${rel}`, 'missing');
  }

  for (const rel of ERROR_STATE_SCREENS) {
    const path = join(REPO_ROOT, rel);
    if (!existsSync(path)) {
      fail(`error-state-screen:${rel}`, 'missing file');
      continue;
    }
    const src = readFileSync(path, 'utf8');
    if (src.includes('ErrorState') && /onRetry|loadError|setLoading\(true\)/.test(src)) {
      ok(`error-state-screen:${rel}`);
    } else {
      fail(`error-state-screen:${rel}`, 'missing ErrorState retry pattern');
    }
  }

  const rawAlerts = scanRawAlertMessages();
  if (rawAlerts.length === 0) {
    ok('lint:no-raw-alert-message');
  } else {
    fail('lint:no-raw-alert-message', rawAlerts.join(', '));
  }

  const onboarding = readFileSync(join(REPO_ROOT, 'apps/mobile/app/onboarding/index.tsx'), 'utf8');
  if (onboarding.includes('accessibilityRole') && onboarding.includes('accessibilityLabel')) {
    ok('a11y:onboarding-cards');
  } else {
    fail('a11y:onboarding-cards', 'add accessibilityRole/Label to exam cards');
  }

  const tabLayout = readFileSync(join(REPO_ROOT, 'apps/mobile/app/(tabs)/_layout.tsx'), 'utf8');
  if (tabLayout.includes('tabBarAccessibilityLabel')) {
    ok('a11y:tab-bar');
  } else {
    fail('a11y:tab-bar');
  }

  try {
    execSync('npm run mobile:test -- user-facing deep-link-routes', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    ok('mobile:test:phase2', 'user-facing + deep-link-routes');
  } catch (e) {
    fail('mobile:test:phase2', e instanceof Error ? e.message : String(e));
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    phase: 2,
    title: 'Screen Audit & Critical UX Fixes',
    checkedAt: new Date().toISOString(),
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase2-verify.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: dist/beta/phase2-verify.json`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nPhase 2 local verification passed.');
  console.log('Optional: npm run beta:maestro (emulator required)');
}

main();
