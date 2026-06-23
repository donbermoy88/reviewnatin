#!/usr/bin/env node
/**
 * Verify Phase 5 (Performance, UI consistency & subscription funnel).
 *
 * Run: npm run beta:phase5:verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const MOBILE = join(REPO_ROOT, 'apps/mobile');

const VIRTUALIZED_LIST_SCREENS = [
  'apps/mobile/app/mock-review/[sessionId].tsx',
  'apps/mobile/app/(tabs)/leaderboard.tsx',
  'apps/mobile/app/mistakes/index.tsx',
  'apps/mobile/app/bookmarks/index.tsx',
];

const REQUIRED_FILES = [
  'docs/android-beta-program-phase-5.md',
  'apps/mobile/lib/performance/defer-after-interaction.ts',
  'apps/mobile/lib/performance/perf-catalog.ts',
  'apps/mobile/lib/subscription/pricing-display.ts',
  'apps/mobile/lib/subscription/checkout-copy.ts',
  'apps/mobile/components/dashboard/free-daily-limit-strip.tsx',
  'apps/mobile/components/dashboard/home-study-insights.tsx',
  'apps/mobile/hooks/use-network-status.ts',
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

  console.log('Phase 5 deliverable check — ReviewNatin PH Android Beta Program\n');

  for (const rel of REQUIRED_FILES) {
    if (existsSync(join(REPO_ROOT, rel))) ok(`file:${rel}`);
    else fail(`file:${rel}`, 'missing');
  }

  for (const rel of VIRTUALIZED_LIST_SCREENS) {
    const path = join(REPO_ROOT, rel);
    if (!existsSync(path)) {
      fail(`flatlist:${rel}`, 'missing file');
      continue;
    }
    const src = readFileSync(path, 'utf8');
    if (src.includes('FlatList')) ok(`flatlist:${rel}`);
    else fail(`flatlist:${rel}`, 'FlatList not found');
  }

  const network = readFileSync(join(MOBILE, 'hooks/use-network-status.ts'), 'utf8');
  if (network.includes('FAILURES_BEFORE_OFFLINE = 2')) ok('perf:network-debounce');
  else fail('perf:network-debounce');

  const layout = readFileSync(join(MOBILE, 'app/_layout.tsx'), 'utf8');
  if (layout.includes('runAfterInteractions') && layout.includes('initializeMobileAds')) {
    ok('perf:defer-admob');
  } else {
    fail('perf:defer-admob');
  }

  const home = readFileSync(join(MOBILE, 'app/(tabs)/index.tsx'), 'utf8');
  if (home.includes('runAfterInteractions') && home.includes('FreeDailyLimitStrip') && home.includes('HomeStudyInsights')) {
    ok('dashboard:phase5-sections');
  } else {
    fail('dashboard:phase5-sections');
  }

  const entitlements = readFileSync(join(MOBILE, 'lib/api/entitlements.ts'), 'utf8');
  if (!entitlements.includes('CANONICAL_PRODUCT_PRICING')) ok('subscription:db-pricing-only');
  else fail('subscription:db-pricing-only', 'hardcoded pricing map still present');

  const subscribe = readFileSync(join(MOBILE, 'app/subscribe/index.tsx'), 'utf8');
  if (subscribe.includes('WEB_CHECKOUT_BETA_BANNER') && subscribe.includes('resolveProductPrice')) {
    ok('subscribe:checkout-copy');
  } else {
    fail('subscribe:checkout-copy');
  }

  const countdown = readFileSync(join(MOBILE, 'components/exam-countdown-card.tsx'), 'utf8');
  if (countdown.includes('onPlusPress') && countdown.includes('EXAM_COUNTDOWN_PLUS_CTA')) {
    ok('subscribe:exam-countdown-cta');
  } else {
    fail('subscribe:exam-countdown-cta');
  }

  try {
    execSync('npm run mobile:test -- perf-catalog pricing-display checkout-copy defer', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    ok('mobile:test:phase5');
  } catch (e) {
    fail('mobile:test:phase5', e instanceof Error ? e.message : String(e));
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    phase: 5,
    title: 'Performance, UI Consistency & Subscription Funnel',
    checkedAt: new Date().toISOString(),
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase5-verify.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: dist/beta/phase5-verify.json`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nPhase 5 local verification passed.');
  console.log('Next: npm run beta:automate on build 34+ for Maestro + distribution.');
}

main();
