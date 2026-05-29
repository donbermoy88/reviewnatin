/**
 * Runs another script with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * sourced from .env.supabase. Avoids exposing credentials in shell command history.
 *
 * Usage: node scripts/_run-with-env.mjs scripts/target-script.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(__dir, '../.env.supabase');

const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const target = process.argv[2];
if (!target) { console.error('Usage: node _run-with-env.mjs <script>'); process.exit(1); }

const result = spawnSync('node', [resolve(target)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  },
});

process.exit(result.status ?? 0);
