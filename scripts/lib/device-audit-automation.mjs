/**
 * Full adb UI automation for 12-persona physical device audit (wireless-safe, no Maestro gRPC).
 */
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  adbShell,
  clearAppForMaestro,
  dumpUiXml,
  keepScreenAwake,
  waitForAdbDevice,
  warmupApp,
} from './maestro-driver.mjs';
import { REPO_ROOT } from './supabase-env.mjs';

const PACKAGE = 'ph.reviewnatin.app';
const SCREENSHOTS = join(REPO_ROOT, 'audit/screenshots/device-beta-audit');

function sleep(sec) {
  execSync(`sleep ${sec}`, { cwd: REPO_ROOT });
}

function runAdb(serial, args) {
  waitForAdbDevice(serial, 90);
  execSync(`adb -s ${serial} ${args}`, { cwd: REPO_ROOT, stdio: 'inherit' });
}

function runShell(serial, cmd) {
  adbShell(serial, cmd);
}

function decodeXmlEntities(text) {
  return text
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function normalizeUiText(text) {
  return decodeXmlEntities(text)
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[''\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function xmlContains(xml, needle) {
  const hay = normalizeUiText(xml);
  if (!needle) return false;
  if (typeof needle === 'string') {
    return hay.includes(normalizeUiText(needle));
  }
  return needle.test(decodeXmlEntities(xml));
}

function screenshot(serial, name) {
  mkdirSync(SCREENSHOTS, { recursive: true });
  const path = join(SCREENSHOTS, name);
  execSync(`adb -s ${serial} exec-out screencap -p > "${path}"`, { stdio: 'inherit' });
  return path.replace(REPO_ROOT + '/', '');
}

function dismissSystemChrome(serial) {
  runShell(serial, 'input keyevent KEYCODE_WAKEUP 2>/dev/null || true');
  runShell(serial, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
  sleep(0.25);
  runShell(serial, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
  sleep(0.25);
}

function isForeignUiDump(xml) {
  if (!xml.includes('<hierarchy')) return true;
  if (xml.includes(PACKAGE)) return false;
  return /com\.android\.systemui|NotificationShade|com\.android\.launcher|com\.bbk\.launcher/i.test(xml);
}

function ui(serial, attempts = 6, { dismiss = false } = {}) {
  for (let tryNum = 0; tryNum < 3; tryNum += 1) {
    dismissSystemChrome(serial);
    if (dismiss) dismissOverlays(serial);
    const xml = dumpUiXml(serial, attempts);
    if (!isForeignUiDump(xml)) return xml;
    sleep(0.5);
  }
  dismissSystemChrome(serial);
  return dumpUiXml(serial, attempts);
}

function dismissOverlays(serial) {
  const xml = dumpUiXml(serial, 4);
  const overlayHint =
    /permission|allow|deny|not now|later|battery|overlay|popup|dialog/i.test(xml) &&
    !xml.includes(PACKAGE);
  if (!overlayHint) return;
  runShell(serial, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
  sleep(0.3);
}

function boundsCenter(bounds) {
  const m = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  return {
    x: Math.floor((+m[1] + +m[3]) / 2),
    y: Math.floor((+m[2] + +m[4]) / 2),
  };
}

function findNode(xml, needle, { partial = true } = {}) {
  const normalizedNeedle = normalizeUiText(needle);
  const decoded = decodeXmlEntities(xml);
  const nodes = decoded.match(/<node\b[^>]*>/g) ?? [];
  for (const node of nodes) {
    const text = node.match(/\btext="([^"]*)"/)?.[1] ?? '';
    const desc = node.match(/\bcontent-desc="([^"]*)"/)?.[1] ?? '';
    const bounds = node.match(/\bbounds="(\[[^\]]+\])"/)?.[1];
    if (!bounds) continue;
    for (const raw of [text, desc]) {
      const hay = normalizeUiText(raw);
      if (!hay) continue;
      if (partial ? hay.includes(normalizedNeedle) : hay === normalizedNeedle) return bounds;
    }
  }
  return null;
}

function tapBounds(serial, bounds) {
  const c = boundsCenter(bounds);
  if (!c) return false;
  runShell(serial, `input tap ${c.x} ${c.y}`);
  sleep(0.5);
  return true;
}

export function adbTapText(serial, needle, opts = {}) {
  const { partial = true, retries = 12, scroll = false, optional = false } = opts;
  for (let i = 0; i < retries; i += 1) {
    const xml = ui(serial);
    const bounds = findNode(xml, needle, { partial });
    if (bounds && tapBounds(serial, bounds)) return true;
    if (scroll) adbSwipeUp(serial);
    sleep(0.8);
  }
  if (optional) return false;
  throw new Error(`adbTapText: not found "${needle}"`);
}

function tapWelcomeGetStarted(serial) {
  for (let i = 0; i < 10; i += 1) {
    const xml = ui(serial);
    const bounds = findNode(xml, 'Get started', { partial: true });
    if (bounds && tapBounds(serial, bounds)) {
      sleep(1);
      if (xmlContains(ui(serial), 'Anong exam ang nire-review mo')) return;
    }
    if (xmlContains(xml, 'Handa ka na bang pumasa')) {
      runShell(serial, 'input tap 540 1512');
      sleep(1.5);
      if (xmlContains(ui(serial), 'Anong exam ang nire-review mo')) return;
    }
    sleep(1);
  }
  throw new Error('adbTapText: not found "Get started"');
}

function adbSwipeUp(serial) {
  runShell(serial, 'input swipe 540 1800 540 800 350');
  sleep(0.5);
}

export function openDeeplinkCold(serial, url, waitSec = 6) {
  runShell(serial, `am force-stop ${PACKAGE} 2>/dev/null || true`);
  sleep(1);
  runShell(serial, `am start -a android.intent.action.VIEW -d '${url}'`);
  sleep(waitSec);
}

function waitForText(serial, needle, timeoutSec = 30) {
  for (let i = 0; i < timeoutSec; i += 1) {
    const xml = ui(serial, 8, { dismiss: i > 0 && i % 5 === 0 });
    if (xmlContains(xml, needle)) return xml;
    sleep(1);
  }
  throw new Error(`waitForText timeout: "${needle}"`);
}

function isOnLauncher(xml) {
  return /com\.android\.launcher|com\.bbk\.launcher|launcher3/i.test(xml) && !xml.includes(PACKAGE);
}

function ensureAppForeground(serial) {
  const xml = ui(serial, 6);
  if (xml.includes(PACKAGE)) return xml;
  if (isOnLauncher(xml) || !xml.includes(PACKAGE)) {
    warmupApp(serial, PACKAGE);
    sleep(4);
  }
  return ui(serial, 6);
}

const DASHBOARD_HOME_MARKERS = [
  'Simulan dito',
  'libre, walang signup',
  'Mag-practice ngayon',
  'Guest mode: no email needed',
  'Tingnan ang subjects',
  'Save progress when ready',
];

function isStillOnboarding(xml) {
  return (
    xmlContains(xml, 'PASAPATH READY') ||
    xmlContains(xml, 'Anong exam ang nire-review mo') ||
    xmlContains(xml, 'Itakda ang daily goal mo') ||
    xmlContains(xml, 'I-save ang progress mo') ||
    (xmlContains(xml, 'Handa ka na bang pumasa') && !xmlContains(xml, 'Home tab'))
  );
}

function hasTabBar(xml) {
  if (!xml.includes(PACKAGE)) return false;
  const tabMarkers = ['Home tab', 'Review tab', 'Stats tab', 'Profile tab'];
  let tabHits = 0;
  for (const marker of tabMarkers) {
    if (findNode(xml, marker, { partial: true }) != null) tabHits += 1;
  }
  if (tabHits >= 2) return true;
  const home = findNode(xml, 'Home', { partial: false }) != null;
  const review = findNode(xml, 'Review', { partial: false }) != null;
  return home && review;
}

function isDashboardShellLoading(xml) {
  if (!xmlContains(xml, 'ReviewNatin')) return false;
  if (isStillOnboarding(xml)) return false;
  if (isDashboardHomeReady(xml)) return false;
  return !hasTabBar(xml);
}

function isDashboardHomeReady(xml) {
  if (isStillOnboarding(xml)) return false;
  for (const marker of DASHBOARD_HOME_MARKERS) {
    if (xmlContains(xml, marker)) return true;
  }
  if (hasTabBar(xml)) return true;
  return false;
}

/** After PASAPATH READY — tap dashboard CTA (Vivo: label on text + content-desc). */
function tapGoToDashboard(serial) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    dismissSystemChrome(serial);
    const xml = ui(serial, 6);
    if (!xmlContains(xml, 'PASAPATH READY') && isDashboardHomeReady(xml)) return;
    const bounds =
      findNode(xml, 'Pumunta sa Dashboard', { partial: true }) ??
      findNode(xml, 'Dashboard', { partial: true });
    if (bounds && tapBounds(serial, bounds)) {
      sleep(3);
      continue;
    }
    runShell(serial, 'input tap 503 2221');
    sleep(3);
  }
}

/** Wait for guest home after onboarding — handles skeleton load + wireless dump lag. */
function waitForDashboardHome(serial, timeoutSec = 90) {
  let retapped = 0;
  for (let i = 0; i < timeoutSec; i += 1) {
    keepScreenAwake(serial);
    let xml = ui(serial, 6);
    if (isForeignUiDump(xml)) {
      xml = ensureAppForeground(serial);
    }
    if (isDashboardHomeReady(xml)) return xml;
    if (xmlContains(xml, 'PASAPATH READY') && i > 4 && retapped < 4) {
      tapGoToDashboard(serial);
      retapped += 1;
      continue;
    }
    if (isDashboardShellLoading(xml) || isMinimalUiDump(xml)) {
      sleep(2);
      continue;
    }
    sleep(1);
  }
  throw new Error(
    'waitForDashboardHome timeout — expected Simulan dito, Mag-practice ngayon, or Home tab',
  );
}

function isMinimalUiDump(xml) {
  if (!xml.includes('<hierarchy')) return true;
  const decoded = decodeXmlEntities(xml);
  const texts = [...decoded.matchAll(/\b(?:text|content-desc)="([^"]*)"/g)]
    .map((m) => normalizeUiText(m[1]))
    .filter((t) => t.length > 0);
  const unique = new Set(texts);
  return unique.size <= 1;
}

function waitForAppReady(serial, timeoutSec = 120) {
  for (let i = 0; i < timeoutSec; i += 1) {
    keepScreenAwake(serial);
    let xml = ui(serial, 8);
    if (isOnLauncher(xml)) xml = ensureAppForeground(serial);
    const hasWelcomeCopy = xmlContains(xml, 'Handa ka na bang pumasa');
    const hasStartCta =
      findNode(xml, 'Get started', { partial: true }) != null || xmlContains(xml, "Get started — it's free");
    if (hasWelcomeCopy && hasStartCta) return xml;
    sleep(1);
  }
  throw new Error('waitForAppReady timeout — onboarding welcome never appeared');
}

function tapFooterButton(serial, needle) {
  const bounds = findNode(ui(serial), needle, { partial: true });
  if (bounds && tapBounds(serial, bounds)) return;
  runShell(serial, 'input tap 540 2167');
  sleep(0.8);
}

/** Guest onboarding via adb taps (Maestro-free). */
export function completeGuestOnboarding(serial) {
  clearAppForMaestro(serial, PACKAGE);
  warmupApp(serial, PACKAGE);
  waitForAppReady(serial, 120);
  tapWelcomeGetStarted(serial);
  waitForText(serial, 'Anong exam ang nire-review mo?', 25);
  tapFooterButton(serial, 'Continue');
  waitForText(serial, 'Ano ang level mo ngayon?', 20);
  tapFooterButton(serial, 'Continue');
  waitForText(serial, 'Itakda ang daily goal mo', 20);
  tapFooterButton(serial, 'committed');
  waitForText(serial, 'I-save ang progress mo', 25);
  let skipped = false;
  for (let i = 0; i < 10; i += 1) {
    const xml = ui(serial);
    const bounds = findNode(xml, 'Skip muna', { partial: true });
    if (bounds && tapBounds(serial, bounds)) {
      skipped = true;
      break;
    }
    adbSwipeUp(serial);
    sleep(0.5);
  }
  if (!skipped) {
    runShell(serial, 'input tap 540 1763');
  }
  sleep(1.5);
  waitForText(serial, 'PASAPATH READY', 25);
  tapGoToDashboard(serial);
  waitForDashboardHome(serial, 90);
}

function startGuestPractice(serial) {
  if (ui(serial).includes('Mag-practice ngayon')) {
    adbTapText(serial, 'Mag-practice ngayon');
  } else {
    adbTapText(serial, 'Review');
    waitForText(serial, 'Start practice quiz', 20);
    adbTapText(serial, 'Start practice quiz');
  }
  waitForText(serial, 'Option A', 30);
}

function answerOnePracticeQuestion(serial) {
  const xml = ui(serial);
  if (xml.includes('Abot na ang libreng tanong ngayon')) return 'limit';
  if (!xml.includes('Option A')) return 'done';
  adbTapText(serial, 'Option A.', { partial: true });
  sleep(0.5);
  if (ui(serial).includes('I-check ang sagot')) {
    adbTapText(serial, 'I-check ang sagot');
    sleep(1);
  }
  const after = ui(serial);
  if (after.includes('Susunod na tanong')) {
    adbTapText(serial, 'Susunod na tanong', { partial: true });
    sleep(0.8);
    return 'next';
  }
  if (after.includes('Tingnan ang resulta')) {
    adbTapText(serial, 'Tingnan ang resulta', { partial: true });
    sleep(2);
    runShell(serial, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
    sleep(1);
    return 'session-done';
  }
  return 'next';
}

/** Answer until daily limit panel or maxQuestions. */
export function exhaustGuestDailyLimit(serial, maxQuestions = 22) {
  startGuestPractice(serial);
  for (let i = 0; i < maxQuestions; i += 1) {
    const state = answerOnePracticeQuestion(serial);
    if (state === 'limit') return ui(serial);
    if (state === 'done') {
      startGuestPractice(serial);
    }
    if (state === 'session-done') {
      startGuestPractice(serial);
    }
  }
  return ui(serial);
}

function assertPatterns(xml, patterns, label) {
  const missing = patterns.filter((p) => !xmlContains(xml, p));
  return { ok: missing.length === 0, label, missing };
}

export function runAutomatedPersonaChecks(serial) {
  const evidence = {};
  const checks = {};

  keepScreenAwake(serial);

  // —— Guest cohort (G1–G4) ——
  completeGuestOnboarding(serial);
  const dashXml = ui(serial);
  checks.G1 = assertPatterns(dashXml, ['ReviewNatin', 'Home'], 'G1 welcome');
  evidence.G1 = screenshot(serial, 'auto-g1-dashboard.png');

  checks.G2 = assertPatterns(
    dashXml,
    ['Simulan dito', 'libre, walang signup', 'Mag-practice ngayon'],
    'G2 libre copy',
  );
  evidence.G2 = evidence.G1;

  const limitXml = exhaustGuestDailyLimit(serial);
  checks.G3 = assertPatterns(
    limitXml,
    ['Abot na ang libreng tanong ngayon', /20\/20|Nagamit mo na ang 20/, 'View Premium Plans'],
    'G3 daily limit panel',
  );
  evidence.G3 = screenshot(serial, 'auto-g3-daily-limit.png');

  runShell(serial, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
  sleep(1);
  adbTapText(serial, 'Profile', { partial: false });
  waitForText(serial, 'Nalito ka ba', 25);
  checks.G4 = assertPatterns(ui(serial), ['Nalito ka ba', 'Settings has reminders'], 'G4 settings hint');
  evidence.G4 = screenshot(serial, 'auto-g4-settings-hint.png');
  adbTapText(serial, 'Open settings', { partial: true });
  waitForText(serial, 'Settings', 20);
  for (let i = 0; i < 5; i += 1) {
    if (ui(serial).includes('Report a problem')) break;
    adbSwipeUp(serial);
  }
  checks.G4_scroll = assertPatterns(ui(serial), ['Report a problem'], 'G4 settings scroll');
  evidence.G4b = screenshot(serial, 'auto-g4-report-problem.png');

  // —— Free cohort (F1–F4) ——
  openDeeplinkCold(serial, 'reviewnatin://verify-email?email=f1.agent@reviewnatinph.com', 10);
  dismissOverlays(serial);
  sleep(1);
  const verifyXml = ui(serial, 10, { dismiss: true });
  checks.F1 = assertPatterns(
    verifyXml,
    [/I-verify ang email|Free account setup/i, /Code sent to f1\.agent@reviewnatinph\.com/i],
    'F1 verify-email cold',
  );
  evidence.F1 = screenshot(serial, 'auto-f1-verify-email.png');

  openDeeplinkCold(serial, 'reviewnatin://signup', 6);
  checks.F2_signup = assertPatterns(ui(serial), ['Gumawa ng account', 'Fast sign-up option'], 'F2 signup');
  checks.F2_oauth = assertPatterns(
    ui(serial),
    ['Google sign-in skips the email code'],
    'F2 OAuth copy',
  );
  evidence.F2 = screenshot(serial, 'auto-f2-oauth.png');

  openDeeplinkCold(serial, 'reviewnatin://login', 6);
  checks.F2_login = assertPatterns(ui(serial), [/Mag-log in|Log in|Sign in/i], 'F2 login');
  evidence.F2b = screenshot(serial, 'auto-f2-login.png');

  checks.F3 = checks.G3;
  evidence.F3 = evidence.G3;

  clearAppForMaestro(serial, PACKAGE);
  completeGuestOnboarding(serial);
  adbTapText(serial, 'Review');
  waitForText(serial, 'Mock Exam', 20);
  adbTapText(serial, 'Mock Exam');
  sleep(2);
  let previewXml = ui(serial);
  if (!previewXml.match(/items|Mock preview|Start mock/i)) {
    for (const label of ['CSE', 'LET', 'PNLE', 'Full', 'Mock']) {
      if (previewXml.includes(label)) {
        adbTapText(serial, label, { partial: true, retries: 3, optional: true });
        sleep(1);
        previewXml = ui(serial);
        break;
      }
    }
  }
  if (previewXml.includes('Start mock exam') || previewXml.includes('Start preview')) {
    adbTapText(serial, 'Start mock exam', { partial: true, optional: true });
    sleep(1);
    previewXml = ui(serial);
  }
  if (previewXml.includes('Mock preview mode') || previewXml.includes('Free tier: unang 10')) {
    // alert visible
  } else if (previewXml.includes('items')) {
    adbTapText(serial, 'items', { partial: true, optional: true });
    sleep(1);
    previewXml = ui(serial);
  }
  checks.F4 = assertPatterns(
    previewXml,
    [/Mock preview mode|Free tier: unang 10|Start preview|preview/i],
    'F4 mock preview gate',
  );
  evidence.F4 = screenshot(serial, 'auto-f4-mock-preview.png');

  // —— Premium cohort (P1–P4) ——
  openDeeplinkCold(serial, 'reviewnatin://subscribe', 6);
  let subXml = ui(serial);
  for (let i = 0; i < 4; i += 1) {
    if (
      subXml.includes('Continue to Secure Payment') &&
      (subXml.includes('Restore purchases') || subXml.includes('Premium access will unlock'))
    ) {
      break;
    }
    adbSwipeUp(serial);
    subXml = ui(serial);
  }
  checks.P1 = assertPatterns(
    subXml,
    ['Unlock ReviewNatin Premium', /Sign in to subscribe|Free account needed for Premium/i],
    'P1 subscribe gate',
  );
  evidence.P1 = screenshot(serial, 'auto-p1-subscribe.png');

  checks.P2 = assertPatterns(
    subXml,
    ['Continue to Secure Payment', 'Google Play', 'Payment is processed'],
    'P2 Play billing copy',
  );
  evidence.P2 = evidence.P1;

  checks.P3 = assertPatterns(
    subXml,
    [
      'Cancel anytime in Google Play',
      /Premium access will unlock automatically|Restore purchases|Already subscribed on this Google account/i,
    ],
    'P3 entitlement / restore copy',
  );
  evidence.P3 = evidence.P1;

  openDeeplinkCold(serial, 'reviewnatin://tutor', 6);
  const tutorXml = ui(serial);
  checks.P4_tutor = assertPatterns(
    tutorXml,
    ['This is a Premium feature', 'View Premium Plans'],
    'P4 AI tutor gate',
  );
  evidence.P4a = screenshot(serial, 'auto-p4-tutor-gate.png');

  warmupApp(serial, PACKAGE);
  completeGuestOnboarding(serial);
  adbTapText(serial, 'Profile');
  adbTapText(serial, 'Open settings');
  waitForText(serial, 'Settings', 15);
  for (let i = 0; i < 6; i += 1) {
    if (ui(serial).includes('Offline pack')) break;
    adbSwipeUp(serial);
  }
  adbTapText(serial, 'Offline pack');
  sleep(1);
  checks.P4_offline = assertPatterns(
    ui(serial),
    [/Premium feature|View Premium Plans|Unlock ReviewNatin Premium/i],
    'P4 offline pack gate',
  );
  evidence.P4b = screenshot(serial, 'auto-p4-offline-gate.png');

  return { checks, evidence };
}

export function personaResultsFromAutomation(automation) {
  const { checks, evidence } = automation;
  const pass = (ids) => ids.every((id) => checks[id]?.ok !== false);

  return {
    G1: { automated: pass(['G1']) ? 'pass' : 'fail', evidence: [evidence.G1].filter(Boolean) },
    G2: { automated: pass(['G2']) ? 'pass' : 'fail', evidence: [evidence.G2].filter(Boolean) },
    G3: { automated: pass(['G3']) ? 'pass' : 'fail', evidence: [evidence.G3].filter(Boolean) },
    G4: {
      automated: pass(['G4', 'G4_scroll']) ? 'pass' : 'fail',
      evidence: [evidence.G4, evidence.G4b].filter(Boolean),
    },
    F1: { automated: pass(['F1']) ? 'pass' : 'fail', evidence: [evidence.F1].filter(Boolean) },
    F2: {
      automated: pass(['F2_signup', 'F2_oauth', 'F2_login']) ? 'pass' : 'fail',
      evidence: [evidence.F2, evidence.F2b].filter(Boolean),
    },
    F3: { automated: pass(['F3']) ? 'pass' : 'fail', evidence: [evidence.F3].filter(Boolean) },
    F4: { automated: pass(['F4']) ? 'pass' : 'fail', evidence: [evidence.F4].filter(Boolean) },
    P1: { automated: pass(['P1']) ? 'pass' : 'fail', evidence: [evidence.P1].filter(Boolean) },
    P2: { automated: pass(['P2']) ? 'pass' : 'fail', evidence: [evidence.P2].filter(Boolean) },
    P3: { automated: pass(['P3']) ? 'pass' : 'fail', evidence: [evidence.P3].filter(Boolean) },
    P4: {
      automated: pass(['P4_tutor', 'P4_offline']) ? 'pass' : 'fail',
      evidence: [evidence.P4a, evidence.P4b].filter(Boolean),
    },
  };
}
