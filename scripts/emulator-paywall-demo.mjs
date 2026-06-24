#!/usr/bin/env node
/**
 * Boot Metro + dev client on emulator and capture Play Billing paywall screenshots.
 *
 * Usage: node scripts/emulator-paywall-demo.mjs
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const PACKAGE = 'ph.reviewnatin.app';
const APK = join(REPO_ROOT, 'apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk');
const OUT = join(REPO_ROOT, 'audit/screenshots/play-billing-paywall');
const ANDROID_HOME = process.env.ANDROID_HOME ?? `${process.env.HOME}/Library/Android/sdk`;

function run(cmd) {
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit', env: { ...process.env, ANDROID_HOME } });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8', env: { ...process.env, ANDROID_HOME } }).trim();
}

function device() {
  const start = Date.now();
  while (Date.now() - start < 120_000) {
    const out = runCapture('adb devices');
    const line = out.split('\n').find((l) => l.includes('emulator') && l.includes('device'));
    if (line) return line.split('\t')[0];
    execSync('sleep 3');
  }
  throw new Error('No Android emulator connected. Start an AVD first.');
}

function shot(serial, name) {
  const path = join(OUT, name);
  execSync(`adb -s ${serial} exec-out screencap -p > "${path}"`, { stdio: 'inherit' });
  console.log(`📸 ${path}`);
}

function tap(serial, x, y) {
  execSync(`adb -s ${serial} shell input tap ${x} ${y}`, { stdio: 'ignore' });
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const serial = device();
  console.log(`Using device ${serial}`);

  if (!existsSync(APK)) {
    console.error(`Missing debug APK. Run: cd apps/mobile && npx expo run:android`);
    process.exit(1);
  }

  const installed = runCapture(`adb -s ${serial} shell pm path ${PACKAGE} 2>/dev/null || true`);
  if (!installed.includes('package:')) {
    run(`adb -s ${serial} uninstall ${PACKAGE} 2>/dev/null || true`);
    run(`adb -s ${serial} install -r "${APK}"`);
  }

  const metro = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8081/status'], {
    encoding: 'utf8',
  });
  if (!metro.stdout?.includes('200')) {
    console.log('Starting Metro (background)…');
    spawnSync('npx', ['expo', 'start', '--dev-client'], {
      cwd: join(REPO_ROOT, 'apps/mobile'),
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, ANDROID_HOME },
    });
    execSync('sleep 8');
  }

  run(
    `adb -s ${serial} shell am start -a android.intent.action.VIEW -d 'exp+reviewnatin://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081'`,
  );
  execSync('sleep 8');
  // Dev launcher: tap the 10.0.2.2 Metro server row if visible.
  tap(serial, 540, 1960);
  execSync('sleep 32');
  tap(serial, 540, 2200);
  execSync('sleep 2');

  run(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "reviewnatin://subscribe"`);
  execSync('sleep 6');
  execSync(`adb -s ${serial} shell input keyevent KEYCODE_BACK`);
  execSync('sleep 1');
  shot(serial, '09-emulator-paywall-guest.png');

  execSync(`adb -s ${serial} shell input swipe 540 2000 540 700 450`);
  execSync('sleep 1');
  shot(serial, '10-emulator-paywall-footer.png');

  console.log('\nDone. Open audit/screenshots/play-billing-paywall/');
}

main();
