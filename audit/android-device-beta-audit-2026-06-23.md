# Android Physical Device Beta Audit — 2026-06-23 (partial)

**Device:** Vivo V2427 · Android 16 (API 36)  
**Connection:** wireless · `192.168.1.7:42405` (session ended — device offline)  
**APK tested:** build **36** preview (`dist/beta/reviewnatin-beta-v36.apk`)  
**Roster:** [beta-testers.md](../docs/beta-testers.md)

## Session summary

| Step | Result |
|------|--------|
| Wireless pair (`192.168.1.7:43289` + code) | **OK** |
| `adb connect 192.168.1.7:42405` | **OK** |
| Install debug APK (Play paywall refactor) | **OK** |
| Install preview v36 APK | **OK** |
| Maestro 12-persona smokes | **BLOCKED** — launch failures / gRPC timeout; device went **offline** |
| ADB-only cohort audit | **NOT COMPLETED** — reconnect refused (refresh port on phone) |

## Blocker

Wireless debugging port expired or phone slept. Re-open **Settings → Developer options → Wireless debugging** and send:

1. New **pair IP:port** + **6-digit code** (if pairing required again)
2. New **IP address & port** for `adb connect`

Then run:

```bash
npm run adb:wireless -- --pair IP:PAIR_PORT --code XXXXXX --connect IP:PORT
npm run beta:device-audit -- --adb-only --device IP:PORT --apk dist/beta/reviewnatin-beta-v36.apk
```

`--adb-only` runs deeplink spot-checks + screenshots for all 12 personas in one session (no Maestro — more reliable over wireless).

## 12-persona results

| Persona | Cohort | Automated | Notes |
|---------|--------|-----------|-------|
| G1–G4 | guest | pending | Re-run after reconnect |
| F1–F4 | free | pending | Re-run after reconnect |
| P1–P4 | premium | pending | Re-run after reconnect; P2–P4 need signed-in Play purchase (manual) |

Report JSON: `dist/beta/last-device-audit-report.json`
