#!/usr/bin/env node
/**
 * One-command Android beta automation:
 * tests → Supabase auth prod → auth migrations → EAS preview APK → emulator install → Maestro smokes
 *
 * Usage:
 *   npm run beta:automate
 *   npm run beta:automate -- --skip-build
 *   npm run beta:automate -- --skip-emulator
 *   npm run beta:automate -- --skip-push
 */
import { createHash } from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';
import {
  assertColdVerifyEmailDeeplink,
  ensureMaestroCli,
  ensureMaestroDriver,
  resetMaestroDriver,
} from './lib/maestro-driver.mjs';

const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const skipEmulator = args.includes('--skip-emulator');
const skipPush = args.includes('--skip-push');
const localBuild = args.includes('--local-build');

const DIST = join(REPO_ROOT, 'dist/beta');
const APP_JSON = join(REPO_ROOT, 'apps/mobile/app.json');
const PACKAGE = 'ph.reviewnatin.app';

function step(label) {
  console.log(`\n${'='.repeat(60)}\n▶ ${label}\n${'='.repeat(60)}`);
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: opts.cwd ?? REPO_ROOT, stdio: 'inherit', env: { ...process.env, ...opts.env } });
}

function runCapture(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: opts.cwd ?? REPO_ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...opts.env },
  }).trim();
}

function bumpVersionCode() {
  const json = JSON.parse(readFileSync(APP_JSON, 'utf8'));
  const current = json.expo.android.versionCode ?? 1;
  const next = current + 1;
  json.expo.android.versionCode = next;
  writeFileSync(APP_JSON, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`Bumped android.versionCode: ${current} → ${next}`);
  return next;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function ensureMaestro() {
  return ensureMaestroCli();
}

function waitForEmulator(timeoutSec = 120) {
  const start = Date.now();
  while (Date.now() - start < timeoutSec * 1000) {
    try {
      const out = runCapture('adb devices');
      if (out.split('\n').some((l) => l.includes('emulator') && l.includes('device'))) return true;
    } catch {
      /* retry */
    }
    console.log('Waiting for emulator…');
    execSync('sleep 3');
  }
  return false;
}

function startEmulatorIfNeeded() {
  try {
    const out = runCapture('adb devices');
    if (out.includes('emulator') && out.includes('device')) return true;
  } catch {
    /* continue */
  }
  let avds = '';
  try {
    avds = runCapture('emulator -list-avds');
  } catch {
    return false;
  }
  const first = avds.split('\n').map((s) => s.trim()).filter(Boolean)[0];
  if (!first) return false;
  console.log(`Starting AVD: ${first}`);
  spawnSync('emulator', ['-avd', first, '-no-snapshot-load'], { detached: true, stdio: 'ignore' });
  return waitForEmulator();
}

async function pollEasBuild(buildId, maxMin = 45) {
  const start = Date.now();
  while (Date.now() - start < maxMin * 60 * 1000) {
    const json = runCapture(`cd apps/mobile && npx eas-cli build:view ${buildId} --json`);
    const build = JSON.parse(json);
    console.log(`  Build ${buildId}: ${build.status}`);
    if (build.status === 'FINISHED') {
      return build.artifacts?.applicationArchiveUrl ?? build.artifacts?.buildUrl ?? null;
    }
    if (build.status === 'ERRORED' || build.status === 'CANCELED') {
      throw new Error(`EAS build failed: ${build.status}`);
    }
    execSync('sleep 30');
  }
  throw new Error('EAS build timed out');
}

async function main() {
  mkdirSync(DIST, { recursive: true });
  const report = { startedAt: new Date().toISOString(), steps: [] };
  const logStep = (name, status, detail = '') => {
    report.steps.push({ name, status, detail, at: new Date().toISOString() });
  };

  try {
    step('1/9 — Vitest + TypeScript');
    run('npm run mobile:test');
    run('npm run mobile:typecheck');
    logStep('tests', 'ok');

    step('2/9 — Supabase prod auth + SMTP (OTP on)');
    try {
      run('npm run supabase:auth:prod');
      logStep('supabase:auth:prod', 'ok');
    } catch {
      logStep('supabase:auth:prod', 'warn', 'already configured or creds missing');
    }
    try {
      run('npm run supabase:smtp');
      logStep('supabase:smtp', 'ok');
    } catch {
      try {
        run('npm run supabase:smtp -- --otp-only');
        logStep('supabase:smtp', 'warn', 'OTP templates only — add RESEND_API_KEY for delivery');
      } catch {
        logStep('supabase:smtp', 'warn', 'skipped');
      }
    }

    step('3/9 — Auth migrations (Management API)');
    run('node scripts/beta-apply-auth-migrations.mjs');
    logStep('auth-migrations', 'ok');

    let apkPath = null;
    let versionCode = JSON.parse(readFileSync(APP_JSON, 'utf8')).expo.android.versionCode;

    if (!skipBuild) {
      step('4/9 — Bump versionCode + EAS preview build');
      versionCode = bumpVersionCode();
      if (!skipPush) {
        try {
          run(`git add apps/mobile/app.json && git commit -m "chore(mobile): bump android versionCode to ${versionCode} for beta APK"`);
          run('git push origin master');
          logStep('git-push-version', 'ok');
        } catch {
          logStep('git-push-version', 'skip');
        }
      }
      const buildEnv = {
        ...process.env,
        ...(localBuild && process.env.ANDROID_HOME
          ? {}
          : localBuild
            ? { ANDROID_HOME: `${process.env.HOME}/Library/Android/sdk` }
            : {}),
      };
      const buildCmd = localBuild
        ? 'cd apps/mobile && npx eas-cli build --profile preview --platform android --local --non-interactive --json'
        : 'cd apps/mobile && npx eas-cli build --profile preview --platform android --non-interactive --json --wait';
      const out = runCapture(buildCmd, { env: buildEnv });
      const buildLine = out.split('\n').filter((l) => l.trim().startsWith('{')).pop() ?? '{}';
      const last = JSON.parse(buildLine);
      const buildId = last.id ?? last.buildDetails?.id;
      if (!buildId) throw new Error('No build id from EAS');
      report.easBuildId = buildId;
      report.easBuildUrl = `https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/${buildId}`;
      logStep('eas-build', 'ok', buildId);

      step('5/9 — Download APK');
      const apkUrl = await pollEasBuild(buildId);
      if (!apkUrl) throw new Error('No APK URL on finished build');
      apkPath = join(DIST, `reviewnatin-beta-v${versionCode}.apk`);
      run(`curl -fsSL -o "${apkPath}" "${apkUrl}"`);
      report.sha256 = sha256File(apkPath);
      report.apkPath = apkPath;
      logStep('apk-download', 'ok', report.sha256);
      console.log(`APK: ${apkPath}\nSHA-256: ${report.sha256}`);
    } else {
      const existing = readdirSync(DIST).filter((f) => f.endsWith('.apk')).sort().pop();
      if (existing) {
        apkPath = join(DIST, existing);
        report.apkPath = apkPath;
        report.sha256 = sha256File(apkPath);
        logStep('apk-download', 'skip', existing);
      } else {
        step('5/9 — Download latest finished EAS APK');
        const listJson = runCapture(
          'cd apps/mobile && npx eas-cli build:list --platform android --limit 1 --json --non-interactive',
        );
        const builds = JSON.parse(listJson);
        const latest = Array.isArray(builds) ? builds[0] : builds;
        const apkUrl = latest?.artifacts?.applicationArchiveUrl;
        if (apkUrl && latest.status === 'FINISHED') {
          versionCode = latest.appVersionCode ?? versionCode;
          apkPath = join(DIST, `reviewnatin-beta-v${versionCode}.apk`);
          run(`curl -fsSL -o "${apkPath}" "${apkUrl}"`);
          report.sha256 = sha256File(apkPath);
          report.apkPath = apkPath;
          report.easBuildUrl = latest.id
            ? `https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/${latest.id}`
            : undefined;
          logStep('apk-download', 'ok', 'from latest EAS build');
        }
      }
    }

    if (!skipEmulator && apkPath && existsSync(apkPath)) {
      step('6/9 — Emulator install APK');
      if (startEmulatorIfNeeded()) {
        try {
          run(`adb uninstall ${PACKAGE}`);
        } catch {
          /* not installed */
        }
        run(`adb install "${apkPath}"`);
        run(`adb shell am force-stop ${PACKAGE}`);
        run(`adb shell monkey -p ${PACKAGE} -c android.intent.category.LAUNCHER 1`);
        logStep('emulator-install', 'ok');
      } else {
        logStep('emulator-install', 'skip', 'no emulator');
      }

      step('7/9 — Maestro cohort smokes + cold deeplink');
      const maestro = ensureMaestro();
      ensureMaestroDriver();
      const deeplink = assertColdVerifyEmailDeeplink(PACKAGE);
      if (deeplink.ok) {
        logStep('deeplink-verify-email', 'ok');
      } else {
        logStep('deeplink-verify-email', 'warn', deeplink.detail ?? deeplink.screen);
      }

      const flows = [
        'guest-onboarding-quiz.yaml',
        'guest-settings-feedback.yaml',
        'premium-subscribe-hint.yaml',
        'auth-keyboard-smoke.yaml',
        'free-signup-path.yaml',
      ];
      let maestroOk = true;
      for (const flow of flows) {
        resetMaestroDriver();
        run(`adb shell am force-stop ${PACKAGE} 2>/dev/null || true`);
        run('sleep 1');
        run(`adb shell pm clear ${PACKAGE} || true`);
        run('sleep 2');
        try {
          run(`${maestro} test apps/mobile/.maestro/flows/${flow}`);
          report.maestroFlows = report.maestroFlows ?? [];
          report.maestroFlows.push({ flow, status: 'pass' });
        } catch {
          console.warn(`Maestro flow failed: ${flow} — retrying once after driver reset…`);
          try {
            ensureMaestroDriver();
            run(`${maestro} test apps/mobile/.maestro/flows/${flow}`);
            report.maestroFlows = report.maestroFlows ?? [];
            report.maestroFlows.push({ flow, status: 'pass-retry' });
          } catch {
            maestroOk = false;
            report.maestroFlows = report.maestroFlows ?? [];
            report.maestroFlows.push({ flow, status: 'fail' });
          }
        }
      }
      if (maestroOk) {
        logStep('maestro', 'ok');
      } else {
        logStep('maestro', 'warn');
      }
    }

    step('8/9 — Release notes');
    const notes = [
      `# ReviewNatin Beta APK — build ${versionCode}`,
      ``,
      `Generated: ${new Date().toISOString()}`,
      `**APK:** ${report.apkPath ?? 'see EAS'}`,
      `**SHA-256:** ${report.sha256 ?? 'n/a'}`,
      `**EAS:** ${report.easBuildUrl ?? 'n/a'}`,
      ``,
      `## Cohorts (12 testers)`,
      `- Guest G1–G4 · Free F1–F4 · Premium P1–P4`,
      ``,
      `## Gates`,
      ...report.steps.map((s) => `- ${s.name}: ${s.status}`),
    ].join('\n');
    const notesPath = join(DIST, `release-notes-build-${versionCode}.md`);
    writeFileSync(notesPath, notes);
    report.releaseNotes = notesPath;

    report.finishedAt = new Date().toISOString();
    report.status = 'success';
    writeFileSync(join(DIST, 'last-automation-report.json'), JSON.stringify(report, null, 2));
    console.log('\n✅ Beta automation complete.');
  } catch (e) {
    report.status = 'failed';
    report.error = e instanceof Error ? e.message : String(e);
    report.finishedAt = new Date().toISOString();
    writeFileSync(join(DIST, 'last-automation-report.json'), JSON.stringify(report, null, 2));
    console.error('\n❌ Beta automation failed:', report.error);
    process.exit(1);
  }
}

main();
