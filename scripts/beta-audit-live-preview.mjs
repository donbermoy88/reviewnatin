#!/usr/bin/env node
/**
 * Fallback live preview when scrcpy is unavailable.
 * Loops adb screencap → dist/beta/live-device-preview.png and prints persona progress from audit log.
 *
 * Usage:
 *   node scripts/beta-audit-live-preview.mjs
 *   node scripts/beta-audit-live-preview.mjs --device SERIAL --log dist/beta/device-audit-v38-wireless-run.log
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BETA_AI_PERSONAS } from './lib/beta-ai-personas.mjs';
import { adbDevice } from './lib/adb-device.mjs';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const serial = adbDevice(arg('--device', null));
const logPath = join(REPO_ROOT, arg('--log', 'dist/beta/device-audit-v38-wireless-run.log'));
const outPng = join(REPO_ROOT, 'dist/beta/live-device-preview.png');
const intervalMs = Number(arg('--interval', '1500'));

const flowToPersonas = new Map();
for (const p of BETA_AI_PERSONAS) {
  for (const flow of p.flows ?? []) {
    const list = flowToPersonas.get(flow) ?? [];
    list.push(p.id);
    flowToPersonas.set(flow, list);
  }
}

let lastLogSize = 0;
let lastProgress = '';

function parseProgress(text) {
  const personaMatch = text.match(/▶ Persona (\w+)/g);
  const flowMatch = text.match(/flows\/([\w-]+\.yaml)/g);
  const doneMatch = text.match(/✓ Persona (\w+)/g);
  const parts = [];
  if (personaMatch?.length) parts.push(`Persona markers: ${personaMatch.slice(-3).join(', ')}`);
  if (flowMatch?.length) {
    const flow = flowMatch[flowMatch.length - 1].replace('flows/', '');
    const ids = flowToPersonas.get(flow) ?? [];
    parts.push(`Flow: ${flow}${ids.length ? ` → likely ${ids.join('/')}` : ''}`);
  }
  if (doneMatch?.length) parts.push(`Done: ${doneMatch.slice(-3).join(', ')}`);
  if (text.includes('Unable to launch app')) parts.push('⚠ Maestro launch failure (retrying)');
  if (text.includes('Device automated checks passed')) parts.push('✅ Audit complete');
  if (text.includes('persona(s) failed')) {
    const m = text.match(/(\d+) persona\(s\) failed/);
    if (m) parts.push(`⚠ ${m[1]} persona(s) failed`);
  }
  return parts.join(' | ') || '(waiting for audit output…)';
}

function tick() {
  try {
    const png = execSync(`adb -s ${serial} exec-out screencap -p`, { encoding: 'buffer', maxBuffer: 20 * 1024 * 1024 });
    writeFileSync(outPng, png);
  } catch (e) {
    console.error(`[preview] screencap failed: ${e.message}`);
  }

  if (existsSync(logPath)) {
    const text = readFileSync(logPath, 'utf8');
    if (text.length !== lastLogSize) {
      lastLogSize = text.length;
      const progress = parseProgress(text);
      if (progress !== lastProgress) {
        lastProgress = progress;
        console.log(`[${new Date().toLocaleTimeString()}] ${progress}`);
      }
    }
  } else {
    console.log(`[preview] waiting for log: ${logPath}`);
  }
}

console.log(`Live preview → ${outPng.replace(REPO_ROOT + '/', '')}`);
console.log(`Tailing log → ${logPath.replace(REPO_ROOT + '/', '')}`);
console.log(`Device: ${serial} · interval ${intervalMs}ms\n`);

tick();
setInterval(tick, intervalMs);
