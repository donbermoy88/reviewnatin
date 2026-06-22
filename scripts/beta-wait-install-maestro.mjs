#!/usr/bin/env node
/**
 * Poll an EAS Android build, download APK, install on emulator, run Maestro suite.
 *
 * Usage:
 *   node scripts/beta-wait-install-maestro.mjs <build-id>
 *   node scripts/beta-wait-install-maestro.mjs --latest
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const PACKAGE = 'ph.reviewnatin.app';
const DIST = join(REPO_ROOT, 'dist/beta');
const arg = process.argv[2] ?? '--latest';

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit' });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function resolveBuildId() {
  if (arg !== '--latest') return arg;
  const json = runCapture(
    'cd apps/mobile && npx eas-cli build:list --platform android --limit 1 --json --non-interactive'
  );
  const builds = JSON.parse(json);
  const latest = Array.isArray(builds) ? builds[0] : builds;
  if (!latest?.id) throw new Error('No EAS builds found');
  return latest.id;
}

async function pollBuild(buildId, maxMin = 60) {
  const start = Date.now();
  while (Date.now() - start < maxMin * 60 * 1000) {
    const json = runCapture(`cd apps/mobile && npx eas-cli build:view ${buildId} --json`);
    const build = JSON.parse(json);
    console.log(`Build ${buildId}: ${build.status} (v${build.appBuildVersion ?? '?'})`);
    if (build.status === 'FINISHED') {
      const url = build.artifacts?.applicationArchiveUrl ?? build.artifacts?.buildUrl;
      if (!url) throw new Error('Build finished but no APK URL');
      return { url, versionCode: build.appBuildVersion ?? 'unknown', build };
    }
    if (build.status === 'ERRORED' || build.status === 'CANCELED') {
      throw new Error(`EAS build ${build.status}`);
    }
    execSync('sleep 30');
  }
  throw new Error('Timed out waiting for EAS build');
}

async function main() {
  mkdirSync(DIST, { recursive: true });
  const buildId = await resolveBuildId();
  console.log(`\n▶ Waiting for EAS build ${buildId}…\n`);
  const { url, versionCode, build } = await pollBuild(buildId);
  const apkPath = join(DIST, `reviewnatin-beta-v${versionCode}.apk`);
  run(`curl -fsSL -o "${apkPath}" "${url}"`);
  const digest = sha256(apkPath);
  console.log(`\nAPK: ${apkPath}\nSHA-256: ${digest}\n`);

  run(`adb uninstall ${PACKAGE} 2>/dev/null || true`);
  run(`adb install "${apkPath}"`);
  run(`adb shell am force-stop ${PACKAGE}`);

  run('node scripts/beta-maestro-run.mjs');

  writeFileSync(
    join(DIST, `release-notes-build-${versionCode}.md`),
    [
      `# ReviewNatin Beta APK — build ${versionCode}`,
      '',
      `Generated: ${new Date().toISOString()}`,
      `**APK:** ${apkPath}`,
      `**SHA-256:** ${digest}`,
      `**EAS:** https://expo.dev/accounts/donbermoy88/projects/reviewnatin/builds/${buildId}`,
      '',
      'Maestro: see `dist/beta/last-maestro-report.json`',
    ].join('\n')
  );

  console.log('\n✅ Build installed and Maestro suite finished.');
}

main().catch((e) => {
  console.error('\n❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
