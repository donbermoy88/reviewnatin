#!/usr/bin/env node
/**
 * Set GitHub Actions secrets for automated Vercel deploys.
 * Uses local git credentials + Vercel CLI auth token.
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const repo = 'donbermoy88/reviewnatin';
const authPath = join(homedir(), 'Library/Application Support/com.vercel.cli/auth.json');

function ghToken() {
  const out = execSync("printf 'protocol=https\\nhost=github.com\\n\\n' | git credential fill", {
    encoding: 'utf8',
  });
  const line = out.split('\n').find((l) => l.startsWith('password='));
  if (!line) throw new Error('No GitHub password/token in git credential store.');
  return line.slice('password='.length);
}

function vercelToken() {
  return JSON.parse(readFileSync(authPath, 'utf8')).token;
}

const secrets = {
  VERCEL_TOKEN: vercelToken(),
  VERCEL_ORG_ID: 'team_b7ae4QPDug0JGfNYDx7gADRU',
  VERCEL_PROJECT_ID_MARKETING: 'prj_VevT9zkUxx3PnDCTRr4FurIy76q1',
  VERCEL_PROJECT_ID_ADMIN: 'prj_fj7B7ueXTGKlcJAnYnDwcDlauD4e',
};

const token = ghToken();
spawnSync('gh', ['auth', 'login', '--with-token'], { input: token, stdio: ['pipe', 'inherit', 'inherit'] });

for (const [name, value] of Object.entries(secrets)) {
  console.log(`Setting ${name}...`);
  const r = spawnSync('gh', ['secret', 'set', name, '--repo', repo, '--body', value], {
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log('\nGitHub Actions secrets configured. Push to master to auto-deploy.');
