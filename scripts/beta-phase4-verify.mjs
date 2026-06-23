#!/usr/bin/env node
/**
 * Verify Phase 4 (Analytics, Dashboard Charts & Microinteractions).
 *
 * Run: npm run beta:phase4:verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const MOBILE = join(REPO_ROOT, 'apps/mobile');

const REQUIRED_FILES = [
  'docs/android-beta-program-phase-4.md',
  'docs/analytics-posthog.md',
  'apps/mobile/providers/analytics-provider.tsx',
  'apps/mobile/lib/analytics/events.ts',
  'apps/mobile/lib/analytics/posthog.ts',
  'apps/mobile/lib/analytics/funnel-catalog.ts',
  'apps/mobile/lib/analytics/insights.ts',
  'apps/mobile/components/analytics/study-trend-chart.tsx',
  'apps/mobile/components/analytics/subject-strength-chart.tsx',
  'apps/mobile/components/analytics/posthog-screen-tracker.tsx',
  'apps/mobile/components/skeleton.tsx',
  'apps/mobile/hooks/use-reduced-motion.ts',
  'apps/mobile/app/(tabs)/index.tsx',
  'apps/mobile/app/analytics/index.tsx',
];

const FUNNEL_EVENTS = [
  'registration_started',
  'otp_sent',
  'otp_verified',
  'onboarding_completed',
  'practice_started',
  'practice_completed',
  'mock_exam_started',
  'mock_exam_completed',
  'flashcard_session',
  'ai_tutor_message',
  'subscription_viewed',
  'checkout_started',
  'subscription_active',
  'daily_active',
  'dashboard_charts_viewed',
  'analytics_screen_opened',
];

function readMobileSources() {
  const chunks = [];
  function walk(dir) {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules') continue;
        walk(path);
      } else if (/\.(tsx|ts)$/.test(ent.name)) {
        chunks.push(readFileSync(path, 'utf8'));
      }
    }
  }
  walk(MOBILE);
  return chunks.join('\n');
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

  console.log('Phase 4 deliverable check — ReviewNatin PH Android Beta Program\n');

  for (const rel of REQUIRED_FILES) {
    const path = join(REPO_ROOT, rel);
    if (existsSync(path)) ok(`file:${rel}`);
    else fail(`file:${rel}`, 'missing');
  }

  const mobileSrc = readMobileSources();

  for (const event of FUNNEL_EVENTS) {
    const needle = `trackEvent('${event}'`;
    const alt = `track('${event}'`;
    if (mobileSrc.includes(needle) || mobileSrc.includes(alt)) {
      ok(`funnel:${event}`);
    } else {
      fail(`funnel:${event}`, 'no trackEvent call found');
    }
  }

  const home = readFileSync(join(MOBILE, 'app/(tabs)/index.tsx'), 'utf8');
  if (home.includes('StudyTrendChart') && home.includes('AnalyticsInsightCards') && home.includes('RefreshControl')) {
    ok('dashboard:charts-and-refresh');
  } else {
    fail('dashboard:charts-and-refresh');
  }

  const btn = readFileSync(join(MOBILE, 'components/primary-button.tsx'), 'utf8');
  if (btn.includes('useReducedMotion') && btn.includes('Haptics')) {
    ok('micro:primary-button');
  } else {
    fail('micro:primary-button');
  }

  const leaderboard = readFileSync(join(MOBILE, 'app/(tabs)/leaderboard.tsx'), 'utf8');
  if (leaderboard.includes('Skeleton') && leaderboard.includes('RefreshControl')) {
    ok('micro:leaderboard-skeleton-refresh');
  } else {
    fail('micro:leaderboard-skeleton-refresh');
  }

  try {
    execSync('npm run mobile:test -- funnel-catalog insights posthog', {
      cwd: REPO_ROOT,
      stdio: 'pipe',
    });
    ok('mobile:test:phase4');
  } catch (e) {
    fail('mobile:test:phase4', e instanceof Error ? e.message : String(e));
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    phase: 4,
    title: 'Analytics, Dashboard Charts & Microinteractions',
    checkedAt: new Date().toISOString(),
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase4-verify.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: dist/beta/phase4-verify.json`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nPhase 4 local verification passed.');
  console.log('Optional: set EXPO_PUBLIC_POSTHOG_API_KEY on EAS preview and smoke funnels in PostHog.');
}

main();
