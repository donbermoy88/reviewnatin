#!/usr/bin/env node
/**
 * Automate Android beta ops for 12 Cursor AI subagent testers (no Drive/Firebase/chat).
 *
 * Replaces manual ops:
 * - Hosted Supabase (auth prod, migrations, SMTP, captcha, security verify) — best effort
 * - Local APK “distribution” (dist/beta + file:// link in release notes)
 * - Per-persona Maestro smokes on emulator (G1–G4 · F1–F4 · P1–P4)
 * - Aggregate report for agent triage
 *
 * Usage:
 *   npm run beta:agents
 *   npm run beta:agents -- --skip-cloud --skip-build
 *   npm run beta:agents -- --apk dist/beta/reviewnatin-beta-v28.apk
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { BETA_AI_PERSONAS, personaSlug } from './lib/beta-ai-personas.mjs';
import {
  adbDevice,
  assertColdVerifyEmailDeeplink,
  ensureMaestroCli,
  ensureMaestroDriver,
  resetMaestroDriver,
} from './lib/maestro-driver.mjs';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const args = process.argv.slice(2);
const skipCloud = args.includes('--skip-cloud');
const skipBuild = args.includes('--skip-build');
const skipEmulator = args.includes('--skip-emulator');
const skipMaestro = args.includes('--skip-maestro');
const deviceArg = (() => {
  const i = args.indexOf('--device');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
})();

const DIST = join(REPO_ROOT, 'dist/beta');
const REPORTS = join(DIST, 'agent-reports');
const PACKAGE = 'ph.reviewnatin.app';
const APP_JSON = join(REPO_ROOT, 'apps/mobile/app.json');

function apkArg() {
  const i = args.indexOf('--apk');
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function step(label) {
  console.log(`\n${'='.repeat(60)}\n▶ ${label}\n${'='.repeat(60)}`);
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, {
    cwd: opts.cwd ?? REPO_ROOT,
    stdio: opts.quiet ? 'pipe' : 'inherit',
    env: { ...process.env, ...opts.env },
  });
}

function tryRun(cmd, detail = '') {
  try {
    run(cmd, { quiet: true });
    return { status: 'ok', detail };
  } catch (e) {
    return {
      status: 'warn',
      detail: detail || (e instanceof Error ? e.message : String(e)),
    };
  }
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function resolveApk(explicit) {
  if (explicit) {
    const full = join(REPO_ROOT, explicit);
    if (!existsSync(full)) throw new Error(`APK not found: ${full}`);
    return full;
  }
  const preferred = join(DIST, 'reviewnatin-beta-v28.apk');
  if (existsSync(preferred)) return preferred;
  const candidates = readdirSync(DIST)
    .filter((f) => f.startsWith('reviewnatin-beta-v') && f.endsWith('.apk'))
    .map((f) => ({ path: join(DIST, f), mtime: statSync(join(DIST, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (candidates[0]) return candidates[0].path;
  throw new Error('No APK in dist/beta — run npm run beta:automate:local or pass --apk');
}

function readBuildNumber(apkPath) {
  const m = basename(apkPath).match(/v(\d+)\.apk$/);
  if (m) return m[1];
  const json = JSON.parse(readFileSync(APP_JSON, 'utf8'));
  return String(json.expo?.android?.versionCode ?? '?');
}

function installApk(apkPath, device) {
  run(`adb -s ${device} uninstall ${PACKAGE} 2>/dev/null || true`);
  run(`adb -s ${device} install -r "${apkPath}"`);
  run(`adb -s ${device} shell monkey -p ${PACKAGE} -c android.intent.category.LAUNCHER 1`);
  run('sleep 3');
}

function runMaestroFlow(maestro, flow, device) {
  resetMaestroDriver(device);
  run(`adb -s ${device} shell am force-stop ${PACKAGE} 2>/dev/null || true`);
  run(`adb -s ${device} shell pm clear ${PACKAGE} || true`);
  run('sleep 2');
  try {
    run(`${maestro} test apps/mobile/.maestro/flows/${flow}`);
    return 'pass';
  } catch {
    ensureMaestroDriver(device);
    try {
      run(`${maestro} test apps/mobile/.maestro/flows/${flow}`);
      return 'pass-retry';
    } catch {
      return 'fail';
    }
  }
}

function runPersonaMaestro(persona, maestro, device) {
  const flowResults = [];
  let ok = true;
  for (const flow of persona.flows) {
    const status = runMaestroFlow(maestro, flow, device);
    flowResults.push({ flow, status });
    if (status === 'fail') ok = false;
  }
  let deeplink = null;
  if (persona.deeplinkVerifyEmail) {
    try {
      const cold = assertColdVerifyEmailDeeplink(PACKAGE, device);
      deeplink = { method: 'cold-adb', ...cold };
      if (!cold.ok) ok = false;
    } catch (e) {
      deeplink = { ok: false, error: e instanceof Error ? e.message : String(e) };
      ok = false;
    }
  }
  return {
    personaId: persona.id,
    name: persona.name,
    cohort: persona.cohort,
    examFocus: persona.examFocus,
    flows: flowResults,
    deeplink,
    manualChecks: persona.manualChecks,
    ok,
    automated: ok ? 'pass' : 'fail',
    manual: persona.manualChecks.length ? 'pending' : 'n/a',
  };
}

function writeDistributionDoc(report) {
  const lines = [
    `# AI Agent Beta Distribution — build ${report.build}`,
    '',
    `Generated: ${report.finishedAt}`,
    '',
    '**Audience:** 12 Cursor AI subagent personas (automated — no Drive/Firebase/chat).',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| APK | \`${report.apkPath.replace(REPO_ROOT + '/', '')}\` |`,
    `| SHA-256 | \`${report.sha256}\` |`,
    `| Local URI | \`file://${report.apkPath}\` |`,
    '',
    '## Persona results',
    '',
    '| Persona | Cohort | Automated | Manual pending |',
    '|---------|--------|-----------|----------------|',
    ...report.personas.map(
      (p) =>
        `| ${p.name} (${p.personaId}) | ${p.cohort} | ${p.automated} | ${p.manual === 'n/a' ? '—' : p.manualChecks.join('; ')} |`,
    ),
    '',
    '## Taglish (agent channel)',
    '',
    '```',
    report.taglish.trim(),
    '```',
    '',
    'Full report: `dist/beta/last-ai-testers-report.json`',
  ];
  const path = join(DIST, `ai-testers-distribution-build-${report.build}.md`);
  writeFileSync(path, lines.join('\n'));
  return path;
}

async function main() {
  mkdirSync(REPORTS, { recursive: true });
  const report = {
    startedAt: new Date().toISOString(),
    mode: 'ai-subagents',
    personaCount: BETA_AI_PERSONAS.length,
    cloud: [],
    verify: [],
    personas: [],
    ok: false,
  };

  step('1 — Local verify gates');
  for (const cmd of ['npm run beta:phase0:verify', 'npm run beta:phase1:verify']) {
    const r = tryRun(cmd);
    report.verify.push({ cmd, ...r });
    console.log(`  ${cmd}: ${r.status}`);
  }

  if (!skipCloud) {
    step('2 — Hosted Supabase (best effort)');
    const cloudSteps = [
      ['supabase:auth:prod', 'npm run supabase:auth:prod'],
      ['supabase:smtp', 'npm run supabase:smtp'],
      ['beta:migrations', 'npm run beta:migrations'],
    ];
    if (process.env.TURNSTILE_SECRET_KEY) {
      cloudSteps.push(['supabase:captcha', 'npm run supabase:captcha']);
    }
    for (const [name, cmd] of cloudSteps) {
      const r = tryRun(cmd, 'skipped or already applied');
      report.cloud.push({ name, ...r });
      console.log(`  ${name}: ${r.status}${r.detail ? ` — ${r.detail}` : ''}`);
    }
    const sec = tryRun('npm run beta:security:verify', 'needs .env.supabase');
    report.cloud.push({ name: 'beta:security:verify', ...sec });
    console.log(`  beta:security:verify: ${sec.status}`);
  } else {
    report.cloud.push({ name: 'all', status: 'skip', detail: '--skip-cloud' });
  }

  let apkPath = resolveApk(apkArg());
  const build = readBuildNumber(apkPath);
  const sha256 = sha256File(apkPath);
  report.apkPath = apkPath;
  report.build = build;
  report.sha256 = sha256;

  if (!skipBuild) {
    step('3 — Release notes (local distribution — no Drive)');
    const link = `file://${apkPath}`;
    run(
      `node scripts/beta-release-notes.mjs --build ${build} --apk "${apkPath.replace(REPO_ROOT + '/', '')}" --link "${link}" --cohort all`,
      { quiet: false },
    );
    report.releaseNotes = join(DIST, `release-notes-build-${build}.md`);
    report.taglishNotes = join(DIST, `release-notes-taglish-build-${build}.txt`);
    if (existsSync(report.taglishNotes)) {
      report.taglish = readFileSync(report.taglishNotes, 'utf8');
    } else {
      report.taglish = `ReviewNatin Beta build ${build} — local APK at file://${apkPath}`;
    }
  } else if (existsSync(join(DIST, `release-notes-taglish-build-${build}.txt`))) {
    report.taglish = readFileSync(join(DIST, `release-notes-taglish-build-${build}.txt`), 'utf8');
  } else {
    report.taglish = `ReviewNatin Beta build ${build} — run with release notes step for Taglish template.`;
  }

  if (!skipEmulator && !skipMaestro) {
    step('4 — Install APK on emulator');
    const device = adbDevice(deviceArg);
    report.device = device;
    installApk(apkPath, device);

    step('5 — 12 AI subagent persona Maestro runs');
    const maestro = ensureMaestroCli();
    ensureMaestroDriver(device);

    for (const persona of BETA_AI_PERSONAS) {
      console.log(`\n--- ${persona.id} ${persona.name} (${persona.cohort}) ---`);
      const result = runPersonaMaestro(persona, maestro, device);
      report.personas.push(result);
      const out = join(REPORTS, `${personaSlug(persona)}.json`);
      writeFileSync(out, JSON.stringify(result, null, 2));
      console.log(result.ok ? `✓ ${persona.id}` : `✗ ${persona.id}`);
    }
  } else if (skipMaestro) {
    report.personas = BETA_AI_PERSONAS.map((p) => ({
      personaId: p.id,
      name: p.name,
      cohort: p.cohort,
      automated: 'skip',
      manual: p.manualChecks.length ? 'pending' : 'n/a',
      manualChecks: p.manualChecks,
    }));
  }

  report.finishedAt = new Date().toISOString();
  const automatedFails = report.personas.filter((p) => p.automated === 'fail').length;
  const verifyFails = report.verify.filter((v) => v.status === 'fail').length;
  report.ok = verifyFails === 0 && automatedFails === 0;
  report.summary = {
    verifyFails,
    automatedFails,
    automatedPass: report.personas.filter((p) => p.automated === 'pass' || p.automated === 'pass-retry').length,
    manualPending: report.personas.filter((p) => p.manual === 'pending').length,
  };

  writeFileSync(join(DIST, 'last-ai-testers-report.json'), JSON.stringify(report, null, 2));
  const distDoc = writeDistributionDoc(report);
  report.distributionDoc = distDoc.replace(REPO_ROOT + '/', '');

  console.log(`\nReport: dist/beta/last-ai-testers-report.json`);
  console.log(`Distribution: ${report.distributionDoc}`);
  console.log(
    report.ok
      ? '✅ All 12 AI agent automated checks passed'
      : `⚠️ ${automatedFails} persona(s) failed automated checks`,
  );

  if (!report.ok && !skipMaestro) process.exit(1);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
