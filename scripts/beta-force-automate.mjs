#!/usr/bin/env node
/**
 * Fully automated beta loop: tests → local APK → install → Maestro + deeplink.
 * No manual steps. Uses local EAS/Gradle when --local-build (default).
 *
 * Usage:
 *   npm run beta:force
 *   npm run beta:force -- --cloud-build
 */
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const args = process.argv.slice(2);
const cloud = args.includes('--cloud-build');
const extra = cloud ? '' : '--local-build --skip-push';

function run(cmd) {
  console.log(`\n$ ${cmd}\n`);
  execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit', env: {
    ...process.env,
    ANDROID_HOME: process.env.ANDROID_HOME || `${process.env.HOME}/Library/Android/sdk`,
    PATH: `${process.env.HOME}/Library/Android/sdk/platform-tools:${process.env.PATH}`,
  }});
}

run(`node scripts/beta-automate-all.mjs ${extra}`.trim());
