#!/usr/bin/env node
/**
 * PostHog → EAS env setup for ReviewNatin mobile analytics.
 *
 * Opens PostHog project settings, prompts for the Project API Key (phc_…),
 * writes apps/mobile/.env, and pushes vars to EAS preview + production.
 *
 * Run: npm run posthog:setup
 * Non-interactive: npm run posthog:setup -- --key phc_xxx [--host https://us.i.posthog.com]
 */

import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE_DIR = join(ROOT, 'apps/mobile');
const MOBILE_ENV = join(MOBILE_DIR, '.env');
const POSTHOG_SETTINGS = 'https://us.posthog.com/project/settings#project-api-keys';
const DEFAULT_HOST = 'https://us.i.posthog.com';

function parseArgs() {
  const args = process.argv.slice(2);
  let key = '';
  let host = DEFAULT_HOST;
  let skipEas = false;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--key' && args[i + 1]) {
      key = args[++i].trim();
    } else if (args[i] === '--host' && args[i + 1]) {
      host = args[++i].trim();
    } else if (args[i] === '--skip-eas') {
      skipEas = true;
    }
  }
  return { key, host, skipEas };
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function upsertEnvLines(path, entries) {
  const existing = existsSync(path) ? readFileSync(path, 'utf8').split('\n') : [];
  const keys = new Set(Object.keys(entries));
  const kept = existing.filter((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return true;
    const i = t.indexOf('=');
    return i <= 0 || !keys.has(t.slice(0, i).trim());
  });
  writeFileSync(
    path,
    [...kept.filter(Boolean), ...Object.entries(entries).map(([k, v]) => `${k}=${v}`)].join('\n') + '\n'
  );
}

function runEasEnv(name, value, environments) {
  for (const env of environments) {
    const result = spawnSync(
      'npx',
      [
        'eas-cli',
        'env:create',
        env,
        '--name',
        name,
        '--value',
        value,
        '--type',
        'string',
        '--visibility',
        name.startsWith('EXPO_PUBLIC_') ? 'sensitive' : 'secret',
        '--scope',
        'project',
        '--force',
        '--non-interactive',
      ],
      { cwd: MOBILE_DIR, stdio: 'inherit', shell: process.platform === 'win32' }
    );
    if (result.status !== 0) {
      console.error(`\nFailed to set ${name} on EAS ${env}. Run manually:\n`);
      console.error(
        `  cd apps/mobile && npx eas-cli env:create ${env} --name ${name} --value '<value>' --visibility secret --force --non-interactive`
      );
      process.exit(result.status ?? 1);
    }
  }
}

async function main() {
  const { key: argKey, host: argHost, skipEas } = parseArgs();

  console.log('\nPostHog setup — ReviewNatin mobile\n');
  console.log('1. Log in at PostHog Cloud (US region).');
  console.log('2. Project Settings → Project API Key → copy key starting with phc_');
  console.log(`3. Ingest host for US: ${DEFAULT_HOST}\n`);

  if (!argKey) {
    openUrl(POSTHOG_SETTINGS);
    console.log(`Opened ${POSTHOG_SETTINGS}\n`);
  }

  let apiKey = argKey;
  if (!apiKey) {
    apiKey = await ask('Paste Project API Key (phc_…): ');
  }
  if (!/^phc_[a-zA-Z0-9]+/.test(apiKey)) {
    console.error('Invalid key — expected format phc_…');
    process.exit(1);
  }

  let host = argHost;
  if (!argKey) {
    const hostAnswer = await ask(`PostHog ingest host [${DEFAULT_HOST}]: `);
    if (hostAnswer) host = hostAnswer;
  }

  upsertEnvLines(MOBILE_ENV, {
    EXPO_PUBLIC_POSTHOG_API_KEY: apiKey,
    EXPO_PUBLIC_POSTHOG_HOST: host,
  });
  console.log(`\nWrote ${MOBILE_ENV}`);

  if (skipEas) {
    console.log('\nSkipped EAS (--skip-eas). Rebuild preview APK after setting vars manually.');
    return;
  }

  console.log('\nPushing to EAS (preview + production)…');
  runEasEnv('EXPO_PUBLIC_POSTHOG_API_KEY', apiKey, ['preview', 'production']);
  runEasEnv('EXPO_PUBLIC_POSTHOG_HOST', host, ['preview', 'production']);

  console.log('\nDone. Verify:');
  console.log('  cd apps/mobile && npx eas-cli env:list --environment preview');
  console.log('\nNext: rebuild preview APK so env is baked in:');
  console.log('  cd apps/mobile && npx eas-cli build --profile preview --platform android');
  console.log('\nSmoke in PostHog → Live events: daily_active, registration_started, dashboard_charts_viewed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
