#!/usr/bin/env node
/**
 * Physical-device audit for 12 beta tester personas (Guest / Free / Premium).
 *
 * Runs adb spot-checks + optional Maestro on a connected phone (USB or wireless).
 * Updates dist/beta/last-device-audit-report.json and audit/android-device-beta-audit-*.md
 *
 * Usage:
 *   node scripts/adb-wireless-pair.mjs --pair IP:PORT --code 123456 --connect IP:PORT
 *   npm run beta:device-audit -- --apk dist/beta/reviewnatin-beta-v36.apk
 *   npm run beta:device-audit -- --device 192.168.1.5:5555 --skip-maestro
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { BETA_AI_PERSONAS } from './lib/beta-ai-personas.mjs';
import { adbDevice, deviceInfo, deviceKind, listAdbDevices } from './lib/adb-device.mjs';
import {
  assertColdVerifyEmailDeeplink,
  clearAppForMaestro,
  disableAnimations,
  dumpUiXml,
  ensureMaestroCli,
  ensureMaestroDriver,
  keepScreenAwake,
  maestroEnv,
  probeMaestroWireless,
  resetMaestroDriver,
  waitForAdbDevice,
  warmupApp,
} from './lib/maestro-driver.mjs';
import { REPO_ROOT } from './lib/supabase-env.mjs';
import {
  personaResultsFromAutomation,
  runAutomatedPersonaChecks,
  openDeeplinkCold,
} from './lib/device-audit-automation.mjs';

const args = process.argv.slice(2);
const skipMaestro = args.includes('--skip-maestro') || args.includes('--adb-only');
const adbOnly = args.includes('--adb-only');
const legacyMaestro = args.includes('--legacy-maestro');
const skipInstall = args.includes('--skip-install');
const PACKAGE = 'ph.reviewnatin.app';
const DIST = join(REPO_ROOT, 'dist/beta');
const AUDIT = join(REPO_ROOT, 'audit');
const SCREENSHOTS = join(AUDIT, 'screenshots', 'device-beta-audit');

function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
}

function resolveApk() {
  const explicit = arg('--apk');
  if (explicit) {
    const full = join(REPO_ROOT, explicit);
    if (!existsSync(full)) throw new Error(`APK not found: ${full}`);
    return full;
  }
  const candidates = existsSync(DIST)
    ? readdirSync(DIST)
        .filter((f) => f.endsWith('.apk'))
        .map((f) => ({ path: join(DIST, f), mtime: statSync(join(DIST, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)
    : [];
  if (candidates[0]) return candidates[0].path;
  throw new Error('Pass --apk path/to/reviewnatin.apk');
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function installApk(apkPath, serial) {
  run(`adb -s ${serial} uninstall ${PACKAGE} 2>/dev/null || true`);
  run(`adb -s ${serial} install -r "${apkPath}"`);
  run(`adb -s ${serial} shell monkey -p ${PACKAGE} -c android.intent.category.LAUNCHER 1`);
  run('sleep 3');
}

function screenshot(serial, name) {
  mkdirSync(SCREENSHOTS, { recursive: true });
  const path = join(SCREENSHOTS, name);
  execSync(`adb -s ${serial} exec-out screencap -p > "${path}"`, { stdio: 'inherit' });
  return path.replace(REPO_ROOT + '/', '');
}

function runFullAutomationAudit(serial) {
  console.log('\n▶ Full automated 12-persona audit (adb UI automation)');
  const automation = runAutomatedPersonaChecks(serial);
  const byId = personaResultsFromAutomation(automation);

  const personas = BETA_AI_PERSONAS.map((p) => {
    const result = byId[p.id] ?? { automated: 'fail', evidence: [] };
    const checkKeys = Object.keys(automation.checks).filter(
      (k) => k === p.id || k.startsWith(`${p.id}_`),
    );
    return {
      personaId: p.id,
      name: p.name,
      cohort: p.cohort,
      examFocus: p.examFocus,
      automated: result.automated,
      manual: 'n/a',
      manualChecks: [],
      automatedChecks: checkKeys.map((k) => ({
        id: k,
        ok: automation.checks[k]?.ok ?? false,
        missing: automation.checks[k]?.missing ?? [],
      })),
      evidence: result.evidence,
      verifyEmail:
        p.id === 'F1'
          ? {
              ok: automation.checks.F1?.ok ?? false,
              screen: automation.checks.F1?.ok ? 'verify-email' : 'unknown',
              method: 'adb-full-automation',
            }
          : undefined,
    };
  });

  openDeeplinkCold(serial, 'reviewnatin://subscribe', 6);
  const shot = screenshot(serial, 'subscribe-deeplink.png');
  const xml = dumpUiXml(serial);
  const forbidden = ['Pay with GCash', 'reviewnatinph.com/checkout', 'Upload Proof'];
  const hits = forbidden.filter((s) => xml.includes(s));
  const paywallSpotCheck = {
    ok:
      (/Unlock ReviewNatin Premium|Mag-log in para mag-subscribe|Sign in to continue/i.test(xml) ||
        /Subscribe|Premium/i.test(xml)) &&
      hits.length === 0,
    shot,
    forbiddenHits: hits,
    sample: xml.slice(0, 200),
  };

  return { personas, paywallSpotCheck, adbChecks: automation.checks, mode: 'physical-device-full-auto' };
}

function runMaestroFlow(maestro, flow, serial) {
  const runFlow = () => {
    execSync(`${maestro} test apps/mobile/.maestro/flows/${flow}`, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: maestroEnv(),
      timeout: 180_000,
    });
  };
  try {
    waitForAdbDevice(serial, 90);
    resetMaestroDriver(serial);
    clearAppForMaestro(serial, PACKAGE);
    warmupApp(serial, PACKAGE);
    runFlow();
    return 'pass';
  } catch (err) {
    console.warn(`  Maestro ${flow} failed (${err.message ?? err}), retrying…`);
    try {
      waitForAdbDevice(serial, 90);
      resetMaestroDriver(serial);
      warmupApp(serial, PACKAGE);
      runFlow();
      return 'pass-retry';
    } catch {
      return 'fail';
    }
  }
}

function uiDump(serial) {
  return dumpUiXml(serial);
}

function openDeeplink(serial, url, waitSec = 6) {
  run(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "${url}"`);
  run(`sleep ${waitSec}`);
}

function spotCheckSubscribePaywall(serial) {
  openDeeplink(serial, 'reviewnatin://subscribe');
  const shot = screenshot(serial, 'subscribe-deeplink.png');
  const xml = uiDump(serial);
  const forbidden = ['Pay with GCash', 'reviewnatinph.com/checkout', 'Upload Proof'];
  const hits = forbidden.filter((s) => xml.includes(s));
  const ok =
    (/Unlock ReviewNatin Premium|Mag-log in para mag-subscribe|Sign in to continue/i.test(xml) ||
      /Subscribe|Premium/i.test(xml)) &&
    hits.length === 0;
  return { ok, shot, forbiddenHits: hits, sample: xml.slice(0, 200) };
}

/** Single-session adb cohort checks (no Maestro, no repeated pm clear). */
function runAdbCohortAudit(serial) {
  const checks = {};
  waitForAdbDevice(serial, 120);
  clearAppForMaestro(serial, PACKAGE);
  warmupApp(serial, PACKAGE);
  checks.welcome = { ok: /ReviewNatin|Get started/i.test(uiDump(serial)), shot: screenshot(serial, '01-welcome.png') };

  openDeeplink(serial, 'reviewnatin://subscribe');
  checks.subscribe = spotCheckSubscribePaywall(serial);

  openDeeplink(serial, 'reviewnatin://signup');
  const signupXml = uiDump(serial);
  checks.signup = {
    ok: /Gumawa ng account|Sign up|Mag-sign up/i.test(signupXml),
    shot: screenshot(serial, '03-signup-deeplink.png'),
  };

  openDeeplink(serial, 'reviewnatin://login');
  const loginXml = uiDump(serial);
  checks.login = {
    ok: /Mag-log in|Sign in|Login/i.test(loginXml),
    shot: screenshot(serial, '04-login-deeplink.png'),
  };

  checks.verifyEmail = assertColdVerifyEmailDeeplink(PACKAGE, serial);
  checks.verifyEmail.shot = screenshot(serial, '05-verify-email-cold.png');

  openDeeplink(serial, 'reviewnatin://practice');
  checks.practice = {
    ok: /Practice|Mag-review|Quiz/i.test(uiDump(serial)),
    shot: screenshot(serial, '06-practice-deeplink.png'),
  };

  return checks;
}

function personasFromAdbChecks(checks) {
  return BETA_AI_PERSONAS.map((p) => {
    let automated = 'skip';
    const evidence = [];
    if (p.id === 'G1' && checks.welcome?.ok) {
      automated = 'pass';
      evidence.push(checks.welcome.shot);
    }
    if (['G2', 'P1', 'P2', 'P3', 'P4'].includes(p.id) && checks.subscribe?.ok) {
      automated = 'pass';
      evidence.push(checks.subscribe.shot);
    }
    if (p.id === 'G3' && checks.welcome?.ok && checks.practice?.ok) {
      automated = 'pass';
      evidence.push(checks.welcome.shot, checks.practice.shot);
    }
    if (p.id === 'G4' && checks.welcome?.ok) {
      automated = 'partial';
      evidence.push(checks.welcome.shot);
    }
    if (p.id === 'F1') {
      if (checks.signup?.ok) evidence.push(checks.signup.shot);
      if (checks.verifyEmail?.ok) automated = 'pass';
      else if (checks.verifyEmail) automated = 'partial';
    }
    if (p.id === 'F2' && checks.login?.ok) {
      automated = 'partial';
      evidence.push(checks.login.shot);
    }
    if (['F3', 'F4'].includes(p.id) && checks.signup?.ok) {
      automated = 'partial';
      evidence.push(checks.signup.shot);
    }
    if (p.flows?.length && automated === 'skip') automated = 'partial';
    return {
      personaId: p.id,
      name: p.name,
      cohort: p.cohort,
      examFocus: p.examFocus,
      automated,
      manual: p.manualChecks.length ? 'pending' : 'n/a',
      manualChecks: p.manualChecks,
      evidence,
      verifyEmail: p.deeplinkVerifyEmail ? checks.verifyEmail : undefined,
    };
  });
}

function auditPersona(persona, ctx) {
  const { serial, maestro, skipMaestro: noMaestro } = ctx;
  console.log(`\n▶ Persona ${persona.id} (${persona.name}) · ${persona.cohort}`);
  const flows = [];
  if (!noMaestro && persona.flows?.length) {
    for (const flow of persona.flows) {
      console.log(`  → Maestro: ${flow}`);
      flows.push({ flow, status: runMaestroFlow(maestro, flow, serial) });
    }
  }
  let deeplink = null;
  if (persona.deeplinkVerifyEmail) {
    const verifyFlow = flows.find(
      (f) => f.flow === 'free-signup-path.yaml' || f.flow === 'deeplink-verify-email.yaml'
    );
    if (verifyFlow?.status.startsWith('pass')) {
      deeplink = { ok: true, screen: 'verify-email', method: verifyFlow.flow };
    } else {
      deeplink = assertColdVerifyEmailDeeplink(PACKAGE, serial);
    }
  }
  let paywall = null;
  if (persona.cohort === 'premium' || persona.id === 'G2') {
    paywall = spotCheckSubscribePaywall(serial);
  }
  const flowFail = flows.some((f) => f.status === 'fail');
  const deeplinkFail = deeplink && !deeplink.ok;
  const paywallFail = paywall && !paywall.ok;
  const automatedOk = !flowFail && !deeplinkFail && !paywallFail;
  const automated = automatedOk ? 'pass' : flows.length || deeplink || paywall ? 'fail' : 'skip';
  console.log(`✓ Persona ${persona.id}: ${automated}`);
  return {
    personaId: persona.id,
    name: persona.name,
    cohort: persona.cohort,
    examFocus: persona.examFocus,
    flows,
    deeplink,
    paywall,
    manualChecks: persona.manualChecks,
    automated,
    manual: persona.manualChecks.length ? 'pending' : 'n/a',
  };
}

function writeAuditMarkdown(report) {
  const date = report.finishedAt.slice(0, 10);
  const path = join(AUDIT, `android-device-beta-audit-${date}.md`);
  const lines = [
    `# Android Physical Device Beta Audit — ${date}`,
    '',
    `**Device:** ${report.device.model ?? report.device.serial} · Android ${report.device['ro.build.version.release'] ?? '?'} (API ${report.device['ro.build.version.sdk'] ?? '?'})`,
    `**Connection:** ${report.device.kind} · \`${report.device.serial}\``,
    `**APK:** build ${report.build} · SHA-256 \`${report.sha256.slice(0, 16)}…\``,
    `**Roster:** [beta-testers.md](../docs/beta-testers.md)`,
    '',
    '## 12-persona results',
    '',
    '| Persona | Cohort | Automated | Manual pending |',
    '|---------|--------|-----------|----------------|',
    ...report.personas.map(
      (p) =>
        `| ${p.name} (${p.personaId}) | ${p.cohort} | ${p.automated} | ${p.manual === 'n/a' ? '—' : p.manualChecks.join('; ')} |`,
    ),
    '',
    '## Premium paywall spot-check',
    '',
    report.paywallSpotCheck
      ? `- Subscribe deeplink: ${report.paywallSpotCheck.ok ? '**PASS**' : '**FAIL**'} (${report.paywallSpotCheck.shot})`
      : '- Not run',
    '',
    `Report JSON: \`dist/beta/last-device-audit-report.json\``,
  ];
  writeFileSync(path, lines.join('\n'));
  return path.replace(REPO_ROOT + '/', '');
}

function main() {
  mkdirSync(DIST, { recursive: true });
  const deviceArg = arg('--device');
  const serial = adbDevice(deviceArg);
  const info = deviceInfo(serial);
  console.log('Device:', info);

  const apkPath = resolveApk();
  const build = basename(apkPath).match(/v(\d+)/)?.[1] ?? '?';
  const sha = sha256(apkPath);

  if (!skipInstall) installApk(apkPath, serial);
  waitForAdbDevice(serial, 120);
  keepScreenAwake(serial);
  disableAnimations(serial);

  let personas;
  let paywallSpotCheck;
  let adbChecks;
  let mode;

  if (legacyMaestro && !adbOnly) {
    const maestro = skipMaestro ? null : ensureMaestroCli();
    if (maestro) ensureMaestroDriver(serial);
    personas = BETA_AI_PERSONAS.map((p) => auditPersona(p, { serial, maestro, skipMaestro }));
    paywallSpotCheck = spotCheckSubscribePaywall(serial);
    mode = 'physical-device';
  } else if (adbOnly && legacyMaestro) {
    console.log('\n▶ Legacy adb-only cohort audit');
    adbChecks = runAdbCohortAudit(serial);
    paywallSpotCheck = adbChecks.subscribe;
    personas = personasFromAdbChecks(adbChecks);
    mode = 'physical-device-adb-only';
  } else {
    ({ personas, paywallSpotCheck, adbChecks, mode } = runFullAutomationAudit(serial));
  }

  const report = {
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    mode,
    device: info,
    apkPath: apkPath.replace(REPO_ROOT + '/', ''),
    build,
    sha256: sha,
    personas,
    paywallSpotCheck,
    adbChecks: adbChecks ?? undefined,
    devicesOnline: listAdbDevices(),
  };
  report.summary = {
    automatedPass: personas.filter((p) => p.automated === 'pass').length,
    automatedPartial: personas.filter((p) => p.automated === 'partial').length,
    automatedFail: personas.filter((p) => p.automated === 'fail').length,
    manualPending: personas.filter((p) => p.manual === 'pending').length,
  };
  report.ok = report.summary.automatedFail === 0 && report.summary.automatedPartial === 0;

  writeFileSync(join(DIST, 'last-device-audit-report.json'), JSON.stringify(report, null, 2));
  report.auditDoc = writeAuditMarkdown(report);

  console.log(`\nReport: dist/beta/last-device-audit-report.json`);
  console.log(`Audit: ${report.auditDoc}`);
  console.log(
    report.ok
      ? '✅ Device automated checks passed'
      : `⚠️ ${report.summary.automatedFail} persona(s) failed`,
  );

  if (!report.ok) process.exit(1);
}

main();
