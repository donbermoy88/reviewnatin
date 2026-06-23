#!/usr/bin/env node
/**
 * Run Maestro cohort smokes + cold verify-email deeplink check on emulator.
 *
 * Usage:
 *   node scripts/beta-maestro-run.mjs
 *   node scripts/beta-maestro-run.mjs --no-deeplink
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  adbDevice,
  ensureMaestroCli,
  ensureMaestroDriver,
  resetMaestroDriver,
} from './lib/maestro-driver.mjs';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const PACKAGE = 'ph.reviewnatin.app';

function warmupApp(packageName = PACKAGE, device) {
  const serial = device ?? adbDevice();
  run(`adb -s ${serial} shell am force-stop ${packageName} 2>/dev/null || true`);
  run(`adb -s ${serial} shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
  run('sleep 4');
}
const skipDeeplink = process.argv.includes('--no-deeplink');
const FLOWS = [
  'guest-onboarding-quiz.yaml',
  'guest-settings-feedback.yaml',
  'premium-subscribe-hint.yaml',
  'auth-keyboard-smoke.yaml',
  'free-signup-path.yaml',
  'deeplink-verify-email.yaml',
];

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
}

function main() {
  const device = adbDevice();
  const maestro = ensureMaestroCli();
  ensureMaestroDriver(device);
  warmupApp(PACKAGE, device);

  const report = {
    startedAt: new Date().toISOString(),
    device,
    flows: [],
    deeplink: null,
  };

  if (!skipDeeplink) {
    report.deeplink = { ok: null, method: 'free-signup-path', status: 'pending' };
  }

  let allPass = true;
  for (const flow of FLOWS) {
    console.log(`\n▶ Maestro: ${flow}`);
    resetMaestroDriver(device);
    run(`adb -s ${device} shell am force-stop ${PACKAGE} 2>/dev/null || true`);
    run(`adb -s ${device} shell pm clear ${PACKAGE} || true`);
    run('sleep 2');

    let status = 'pass';
    try {
      run(`${maestro} test apps/mobile/.maestro/flows/${flow}`);
    } catch {
      status = 'fail';
      console.warn(`Retrying ${flow} after Maestro driver refresh…`);
      ensureMaestroDriver(device);
      try {
        run(`${maestro} test apps/mobile/.maestro/flows/${flow}`);
        status = 'pass-retry';
      } catch {
        status = 'fail';
        allPass = false;
      }
    }
    report.flows.push({ flow, status });
    if (flow === 'free-signup-path.yaml' && !skipDeeplink) {
      const ok = status.startsWith('pass');
      report.deeplink = { ok, method: 'free-signup-path', status };
    }
  }

  report.finishedAt = new Date().toISOString();
  report.ok = allPass && (skipDeeplink || report.deeplink?.ok !== false);
  const outDir = join(REPO_ROOT, 'dist/beta');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'last-maestro-report.json'), JSON.stringify(report, null, 2));
  console.log(`\nMaestro report: dist/beta/last-maestro-report.json`);
  console.log(report.ok ? '✅ Maestro suite complete' : '❌ Maestro suite had failures');
  if (!report.ok) process.exit(1);
}

main();
