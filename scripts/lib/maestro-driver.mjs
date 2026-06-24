import { createHash } from 'node:crypto';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { adbDevice as resolveAdbDevice, deviceKind } from './adb-device.mjs';
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

function deviceState(serial) {
  try {
    const out = runCapture('adb devices');
    const line = out.split('\n').find((l) => l.startsWith(serial));
    return line?.split(/\s+/)[1] ?? null;
  } catch {
    return null;
  }
}

/** Block until adb serial is in `device` state (wireless drops often on Vivo). */
export function waitForAdbDevice(serial, timeoutSec = 120) {
  for (let i = 0; i < timeoutSec; i += 1) {
    if (deviceState(serial) === 'device') return;
    execSync('sleep 1', { cwd: REPO_ROOT });
  }
  throw new Error(`adb device ${serial} not online after ${timeoutSec}s`);
}

/** Inject `--user 0` into pm/am commands (Vivo multi-user). `adb shell --user 0` is unsupported on this platform-tools build. */
export function withPrimaryUserCmd(serial, shellCmd) {
  if (deviceKind(serial) !== 'wireless' && deviceKind(serial) !== 'usb') {
    return shellCmd;
  }
  if (/^pm clear\s/.test(shellCmd)) {
    return shellCmd.replace(/^pm clear\s+/, 'pm clear --user 0 ');
  }
  if (/^am start\s/.test(shellCmd)) {
    return shellCmd.replace(/^am start\s+/, 'am start --user 0 ');
  }
  return shellCmd;
}

/** Run adb shell on primary user (Vivo / multi-profile phones use user 11 by default). */
export function adbShell(serial, shellCmd, { inherit = true } = {}) {
  waitForAdbDevice(serial, 90);
  const cmd = `adb -s ${serial} shell ${withPrimaryUserCmd(serial, shellCmd)}`;
  if (inherit) run(cmd);
  else return runCapture(cmd);
}

function runAdbShell(serial, shellCmd, opts = {}) {
  return adbShell(serial, shellCmd, opts);
}

function runAdb(serial, args, { inherit = true } = {}) {
  waitForAdbDevice(serial, 90);
  const cmd = `adb -s ${serial} ${args}`;
  if (inherit) run(cmd);
  else return runCapture(cmd);
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

/** Primary user on multi-profile phones (Vivo private space / secondary users). */
export function adbUserFlag(device) {
  return deviceKind(device) === 'wireless' || deviceKind(device) === 'usb' ? '--user 0' : '';
}

/** Reset app state via adb (Maestro clearState hangs over wireless on some OEMs). */
export function clearAppForMaestro(device, packageName) {
  runAdbShell(device, `am force-stop ${packageName} 2>/dev/null || true`);
  adbShell(device, `pm clear ${packageName}`);
  run('sleep 2');
}

/** Launch app via adb before Maestro (avoids gRPC launch timeout on physical devices). */
export function warmupApp(device, packageName) {
  runAdbShell(device, `am force-stop ${packageName} 2>/dev/null || true`);
  runAdbShell(
    device,
    `am start -n ${packageName}/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER`,
  );
  run('sleep 6');
}

/** Keep screen on during long wireless Maestro runs. */
export function keepScreenAwake(device) {
  runAdbShell(device, 'input keyevent KEYCODE_WAKEUP 2>/dev/null || true', { inherit: true });
  runAdbShell(device, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
  runAdbShell(device, 'svc power stayon usb 2>/dev/null || true');
}

/** Speed up UI + Maestro hierarchy reads on physical devices. */
export function disableAnimations(device) {
  for (const scale of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
    runAdbShell(device, `settings put global ${scale} 0 2>/dev/null || true`);
  }
}

export function maestroEnv() {
  return {
    ...process.env,
    MAESTRO_DISABLE_ANIMATION: 'true',
  };
}

/** adb cold verify-email (no Maestro gRPC — reliable over wireless). */
export function assertColdVerifyEmailDeeplinkAdb(packageName = 'ph.reviewnatin.app', device) {
  const serial = device ?? adbDevice();
  waitForAdbDevice(serial);
  clearAppForMaestro(serial, packageName);
  adbShell(
    serial,
    "am start -a android.intent.action.VIEW -d 'reviewnatin://verify-email?email=f1.agent@reviewnatinph.com'",
  );
  execSync('sleep 8', { cwd: REPO_ROOT });
  adbShell(serial, 'input keyevent KEYCODE_BACK 2>/dev/null || true');
  execSync('sleep 1', { cwd: REPO_ROOT });
  const xml = dumpUiXml(serial, 10);
  const ok =
    /I-verify ang email|Free account setup|Code sent to f1\.agent@reviewnatinph\.com/i.test(xml);
  return {
    ok,
    screen: ok ? 'verify-email' : 'unknown',
    method: 'adb-cold-deeplink',
    sample: xml.slice(0, 200),
  };
}

export function ensureMaestroCli() {
  const which = spawnSync('bash', ['-lc', 'command -v maestro'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  run('curl -Ls https://get.maestro.mobile.dev | bash');
  const path = `${process.env.HOME}/.maestro/bin/maestro`;
  return existsSync(path) ? path : 'maestro';
}

export function adbDevice(preferredSerial) {
  return resolveAdbDevice(preferredSerial);
}

/** Retry uiautomator dump while the app is still booting (cold deeplinks replay after ~2.5s). */
export function dumpUiXml(device, maxAttempts = 6) {
  const serial = device ?? adbDevice();
  let xml = '';
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      waitForAdbDevice(serial, 30);
      adbShell(serial, 'uiautomator dump /sdcard/window_dump.xml 2>/dev/null', { inherit: false });
      xml = adbShell(serial, 'cat /sdcard/window_dump.xml 2>/dev/null || echo ""', { inherit: false });
      if (xml.includes('<hierarchy')) return xml;
    } catch {
      /* app may still be animating */
    }
    execSync('sleep 1', { cwd: REPO_ROOT });
  }
  return xml;
}

/** Cold-start verify-email deeplink — Maestro on emulator; adb on wireless physical. */
export function assertColdVerifyEmailDeeplink(packageName = 'ph.reviewnatin.app', device) {
  const serial = device ?? adbDevice();
  if (deviceKind(serial) === 'wireless') {
    return assertColdVerifyEmailDeeplinkAdb(packageName, serial);
  }
  const maestro = ensureMaestroCli();
  ensureMaestroDriver(serial);
  resetMaestroDriver(serial);
  clearAppForMaestro(serial, packageName);
  warmupApp(serial, packageName);
  try {
    execSync(`${maestro} test apps/mobile/.maestro/flows/deeplink-verify-email.yaml`, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: maestroEnv(),
    });
    return { ok: true, screen: 'verify-email', method: 'maestro-deeplink-verify-email' };
  } catch {
    return assertColdVerifyEmailDeeplinkAdb(packageName, serial);
  }
}

/** Quick Maestro probe for wireless — fail fast before a 12-persona run. */
export function probeMaestroWireless(device, maestro, packageName = 'ph.reviewnatin.app') {
  try {
    waitForAdbDevice(device, 60);
    disableAnimations(device);
    keepScreenAwake(device);
    resetMaestroDriver(device);
    clearAppForMaestro(device, packageName);
    warmupApp(device, packageName);
    execSync(
      `${maestro} test apps/mobile/.maestro/flows/guest-onboarding-quiz.yaml`,
      {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        env: maestroEnv(),
        timeout: 120_000,
      },
    );
    return true;
  } catch (err) {
    console.warn(`Maestro wireless probe failed: ${err.message ?? err}`);
    return false;
  }
}
