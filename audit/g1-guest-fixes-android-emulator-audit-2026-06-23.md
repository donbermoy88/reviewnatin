# G1 Guest Fixes Android Emulator Audit - 2026-06-23

**Device:** `lowend_api35` Android emulator, `emulator-5554`, 768x1280 @ 320 dpi  
**APK:** Fresh local release build installed from `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`  
**Artifacts:** `audit/screenshots/device-beta-audit/g1-guest-fixes-2026-06-23-234330/`

## Commands Run

```sh
"$HOME/Library/Android/sdk/emulator/emulator" -avd lowend_api35 -no-snapshot-load -no-boot-anim
adb wait-for-device
./gradlew assembleRelease
adb uninstall ph.reviewnatin.app || true
adb install -r apps/mobile/android/app/build/outputs/apk/release/app-release.apk
adb shell pm clear ph.reviewnatin.app
adb shell am start -W -n ph.reviewnatin.app/.MainActivity
adb shell am start -W -a android.intent.action.VIEW -d "reviewnatin://subscribe" ph.reviewnatin.app
adb shell am start -W -a android.intent.action.VIEW -d "reviewnatin://signup" ph.reviewnatin.app
adb shell am start -W -a android.intent.action.VIEW -d "reviewnatin://login" ph.reviewnatin.app
adb shell am start -W -a android.intent.action.VIEW -d "reviewnatin://verify-email?email=g1.agent%40reviewnatinph.com" ph.reviewnatin.app
adb shell am start -W -a android.intent.action.VIEW -d "reviewnatin://practice" ph.reviewnatin.app
adb exec-out screencap -p > <artifact>.png
adb exec-out uiautomator dump /dev/tty > <artifact>.xml
adb logcat -d -t 800 > <artifact>-logcat.txt
```

## Results

| Check | Status | Evidence |
|---|---:|---|
| First-launch welcome hero overlap | Pass | `01-first-launch-welcome.png` shows chips, wordmark, headline, body copy, and CTA separated on low-end screen. |
| Cold `reviewnatin://subscribe` | Fail | `07-retest-cold-subscribe-45s.png` remains on blank progress spinner after 45s. |
| Cold `reviewnatin://signup` | Fail | `08-retest-cold-signup-45s.png` remains on blank progress spinner after 45s. |
| Cold `reviewnatin://login` | Fail | `09-retest-cold-login-45s.png` remains on blank progress spinner after 45s. |
| Cold `reviewnatin://verify-email?email=...` | Fail | `10-retest-cold-verify-email-45s.png` remains on blank progress spinner after 45s. |
| Cold `reviewnatin://practice` | Fail | `11-retest-cold-practice-45s.xml` reports `expo-router-unmatched` / `Unmatched Route` for `reviewnatin://practice`. |

## Notes

- Fresh release build completed successfully; no build blocker.
- Emulator boot and APK install completed successfully.
- The first-launch visual overlap fix validates on the low-end emulator.
- The requested cold deeplink fixes do not validate on this APK. The auth/subscribe links are not swallowed by the welcome route visually, but they still hang on the app-level progress spinner. The practice link is not swallowed by welcome or spinner; it resolves to Expo Router unmatched route instead of `/practice/quiz`.
- Logcat for the spinner cases shows `ReactNativeJS: Running "main"` with no captured fatal exception in the 45s window. The practice case additionally logs Expo Linking warnings about multiple possible URI schemes.
