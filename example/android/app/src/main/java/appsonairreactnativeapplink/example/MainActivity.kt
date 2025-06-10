package appsonairreactnativeapplink.example

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.content.Intent
import com.appsonairreactnativeapplink.AppsonairReactNativeApplinkModule
import com.facebook.react.ReactApplication

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "AppsonairReactNativeApplinkExample"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)

    val reactContext = (application as? ReactApplication)
      ?.reactNativeHost
      ?.reactInstanceManager
      ?.currentReactContext

    if (reactContext != null) {
      reactContext
        .getNativeModule(AppsonairReactNativeApplinkModule::class.java)
        ?.onNewIntent(intent)
    } else {
      // ReactContext is not yet initialized — consider caching the intent for later use if needed.
    }
  }
}
