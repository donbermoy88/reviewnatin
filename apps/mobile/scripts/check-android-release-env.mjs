#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const TEST_ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const ANDROID_PACKAGE = 'ph.reviewnatin.app';
const REQUIRED_PLAY_PRODUCTS = [
  'plus_monthly',
  'plus_six_months',
  'plus_yearly',
  'exam_pass_cse_pro',
  'exam_pass_cse_sub',
  'exam_pass_let_elem',
  'exam_pass_let_sec',
  'exam_pass_pnle',
];

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const localEnv = {
  ...parseEnvFile(resolve(ROOT, '.env')),
  ...parseEnvFile(resolve(ROOT, '../../.env.supabase')),
  ...process.env,
};

function value(key) {
  return String(localEnv[key] ?? '').trim();
}

const failures = [];
const warnings = [];

function requirePresent(key, reason) {
  if (!value(key)) failures.push(`${key}: ${reason}`);
}

function warnMissing(key, reason) {
  if (!value(key)) warnings.push(`${key}: ${reason}`);
}

function requireNotTestValue(key, testValue, reason) {
  if (value(key) === testValue) failures.push(`${key}: ${reason}`);
}

function requirePattern(key, pattern, reason) {
  const current = value(key);
  if (current && !pattern.test(current)) failures.push(`${key}: ${reason}`);
}

requirePresent('EXPO_PUBLIC_SUPABASE_URL', 'mobile app needs the production Supabase project URL');
requirePresent('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'mobile app needs the production Supabase anon key');
requirePresent('EXPO_PUBLIC_SENTRY_DSN', 'production Android builds must ship crash reporting');
requirePresent('EXPO_PUBLIC_ADMOB_ANDROID_APP_ID', 'Google Mobile Ads requires a real Android app ID');
requireNotTestValue(
  'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
  TEST_ADMOB_ANDROID_APP_ID,
  'production must not use Google’s public test AdMob app ID'
);
requirePattern(
  'EXPO_PUBLIC_ADMOB_ANDROID_APP_ID',
  /^ca-app-pub-\d+~\d+$/,
  'expected AdMob Android app ID format ca-app-pub-...~...'
);
requirePresent(
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'Google Sign-In has no safe fallback on Android (Web client ID redirect is rejected by Google) — register an Android OAuth client and set this'
);
requirePresent('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', 'iap-verify needs Play Developer API credentials');
requirePresent('ANDROID_PACKAGE', `iap-verify should verify package ${ANDROID_PACKAGE}`);
if (value('ANDROID_PACKAGE') && value('ANDROID_PACKAGE') !== ANDROID_PACKAGE) {
  failures.push(`ANDROID_PACKAGE: expected ${ANDROID_PACKAGE}`);
}

warnMissing('SENTRY_ORG', 'recommended for Sentry source map upload and release association');
warnMissing('SENTRY_PROJECT', 'recommended for Sentry source map upload and release association');
warnMissing('EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID', 'ads will fall back to the Plus upsell instead of real banners');
warnMissing('EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID', 'session interstitial ads will be disabled');

const appJson = JSON.parse(readFileSync(resolve(ROOT, 'app.json'), 'utf8')).expo;
if (appJson.android?.package !== ANDROID_PACKAGE) {
  failures.push(`app.json android.package: expected ${ANDROID_PACKAGE}`);
}
if (!appJson.version) failures.push('app.json expo.version: required for Play Store release metadata');

const easJson = JSON.parse(readFileSync(resolve(ROOT, 'eas.json'), 'utf8'));
if (easJson.build?.production?.android?.buildType !== 'app-bundle') {
  failures.push('eas.json production.android.buildType: expected app-bundle');
}
if (easJson.build?.production?.autoIncrement !== true) {
  failures.push('eas.json production.autoIncrement: expected true');
}

const productSkuSource = readFileSync(resolve(ROOT, 'lib/iap/product-skus.ts'), 'utf8');
for (const sku of REQUIRED_PLAY_PRODUCTS) {
  if (!productSkuSource.includes(`'${sku}'`)) {
    failures.push(`ANDROID_PRODUCT_SKUS: missing ${sku}`);
  }
}

if (failures.length > 0) {
  console.error('Android release check failed:\n');
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length > 0) {
    console.error('\nWarnings:');
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log('Android release check passed.');
if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}
