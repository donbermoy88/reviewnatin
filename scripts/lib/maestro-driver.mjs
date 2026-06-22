import { createHash } from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './supabase-env.mjs';

const MAESTRO_PACKAGES = ['dev.mobile.maestro', 'dev.mobile.maestro.test'];
const CACHE_DIR = join(REPO_ROOT, 'dist/beta/maestro-apks');
const JAR_CANDIDATES = [
  join(process.env.HOME ?? '', '.maestro/lib/maestro-client.jar'),
  join(REPO_ROOT, 'audit/screenshots/v10-build10-guest/maestro-apks'),
];

function run(cmd) {
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

/** Extract maestro-app.apk + maestro-server.apk from the Maestro CLI jar. */
export function materializeMaestroApks() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const appApk = join(CACHE_DIR, 'maestro-app.apk');
  const serverApk = join(CACHE_DIR, 'maestro-server.apk');
  if (existsSync(appApk) && existsSync(serverApk)) {
    return { appApk, serverApk };
  }

  const auditApp = join(REPO_ROOT, 'audit/screenshots/v10-build10-guest/maestro-apks/maestro-app.apk');
  const auditServer = join(REPO_ROOT, 'audit/screenshots/v10-build10-guest/maestro-apks/maestro-server.apk');
  if (existsSync(auditApp) && existsSync(auditServer)) {
    writeFileSync(appApk, readFileSync(auditApp));
    writeFileSync(serverApk, readFileSync(auditServer));
    return { appApk, serverApk };
  }

  const jar = JAR_CANDIDATES.find((p) => existsSync(p) && p.endsWith('.jar'));
  if (!jar) throw new Error('Maestro driver APKs not found — install Maestro CLI first');

  run(`cd "${CACHE_DIR}" && jar xf "${jar}" maestro-app.apk maestro-server.apk`);
  if (!existsSync(appApk) || !existsSync(serverApk)) {
    throw new Error('Failed to extract Maestro driver APKs from maestro-client.jar');
  }
  return { appApk, serverApk };
}

/** Install / refresh Maestro gRPC driver on the connected emulator. */
export function ensureMaestroDriver(device = 'emulator-5554') {
  const { appApk, serverApk } = materializeMaestroApks();
  console.log(`Maestro driver APKs: ${sha256(serverApk).slice(0, 12)}… / ${sha256(appApk).slice(0, 12)}…`);

  run(`adb -s ${device} shell am force-stop ${MAESTRO_PACKAGES.join(' ')} 2>/dev/null || true`);
  run(`adb -s ${device} uninstall dev.mobile.maestro.test 2>/dev/null || true`);
  run(`adb -s ${device} uninstall dev.mobile.maestro 2>/dev/null || true`);
  run(`adb -s ${device} install -r "${serverApk}"`);
  run(`adb -s ${device} install -r "${appApk}"`);
  run('sleep 2');
}

export function resetMaestroDriver(device = 'emulator-5554') {
  run(`adb -s ${device} shell am force-stop ${MAESTRO_PACKAGES.join(' ')} 2>/dev/null || true`);
  run('sleep 1');
}

export function ensureMaestroCli() {
  const which = spawnSync('bash', ['-lc', 'command -v maestro'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  run('curl -Ls https://get.maestro.mobile.dev | bash');
  const path = `${process.env.HOME}/.maestro/bin/maestro`;
  return existsSync(path) ? path : 'maestro';
}

export function adbDevice() {
  const out = runCapture('adb devices');
  const line = out.split('\n').find((l) => l.includes('emulator') && l.includes('device'));
  if (!line) throw new Error('No Android emulator online — start an AVD first');
  return line.split('\t')[0].trim();
}

/** Cold-start verify-email deeplink must land on OTP screen, not signup. */
export function assertColdVerifyEmailDeeplink(packageName = 'ph.reviewnatin.app', device) {
  const serial = device ?? adbDevice();
  run(`adb -s ${serial} shell am force-stop ${packageName}`);
  run(`adb -s ${serial} shell pm clear ${packageName}`);
  run('sleep 2');
  run(
    `adb -s ${serial} shell am start -a android.intent.action.VIEW -d 'reviewnatin://verify-email?email=f1.agent@reviewnatinph.com' ${packageName}`
  );
  run('sleep 8');
  run(`adb -s ${serial} shell uiautomator dump /sdcard/window_dump.xml 2>/dev/null || true`);
  const xml = runCapture(`adb -s ${serial} shell cat /sdcard/window_dump.xml 2>/dev/null || echo ''`);
  if (/I-verify ang email/i.test(xml)) return { ok: true, screen: 'verify-email' };
  if (/Gumawa ng account/i.test(xml)) {
    return { ok: false, screen: 'signup', detail: 'Cold deeplink redirected to signup' };
  }
  return { ok: false, screen: 'unknown', detail: 'Neither verify nor signup copy found' };
}
