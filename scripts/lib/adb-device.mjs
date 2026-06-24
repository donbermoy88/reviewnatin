import { execSync } from 'node:child_process';

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

/** List adb serials in `device` state (USB, emulator, or wireless). */
export function listAdbDevices() {
  const out = runCapture('adb devices');
  return out
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    })
    .filter((d) => d.serial && d.state === 'device');
}

/**
 * Pick target device: explicit serial > wireless/USB physical > emulator.
 * @param {string | undefined} preferredSerial from --device or ADB_SERIAL
 */
export function resolveAdbDevice(preferredSerial) {
  const devices = listAdbDevices();
  if (devices.length === 0) {
    throw new Error(
      'No adb device online. Connect USB/wireless debugging or start an emulator.',
    );
  }

  const wanted = preferredSerial ?? process.env.ADB_SERIAL;
  if (wanted) {
    const match = devices.find((d) => d.serial === wanted);
    if (!match) {
      throw new Error(`Device ${wanted} not found. Online: ${devices.map((d) => d.serial).join(', ')}`);
    }
    return match.serial;
  }

  const physical = devices.find((d) => !d.serial.startsWith('emulator-'));
  if (physical) return physical.serial;

  const emulator = devices.find((d) => d.serial.startsWith('emulator-'));
  if (emulator) return emulator.serial;

  return devices[0].serial;
}

export function adbDevice(preferredSerial) {
  return resolveAdbDevice(preferredSerial);
}

export function deviceKind(serial) {
  if (serial.startsWith('emulator-')) return 'emulator';
  if (serial.includes('_adb-tls-connect._tcp') || serial.includes(':')) return 'wireless';
  return 'usb';
}

/** Pair wireless debugging (Android 11+). pairHost like 192.168.1.5:37891 */
export function adbPair(pairHost, pairingCode) {
  runCapture(`adb pair ${pairHost} ${pairingCode}`);
}

/** Connect after pairing. connectHost like 192.168.1.5:5555 */
export function adbConnect(connectHost) {
  const out = runCapture(`adb connect ${connectHost}`);
  if (/unable to connect|failed/i.test(out)) {
    throw new Error(`adb connect failed: ${out}`);
  }
  return out;
}

export function deviceInfo(serial) {
  const props = ['ro.product.model', 'ro.build.version.release', 'ro.build.version.sdk'];
  const info = { serial, kind: deviceKind(serial) };
  for (const prop of props) {
    try {
      info[prop] = runCapture(`adb -s ${serial} shell getprop ${prop}`);
    } catch {
      info[prop] = null;
    }
  }
  try {
    const dumpsys = runCapture(`adb -s ${serial} shell dumpsys package ph.reviewnatin.app 2>/dev/null | head -5`);
    const versionCode = dumpsys.match(/versionCode=(\d+)/)?.[1];
    const versionName = dumpsys.match(/versionName=([\d.]+)/)?.[1];
    if (versionCode) info.versionCode = versionCode;
    if (versionName) info.versionName = versionName;
  } catch {
    /* app may not be installed */
  }
  return info;
}
