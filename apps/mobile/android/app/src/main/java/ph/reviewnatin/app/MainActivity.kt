package ph.reviewnatin.app
import expo.modules.splashscreen.SplashScreenManager

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

private const val PENDING_DEEP_LINK_PREFS = "reviewnatin_deep_link"
private const val PENDING_DEEP_LINK_KEY = "pending_initial_url"

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    val shouldRestartAsMain = captureInitialViewIntent()
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
    if (shouldRestartAsMain) {
      startActivity(Intent(this, MainActivity::class.java).apply {
        action = Intent.ACTION_MAIN
        addCategory(Intent.CATEGORY_LAUNCHER)
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
      })
      finish()
      return
    }
    replayPendingInitialViewIntent()
  }

  private fun captureInitialViewIntent(): Boolean {
    val incoming = intent ?: return false
    if (incoming.action != Intent.ACTION_VIEW) return false
    val url = incoming.dataString ?: return false

    getSharedPreferences(PENDING_DEEP_LINK_PREFS, MODE_PRIVATE)
      .edit()
      .putString(PENDING_DEEP_LINK_KEY, url)
      .apply()
    return true
  }

  private fun replayPendingInitialViewIntent() {
    val prefs = getSharedPreferences(PENDING_DEEP_LINK_PREFS, MODE_PRIVATE)
    val url = prefs.getString(PENDING_DEEP_LINK_KEY, null) ?: return
    prefs.edit().remove(PENDING_DEEP_LINK_KEY).apply()
    Handler(Looper.getMainLooper()).postDelayed({
      startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
        setPackage(packageName)
      })
    }, 4500)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
