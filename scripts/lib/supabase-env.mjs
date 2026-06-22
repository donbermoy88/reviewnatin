import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function loadEnvFile(filename) {
  const path = join(ROOT, filename);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

export function getSupabaseEnv() {
  return {
    ...loadEnvFile('.env.supabase'),
    ...loadEnvFile('apps/mobile/.env'),
    ...process.env,
  };
}

export const REPO_ROOT = ROOT;
