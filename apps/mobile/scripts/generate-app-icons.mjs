#!/usr/bin/env node
/**
 * Generates Expo app icons from assets/brand/icon.svg (Claude Design handoff).
 * Run: npm run generate-icons
 */
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svg = join(root, 'assets/brand/icon.svg');
const assets = join(root, 'assets');
const resvg = 'npx --yes @resvg/resvg-js-cli';

function render(input, output, size) {
  execSync(`${resvg} --fit-width ${size} "${input}" "${output}"`, {
    stdio: 'pipe',
    cwd: root,
  });
}

render(svg, join(assets, 'icon.png'), 1024);
render(svg, join(assets, 'android-icon-foreground.png'), 1024);
render(svg, join(assets, 'splash-icon.png'), 512);
render(join(root, 'assets/brand/splash.svg'), join(assets, 'splash.png'), 1284);
render(svg, join(assets, 'favicon.png'), 48);

const bgSvg = join(root, 'assets/brand/android-bg.svg');
writeFileSync(bgSvg, `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#08245C"/></svg>`);
render(bgSvg, join(assets, 'android-icon-background.png'), 1024);

const monoSvg = join(root, 'assets/brand/icon-monochrome.svg');
writeFileSync(
  monoSvg,
  `<svg width="1024" height="1024" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M46.53,55.92 L18.53,71.92 L25.47,84.08 L53.47,68.08 Z" fill="#FFFFFF"/>
  <circle cx="22" cy="78" r="6.3" fill="#FFFFFF"/>
  <path d="M55.40,66.45 L83.40,32.45 L72.60,23.55 L44.60,57.55 Z" fill="#FFFFFF"/>
  <circle cx="78" cy="28" r="6.3" fill="#FFFFFF"/>
  <circle cx="50" cy="62" r="5.95" fill="#FFFFFF"/>
  <path d="M50.00,17.50 L51.60,22.23 L56.50,21.25 L53.20,25.00 L56.50,28.75 L51.60,27.77 L50.00,32.50 L48.40,27.77 L43.50,28.75 L46.80,25.00 L43.50,21.25 L48.40,22.23 Z" fill="#FFFFFF"/>
</svg>`
);
render(monoSvg, join(assets, 'android-icon-monochrome.png'), 432);

console.log('App icons generated in assets/');
