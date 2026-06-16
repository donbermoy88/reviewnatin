#!/usr/bin/env node
/**
 * Starts the Expo dev-client server in a mode that a real Android phone can
 * actually reach.
 *
 * The red screen "LoadBundleFromServerRequestError: Could not load bundle"
 * usually means the installed dev client is fine, but the phone cannot reach
 * Metro over the current network. This script avoids fragile LAN detection:
 *
 * - USB device connected: set up adb reverse and start Metro on localhost.
 * - No USB or --tunnel: start Expo tunnel for cross-network testing.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, '..');

const args = new Set(process.argv.slice(2));
const forceTunnel = args.has('--tunnel');
const noClear = args.has('--no-clear');
const help = args.has('--help') || args.has('-h');

if (help) {
  console.log(`Usage:
  node scripts/start-android-device.mjs [--tunnel] [--no-clear]

Options:
  --tunnel    Force Expo tunnel mode. Use this when the phone is not connected by USB.
  --no-clear  Do not clear Metro cache.

Recommended:
  1. Connect Android phone by USB and enable USB debugging.
  2. Run: node scripts/start-android-device.mjs
  3. Open the installed ReviewNatin dev client.
`);
  process.exit(0);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function connectedAndroidDevices() {
  if (!commandExists('adb')) return [];
  const result = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial]) => serial);
}

function adbReverse(serial, port) {
  const result = spawnSync('adb', ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`], {
    encoding: 'utf8',
  });
  if (result.status === 0) return true;
  console.warn(`adb reverse failed for ${serial} tcp:${port}: ${result.stderr.trim()}`);
  return false;
}

function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = net.createServer();
    server.once('error', () => resolvePort(false));
    server.once('listening', () => {
      server.close(() => resolvePort(true));
    });
    server.listen(port);
  });
}

async function choosePort() {
  const requested = Number(process.env.EXPO_DEV_SERVER_PORT);
  const candidates = Number.isInteger(requested) && requested > 0
    ? [requested]
    : [8081, 8082, 8083, 8084, 10000];

  for (const port of candidates) {
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`No free Expo dev-server port found from: ${candidates.join(', ')}`);
}

function run(command, commandArgs, options = {}) {
  console.log(`$ ${command} ${commandArgs.join(' ')}`);
  const child = spawn(command, commandArgs, {
    cwd: appRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      APP_VARIANT: process.env.APP_VARIANT ?? 'development',
      EXPO_NO_TELEMETRY: process.env.EXPO_NO_TELEMETRY ?? '1',
      ...options.env,
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

if (!existsSync(resolve(appRoot, 'package.json'))) {
  console.error(`Cannot find apps/mobile/package.json from ${appRoot}`);
  process.exit(1);
}

const devices = connectedAndroidDevices();
const useTunnel = forceTunnel || devices.length === 0;
const port = await choosePort();
console.log(`Using Expo dev-server port ${port}.`);

if (useTunnel) {
  if (!forceTunnel) {
    console.warn('No USB Android device found through adb; starting Expo tunnel instead.');
  }
  const expoArgs = ['expo', 'start', '--dev-client', '--tunnel', '--port', String(port)];
  if (!noClear) expoArgs.push('--clear');
  run('npx', expoArgs);
} else {
  console.log(`Android device(s) detected: ${devices.join(', ')}`);
  for (const serial of devices) {
    // Expo SDKs have used different local ports across dev-client/Metro flows.
    // Reversing all common ports is harmless and prevents stale launcher URLs.
    for (const forwardedPort of [port, 8081, 10000, 19000, 19001, 19002]) {
      adbReverse(serial, forwardedPort);
    }
  }
  const expoArgs = ['expo', 'start', '--dev-client', '--android', '--localhost', '--port', String(port)];
  if (!noClear) expoArgs.push('--clear');
  run('npx', expoArgs);
}
