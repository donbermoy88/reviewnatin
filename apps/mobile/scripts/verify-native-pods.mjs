#!/usr/bin/env node
/**
 * Guard against the "nil Fabric component" launch crash.
 *
 * react-native-google-mobile-ads is always autolinked (it's a hard dependency),
 * so React Native's codegen always emits a Fabric component table that does
 * `NSClassFromString(@"RNGoogleMobileAdsBannerView")`. If the AdMob CocoaPods
 * (Google-Mobile-Ads-SDK / GoogleUserMessagingPlatform / RNGoogleMobileAds)
 * fail to resolve or link — e.g. a CocoaPods CDN outage during `pod install` —
 * those classes are absent at runtime, `NSClassFromString` returns nil, and
 * +[RCTThirdPartyComponentsProvider thirdPartyFabricComponents] crashes with
 * `NSInvalidArgumentException: attempt to insert nil object` on launch.
 *
 * Run this AFTER `pod install` and BEFORE archiving (CI / EAS prebuild hook).
 * It fails loudly with a fixable message instead of shipping a crashing binary.
 *
 * Usage: node scripts/verify-native-pods.mjs   (exit 0 = ok, 1 = missing)
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const IOS = join(dirname(fileURLToPath(import.meta.url)), '..', 'ios');
// External CDN pods — must be downloaded into Pods/ (these are what fail on a
// CocoaPods CDN outage and trigger the nil-class launch crash).
const REQUIRED_EXTERNAL_PODS = ['Google-Mobile-Ads-SDK', 'GoogleUserMessagingPlatform'];
// Dev pod compiled from node_modules — lives in Pods/Local Podspecs, not as a
// top-level Pods/ folder; only assert it resolved in the lockfile.
const REQUIRED_LOCAL_PODS = ['RNGoogleMobileAds'];

function fail(msg) {
  console.error(`\n✗ verify-native-pods: ${msg}\n`);
  process.exit(1);
}

const lockPath = join(IOS, 'Podfile.lock');
if (!existsSync(lockPath)) {
  // No native iOS project yet (managed/Expo Go) — nothing to verify.
  console.log('verify-native-pods: no ios/Podfile.lock; skipping (managed workflow).');
  process.exit(0);
}

const lock = readFileSync(lockPath, 'utf8');
const podsDir = join(IOS, 'Pods');
const installed = existsSync(podsDir) ? new Set(readdirSync(podsDir)) : new Set();

const missing = [
  // External pods: must be resolved in the lockfile AND present on disk.
  ...REQUIRED_EXTERNAL_PODS.filter(
    (pod) => !lock.includes(`${pod} (`) || (existsSync(podsDir) && !installed.has(pod))
  ),
  // Local/dev pods: lockfile resolution is sufficient.
  ...REQUIRED_LOCAL_PODS.filter((pod) => !lock.includes(`${pod} (`)),
];

if (missing.length) {
  fail(
    `AdMob native pods missing: ${missing.join(', ')}.\n` +
      `  react-native-google-mobile-ads is autolinked, so its Fabric components are\n` +
      `  always codegen'd; without these pods the app crashes on launch\n` +
      `  (NSInvalidArgumentException in RCTThirdPartyComponentsProvider).\n` +
      `  Fix: re-run \`cd ios && pod install\` with network access, then rebuild.`
  );
}

console.log(
  `✓ verify-native-pods: ${[...REQUIRED_EXTERNAL_PODS, ...REQUIRED_LOCAL_PODS].join(', ')} present.`
);
