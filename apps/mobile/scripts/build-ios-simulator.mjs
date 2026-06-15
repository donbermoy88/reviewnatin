#!/usr/bin/env node
/**
 * Build ReviewNatin for iOS Simulator (works around expo run:ios signing bug on Xcode 26).
 * Usage: npm run ios:build-sim
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IOS = join(ROOT, 'ios');
const APP = join(IOS, 'build/Build/Products/Debug-iphonesimulator/ReviewNatin.app');

function sh(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: IOS, ...opts });
}

function pickSimulator() {
  const out = execSync('xcrun simctl list devices available', { encoding: 'utf8' });
  const lines = out.split('\n');
  const candidates = [];
  let currentRuntime = null;
  const preferredName = process.env.IOS_SIMULATOR_NAME || 'iPhone 17 Pro';
  const preferredRuntime = process.env.IOS_SIMULATOR_RUNTIME || '26.5';

  for (const line of lines) {
    const runtimeMatch = line.match(/^-- iOS ([0-9.]+) --$/);
    if (runtimeMatch) {
      currentRuntime = runtimeMatch[1];
      continue;
    }

    if (currentRuntime && line.includes('iPhone')) {
      const match = line.match(/^\s+(.+?) \(([0-9A-F-]{36})\) \((Booted|Shutdown)\)/);
      if (match) {
        candidates.push({
          name: match[1],
          runtime: currentRuntime,
          state: match[3],
          udid: match[2],
        });
      }
    }
  }

  const exactPreferred = candidates.find(
    (candidate) =>
      candidate.name === preferredName && candidate.runtime === preferredRuntime
  );
  if (exactPreferred) return exactPreferred.udid;

  candidates.sort((a, b) =>
    b.runtime.localeCompare(a.runtime, undefined, { numeric: true, sensitivity: 'base' })
  );

  const preferred = candidates.find((candidate) => candidate.name === preferredName);
  if (preferred) return preferred.udid;

  if (candidates[0]) return candidates[0].udid;
  throw new Error('No available iPhone simulator found. Run: xcodebuild -downloadPlatform iOS');
}

// Guard against the AdMob nil-Fabric-component launch crash before building.
execSync('node scripts/verify-native-pods.mjs', { stdio: 'inherit', cwd: ROOT });

const udid = process.env.IOS_SIM_UDID || pickSimulator();
console.log(`\nBuilding for simulator ${udid}…\n`);

sh(
  `xcodebuild -workspace ReviewNatin.xcworkspace -scheme ReviewNatin -configuration Debug -sdk iphonesimulator -destination id=${udid} -derivedDataPath build CODE_SIGNING_ALLOWED=NO CODE_SIGN_IDENTITY= build`
);

if (!existsSync(APP)) {
  console.error('Build finished but ReviewNatin.app not found.');
  process.exit(1);
}

console.log('\nInstalling on simulator…');
execSync(`xcrun simctl boot ${udid} 2>/dev/null || true`);
execSync(`xcrun simctl install ${udid} "${APP}"`);
execSync(`xcrun simctl launch ${udid} ph.reviewnatin.app`);
console.log('\nDone. Run: npm run ios:dev');
