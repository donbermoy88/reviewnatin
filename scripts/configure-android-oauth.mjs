#!/usr/bin/env node
/**
 * Android Google OAuth setup helper for ReviewNatin.
 *
 * Prerequisites:
 * 1. Google Cloud Console → Credentials → Create OAuth client (Android)
 * 2. Package name: ph.reviewnatin.app
 * 3. Add SHA-1 fingerprints (debug + release)
 *
 * Debug SHA-1 (local dev):
 *   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
 *
 * Release SHA-1 (EAS / Play):
 *   eas credentials -p android
 *   # or after downloading upload keystore from EAS:
 *   keytool -list -v -keystore ./reviewnatin-upload.jks -alias upload
 *
 * Add to .env.supabase:
 *   GOOGLE_OAUTH_ANDROID_CLIENT_ID=....apps.googleusercontent.com
 *
 * Add to apps/mobile/.env:
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=....apps.googleusercontent.com
 *
 * Play Console (deferred):
 *   - Create app with package ph.reviewnatin.app
 *   - Internal testing track → upload AAB from: npm run eas:build:android:preview --workspace=apps/mobile
 *   - Link Google Play App Signing SHA-1 to OAuth client
 *
 * Run: npm run supabase:google (after adding Android client ID to .env.supabase)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID_PACKAGE = 'ph.reviewnatin.app';
const DEBUG_KEYSTORE = join(process.env.HOME ?? '', '.android/debug.keystore');

console.log('\nReviewNatin — Android OAuth checklist\n');
console.log(`Package name: ${ANDROID_PACKAGE}\n`);

if (existsSync(DEBUG_KEYSTORE)) {
  try {
    const out = execSync(
      `keytool -list -v -keystore "${DEBUG_KEYSTORE}" -alias androiddebugkey -storepass android -keypass android 2>/dev/null`,
      { encoding: 'utf8' }
    );
    const sha1 = out.match(/SHA1:\s*([^\n]+)/)?.[1]?.trim();
    if (sha1) {
      console.log('Debug keystore SHA-1 (add to Google Android OAuth client):');
      console.log(`  ${sha1}\n`);
    }
  } catch {
    console.log('Could not read debug keystore SHA-1. Install Java keytool or run manually.\n');
  }
} else {
  console.log('Debug keystore not found. Build Android once or create ~/.android/debug.keystore\n');
}

const mobileEnv = join(ROOT, 'apps/mobile/.env');
if (existsSync(mobileEnv)) {
  const env = readFileSync(mobileEnv, 'utf8');
  const hasAndroid = env.includes('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=');
  console.log(hasAndroid ? '✓ EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in apps/mobile/.env' : '○ Add EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to apps/mobile/.env');
} else {
  console.log('○ Create apps/mobile/.env with Google client IDs');
}

console.log('\nEAS Android builds:');
console.log('  cd apps/mobile && npm run eas:build:android:preview   # internal APK');
console.log('  cd apps/mobile && npm run eas:build:android:prod      # Play AAB\n');
