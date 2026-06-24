#!/usr/bin/env node
/**
 * Pair and connect a physical Android device over wireless debugging.
 *
 * On the phone: Settings → Developer options → Wireless debugging
 *   1. Tap "Pair device with pairing code" → note IP:port + 6-digit code
 *   2. After pair succeeds, note the main "IP address & port" for connect
 *
 * Usage:
 *   node scripts/adb-wireless-pair.mjs --pair 192.168.1.5:37891 --code 123456
 *   node scripts/adb-wireless-pair.mjs --connect 192.168.1.5:5555
 *   node scripts/adb-wireless-pair.mjs --pair ... --code ... --connect ...
 */
import { adbConnect, adbPair, deviceInfo, listAdbDevices, resolveAdbDevice } from './lib/adb-device.mjs';

const args = process.argv.slice(2);

function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

const pairHost = arg('--pair');
const code = arg('--code');
const connectHost = arg('--connect');

if (!pairHost && !connectHost) {
  console.log(`Usage:
  node scripts/adb-wireless-pair.mjs --pair IP:PAIR_PORT --code 123456 [--connect IP:PORT]
  node scripts/adb-wireless-pair.mjs --connect IP:PORT

Current devices:`);
  for (const d of listAdbDevices()) console.log(`  ${d.serial}\t${d.state}`);
  process.exit(pairHost || connectHost ? 0 : 1);
}

try {
  if (pairHost) {
    if (!code) throw new Error('--code required with --pair');
    console.log(`Pairing ${pairHost}…`);
    adbPair(pairHost, code);
    console.log('Pair OK');
  }
  if (connectHost) {
    console.log(`Connecting ${connectHost}…`);
    console.log(adbConnect(connectHost));
  }
  const serial = resolveAdbDevice(connectHost ?? undefined);
  console.log('\nDevice ready:', JSON.stringify(deviceInfo(serial), null, 2));
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
