package com.appsonairreactnativeapplink

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.appsonair.applink.interfaces.AppLinkListener
import com.appsonair.applink.services.AppLinkService
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import org.json.JSONObject

class AppsonairReactNativeApplinkModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val context = reactContext
  private var deeplinkService: AppLinkService? = null
  private var pendingIntent: Intent? = null

  init {
    context.addActivityEventListener(this)
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun initialize(promise: Promise) {
    val activity = currentActivity ?: return promise.reject("NO_ACTIVITY", "Activity is null")

    deeplinkService = AppLinkService.getInstance(activity)
    deeplinkService?.initialize(context, activity.intent, object : AppLinkListener {
      override fun onDeepLinkProcessed(uri: Uri, result: JSONObject) {
        sendEvent("onDeepLinkProcessed", Arguments.fromBundle(Bundle().apply {
          putString("url", uri.toString())
          putString("result", result.toString())
        }))
      }

      override fun onDeepLinkError(uri: Uri?, error: String) {
        sendEvent("onDeepLinkError", Arguments.fromBundle(Bundle().apply {
          putString("url", uri?.toString() ?: "")
          putString("error", error)
        }))
      }
    })

    // Handle any pending intent if it arrived before init
    pendingIntent?.let {
      deeplinkService?.handleDeepLink(it, context.packageName)
      pendingIntent = null
    }

    promise.resolve(true)
  }

  @ReactMethod
  fun createAppLink(params: ReadableMap, promise: Promise) {
    val socialMeta = mapOf(
      "title" to params.getString("metaTitle")?.takeIf { it.isNotEmpty() },
      "description" to params.getString("metaDescription")?.takeIf { it.isNotEmpty() },
      "imageUrl" to params.getString("metaImageUrl")?.takeIf { it.isNotEmpty() }
    )

    CoroutineScope(Dispatchers.Main).launch {
      try {
        val result = deeplinkService?.createAppLink(
          url = params.getString("url") ?: "",
          name = params.getString("name") ?: "",
          urlPrefix = params.getString("urlPrefix") ?: "",
          shortId = params.getString("shortId") ?: "",
          socialMeta = socialMeta,
          isOpenInBrowserAndroid = params.getBoolean("isOpenInBrowserAndroid") ?: false,
          isOpenInAndroidApp = params.getBoolean("isOpenInAndroidApp") ?: true,
          androidFallbackUrl = params.getString("androidFallbackUrl") ?: "",
          isOpenInBrowserApple = params.getBoolean("isOpenInBrowserApple") ?: false,
          isOpenInIosApp = params.getBoolean("isOpenInIosApp") ?: true,
          iOSFallbackUrl = params.getString("iOSFallbackUrl") ?: "",
        )
        promise.resolve(result?.toString())
      } catch (e: Exception) {
        promise.reject("CREATE_FAILED", e.message, e)
      }
    }
  }

  @ReactMethod
  fun getReferralDetails(promise: Promise) {
    try {
      val referral = deeplinkService?.getReferralDetails()
      if (referral != null) {
        val referralMap = Arguments.createMap()
        referral.keys().forEach { key ->
          val value = referral.opt(key)
          when (value) {
            is String -> referralMap.putString(key, value)
            is Int -> referralMap.putInt(key, value)
            is Double -> referralMap.putDouble(key, value)
            is Boolean -> referralMap.putBoolean(key, value)
            else -> referralMap.putString(key, value?.toString() ?: "")
          }
        }
        promise.resolve(referralMap)
      } else {
        promise.reject("NO_REFERRAL", "No referral details available")
      }
    } catch (e: Exception) {
      promise.reject("REFERRAL_ERROR", e.message, e)
    }
  }

  fun handleIntent(intent: Intent) {
    if (deeplinkService != null) {
      deeplinkService?.handleDeepLink(intent, context.packageName)
    } else {
      pendingIntent = intent
    }
  }

  override fun onNewIntent(intent: Intent?) {
    intent?.let {
      deeplinkService?.handleDeepLink(it, context.packageName)
    }
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
    // No-op
  }

  private fun sendEvent(eventName: String, params: WritableMap) {
    context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  @ReactMethod
  fun addListener(eventName: String?) {
    // Required for RN event emitter support
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for RN event emitter support
  }

  companion object {
    const val NAME = "AppsonairReactNativeApplink"
  }
}
