#!/usr/bin/env node
/**
 * Bundle audit helper (Sprint 5 — performance).
 *
 * Runs an Expo production export and reports the largest JS bundles so we can
 * track bundle size over time and spot heavy dependencies (AdMob, IAP, PostHog,
 * Sentry, Reanimated). Measurement only — does not modify the app.
 *
 * Usage:
 *   node scripts/analyze-bundle.mjs [--platform android|ios] [--no-export]
 *
 * --no-export reuses an existing ./dist from a prior `expo export`.
 */
import { execSync } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const platform = (() => {
  const i = args.indexOf('--platform');
  return i >= 0 && args[i + 1] ? args[i + 1] : 'android';
})();
const skipExport = args.includes('--no-export');

const distDir = join(process.cwd(), 'dist');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push({ path: full, size: statSync(full).size });
  }
  return out;
}

if (!skipExport) {
  console.log(`\n› Exporting Expo bundle (platform=${platform})…\n`);
  execSync(`npx expo export --platform ${platform} --output-dir dist`, {
    stdio: 'inherit',
  });
}

if (!existsSync(distDir)) {
  console.error('No ./dist directory found. Run without --no-export first.');
  process.exit(1);
}

const files = walk(distDir);
const jsFiles = files
  .filter((f) => f.path.endsWith('.js') || f.path.endsWith('.hbc'))
  .sort((a, b) => b.size - a.size);

const totalJs = jsFiles.reduce((sum, f) => sum + f.size, 0);
const totalAll = files.reduce((sum, f) => sum + f.size, 0);

console.log('\n=== Bundle audit ===');
console.log(`Total exported assets: ${formatBytes(totalAll)}`);
console.log(`Total JS/HBC:          ${formatBytes(totalJs)}\n`);
console.log('Largest JS bundles:');
for (const f of jsFiles.slice(0, 10)) {
  console.log(`  ${formatBytes(f.size).padStart(10)}  ${f.path.replace(distDir, 'dist')}`);
}
console.log('\nTip: add `--source-maps` to expo export and run source-map-explorer for per-module breakdown.\n');
