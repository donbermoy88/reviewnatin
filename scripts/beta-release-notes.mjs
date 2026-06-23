#!/usr/bin/env node
/**
 * Generate beta release notes (English markdown + Taglish tester message) with SHA-256.
 *
 * Usage:
 *   node scripts/beta-release-notes.mjs --build 30 --apk dist/beta/reviewnatin-beta-v30.apk
 *   node scripts/beta-release-notes.mjs --build 30 --sha256 abc... --cohort free
 *   npm run beta:release-notes -- --build 30 --apk dist/beta/reviewnatin-beta-v30.apk
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { REPO_ROOT } from './lib/supabase-env.mjs';

const DIST = join(REPO_ROOT, 'dist/beta');

function parseArgs(argv) {
  const out = { build: null, apk: null, sha256: null, cohort: 'all', link: '[APK link — Drive or Firebase]' };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--build' && argv[i + 1]) out.build = argv[++i];
    else if (a === '--apk' && argv[i + 1]) out.apk = argv[++i];
    else if (a === '--sha256' && argv[i + 1]) out.sha256 = argv[++i];
    else if (a === '--cohort' && argv[i + 1]) out.cohort = argv[++i];
    else if (a === '--link' && argv[i + 1]) out.link = argv[++i];
  }
  return out;
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readVersion() {
  const appJson = JSON.parse(readFileSync(join(REPO_ROOT, 'apps/mobile/app.json'), 'utf8'));
  return appJson.expo?.version ?? '1.0.0';
}

function cohortFocus(cohort) {
  const map = {
    guest: 'Guest (G1–G4): onboarding → guest mode → 20 Q limit → paywall copy',
    free: 'Free (F1–F4): signup + OTP → practice → ads → mock preview limit',
    premium: 'Premium (P1–P4): web checkout Plus → no ads → full mock → offline',
    all: 'Lahat ng cohort — check [beta-testers.md](../docs/beta-testers.md) kung sino ang focus mo ngayon',
  };
  return map[cohort] ?? map.all;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.build) {
    console.error('Usage: node scripts/beta-release-notes.mjs --build N [--apk path | --sha256 hex] [--cohort guest|free|premium|all] [--link URL]');
    process.exit(1);
  }

  let sha256 = args.sha256;
  let apkPath = args.apk;
  if (apkPath) {
    const full = join(REPO_ROOT, apkPath);
    if (!existsSync(full)) {
      console.error(`APK not found: ${full}`);
      process.exit(1);
    }
    sha256 = sha256File(full);
    apkPath = full;
  }
  if (!sha256) sha256 = '[SHA-256 — run: shasum -a 256 your.apk]';

  const version = readVersion();
  const build = args.build;
  const generated = new Date().toISOString();

  const markdown = [
    `# ReviewNatin Beta v${version} (build ${build})`,
    '',
    `Generated: ${generated}`,
    '',
    '## Install',
    '',
    `**APK:** ${args.link}`,
    apkPath ? `**Local:** \`${apkPath.replace(REPO_ROOT + '/', '')}\`` : '',
    `**SHA-256:** \`${sha256}\``,
    '',
    'Verify before install:',
    '',
    '```bash',
    `shasum -a 256 ${apkPath ? basename(apkPath) : 'reviewnatin-beta-v' + build + '.apk'}`,
    `# must match: ${sha256}`,
    '```',
    '',
    '## Fixed',
    '- ',
    '',
    '## Improved',
    '- ',
    '',
    `## Please test today (${args.cohort})`,
    '',
    `- ${cohortFocus(args.cohort)}`,
    '- [ ] Settings → Report a problem (pre-filled device info)',
    '- [ ] ',
    '',
    '## Known issues',
    '- Plus subscription via web checkout only (Premium cohort; no Play Billing during APK beta)',
    '- Remote push requires Play signing — local reminders only on sideloaded APK',
    '',
    '---',
    '',
    'Report: Settings → Report a problem · [GitHub beta-feedback](https://github.com/donbermoy88/reviewnatin/issues/new?template=beta-feedback.yml) · beta@reviewnatinph.com',
  ]
    .filter(Boolean)
    .join('\n');

  const taglish = [
    `📱 *ReviewNatin Beta v${version} (build ${build})*`,
    '',
    `Download: ${args.link}`,
    `SHA-256: ${sha256}`,
    '',
    '⚠️ Uninstall muna ang lumang ReviewNatin bago i-install. I-enable ang "Install from unknown sources" sa browser o file manager.',
    '',
    '*Ano\'ng bago / na-fix:*',
    '- (ilagay dito ang summary)',
    '',
    `*Pakitest ngayon — ${args.cohort === 'all' ? 'check cohort mo sa roster' : args.cohort + ' cohort'}:*`,
    `- ${cohortFocus(args.cohort)}`,
    '- Settings → Report a problem kung may bug',
    '',
    '*Alam namin:* Plus via web checkout lang sa APK beta (walang Play Billing pa).',
    '',
    'Salamat, testers! 🙏',
  ].join('\n');

  mkdirSync(DIST, { recursive: true });
  const mdPath = join(DIST, `release-notes-build-${build}.md`);
  const taglishPath = join(DIST, `release-notes-taglish-build-${build}.txt`);
  writeFileSync(mdPath, markdown);
  writeFileSync(taglishPath, taglish);

  console.log(`Wrote ${mdPath}`);
  console.log(`Wrote ${taglishPath}`);
  console.log(`\nSHA-256: ${sha256}`);
}

main();
