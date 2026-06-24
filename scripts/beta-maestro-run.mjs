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
  clearAppForMaestro,
  ensureMaestroCli,
  ensureMaestroDriver,
  resetMaestroDriver,
  warmupApp,
} from './lib/maestro-driver.mjs';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const PACKAGE = 'ph.reviewnatin.app';
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
    clearAppForMaestro(device, PACKAGE);
    warmupApp(device, PACKAGE);

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
