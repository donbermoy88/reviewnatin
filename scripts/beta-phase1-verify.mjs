#!/usr/bin/env node
/**
 * Verify Phase 1 (P0 Blockers & Auth Hardening) deliverables are present and tests pass.
 *
 * Run: npm run beta:phase1:verify
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const REQUIRED_FILES = [
  'docs/android-beta-program.md',
  'docs/beta-testers.md',
  'docs/beta-audit-matrix.md',
  'docs/release-readiness-checklist.md',
  'docs/beta-distribution-build-28.md',
  '.github/ISSUE_TEMPLATE/beta-feedback.yml',
  'apps/mobile/app/(auth)/verify-email.tsx',
  'apps/mobile/providers/email-verification-gate.tsx',
  'apps/mobile/lib/auth/login-lockout.ts',
  'apps/mobile/lib/auth/login-events.ts',
  'apps/mobile/lib/auth/disposable-email.ts',
  'apps/mobile/lib/auth/password-strength.ts',
  'apps/mobile/lib/beta-feedback.ts',
  'apps/mobile/components/turnstile-captcha.tsx',
  'apps/mobile/lib/initial-url.ts',
  'supabase/migrations/20260622120000_auth_rate_limits.sql',
  'supabase/migrations/20260622120001_auth_login_events.sql',
  'supabase/migrations/20260622120002_auth_login_rpc.sql',
  'scripts/configure-supabase-auth.mjs',
  'scripts/configure-supabase-smtp.mjs',
  'scripts/beta-apply-auth-migrations.mjs',
  'scripts/beta-automate-all.mjs',
  'scripts/configure-supabase-captcha.mjs',
  'scripts/beta-maestro-run.mjs',
  'docs/android-beta-program-phase-1.md',
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

  console.log('Phase 1 deliverable check — ReviewNatin PH Android Beta Program\n');

  for (const rel of REQUIRED_FILES) {
    const path = join(REPO_ROOT, rel);
    if (existsSync(path)) ok(`file:${rel}`);
    else fail(`file:${rel}`, 'missing');
  }

  try {
    execSync('npm run mobile:test', { cwd: REPO_ROOT, stdio: 'pipe' });
    ok('mobile:test', 'Vitest');
  } catch (e) {
    fail('mobile:test', e instanceof Error ? e.message : String(e));
  }

  try {
    execSync('npm run mobile:typecheck', { cwd: REPO_ROOT, stdio: 'pipe' });
    ok('mobile:typecheck');
  } catch (e) {
    fail('mobile:typecheck', e instanceof Error ? e.message : String(e));
  }

  const apk = join(REPO_ROOT, 'dist/beta/reviewnatin-beta-v28.apk');
  if (existsSync(apk)) {
    ok('dist/beta/reviewnatin-beta-v28.apk', 'current ship candidate');
  } else {
    checks.push({
      name: 'ship_apk',
      status: 'warn',
      detail: 'run npm run beta:automate:local or install build 28',
    });
    console.warn('⚠ dist/beta/reviewnatin-beta-v28.apk — not found (run beta automate to build)');
  }

  const failed = checks.filter((c) => c.status === 'fail').length;
  const report = {
    phase: 1,
    title: 'P0 Blockers & Auth Hardening',
    checkedAt: new Date().toISOString(),
    checks,
    ok: failed === 0,
  };

  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'phase1-verify.json'), JSON.stringify(report, null, 2));
  console.log(`\nReport: dist/beta/phase1-verify.json`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log('\nPhase 1 local verification passed.');
  console.log('Optional cloud checks: npm run beta:security:verify');
}

main();
