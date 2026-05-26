#!/usr/bin/env node
/** Link donbermoy88/reviewnatin to both Vercel projects (after GitHub is connected). */
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = 'https://github.com/donbermoy88/reviewnatin';

function link(project) {
  console.log(`\n=== ${project} ===`);
  const link = spawnSync('npx', ['vercel', 'link', '--yes', '--project', project], {
    cwd: root,
    stdio: 'inherit',
  });
  if (link.status !== 0) process.exit(link.status ?? 1);

  const connect = spawnSync(
    'npx',
    ['vercel', 'git', 'connect', repo, '--yes'],
    { cwd: root, stdio: 'inherit', input: 'y\n' }
  );
  if (connect.status !== 0) {
    console.error(`Failed to connect ${project}. Ensure GitHub Login Connection + Vercel GitHub App are set up.`);
    process.exit(connect.status ?? 1);
  }
}

for (const project of ['reviewnatin-marketing', 'reviewnatin-admin']) {
  link(project);
}

console.log('\nGit linked. Vercel will deploy on push and comment on PRs natively.');
