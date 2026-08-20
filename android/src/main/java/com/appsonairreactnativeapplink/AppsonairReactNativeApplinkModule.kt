package com.appsonairreactnativeapplink

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import com.appsonair.applink.interfaces.AppLinkListener
import com.appsonair.applink.services.AppLinkService
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import org.json.JSONObject

@ReactModule(name = AppsonairReactNativeApplinkModule.NAME)
class AppsonairReactNativeApplinkModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private val context = reactContext
  private var appLinkService: AppLinkService? = null
  private var pendingIntent: Intent? = null

  init {
    context.addActivityEventListener(this)
  }

  override fun getName(): String {
    return NAME
  }

  @Suppress("DEPRECATION")
  @ReactMethod
  fun initialize(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
        ?: return promise.reject("NO_ACTIVITY", "Activity is null")

    appLinkService = AppLinkService.getInstance(activity)
    appLinkService?.initialize(context, activity.intent, object : AppLinkListener {
      override fun onDeepLinkProcessed(uri: Uri, result: JSONObject) {
        val params = Arguments.createMap()
        params.putString("uri", uri.toString())
        params.putMap("result", jsonToWritableMap(result))
        sendEvent("onDeepLinkProcessed", params)
      }

      override fun onDeepLinkError(uri: Uri?, error: String) {
      }

      override fun onAttributionListener(result: JSONObject) {
        sendEvent("onAttributionListener", jsonToWritableMap(result))
      }

      @Deprecated("Use onAttributionListener instead")
      override fun onReferralLinkDetected(result: JSONObject) {
        sendEvent("onReferralLinkDetected", jsonToWritableMap(result))
      }
    })

    // Handle any pending intent if it arrived before init
    pendingIntent?.let {
      appLinkService?.handleDeepLink(it, context.packageName)
      pendingIntent = null
    }

    promise.resolve(true)
  }

  private fun jsonToWritableMap(json: JSONObject): WritableMap {
    val map = Arguments.createMap()
    val keys = json.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = json.opt(key)
      when (value) {
        // opt() returns the JSONObject.NULL sentinel for JSON nulls, never a Kotlin null. Without
        // this branch it reaches the else and crosses the bridge as the string "null".
        null, JSONObject.NULL -> map.putNull(key)
        is JSONObject -> map.putMap(key, jsonToWritableMap(value))
        is org.json.JSONArray -> map.putArray(key, jsonToWritableArray(value))
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
        // The SDK stores firstInstallTime via put(String, long), so it arrives boxed as a Long and
        // would otherwise stringify. JS numbers are doubles anyway, and epoch millis fit exactly.
        is Long -> map.putDouble(key, value.toDouble())
        is Double -> map.putDouble(key, value)
        is String -> map.putString(key, value)
        else -> map.putString(key, value?.toString())
      }
    }
    return map
  }

  private fun jsonToWritableArray(array: org.json.JSONArray): WritableArray {
    val writableArray = Arguments.createArray()
    for (i in 0 until array.length()) {
      val value = array.opt(i)
      when (value) {
        null, JSONObject.NULL -> writableArray.pushNull()
        is JSONObject -> writableArray.pushMap(jsonToWritableMap(value))
        is org.json.JSONArray -> writableArray.pushArray(jsonToWritableArray(value))
        is Boolean -> writableArray.pushBoolean(value)
        is Int -> writableArray.pushInt(value)
        is Long -> writableArray.pushDouble(value.toDouble())
        is Double -> writableArray.pushDouble(value)
        is String -> writableArray.pushString(value)
        else -> writableArray.pushString(value?.toString())
      }
    }
    return writableArray
  }

  @ReactMethod
  fun createAppLink(params: ReadableMap, promise: Promise) {
    val title = params.getString("metaTitle")?.takeIf { it.isNotEmpty() }
    val description = params.getString("metaDescription")?.takeIf { it.isNotEmpty() }
    val imageUrl = params.getString("metaImageUrl")?.takeIf { it.isNotEmpty() }

    val allNull = title == null && description == null && imageUrl == null

    val socialMeta: Map<String, Any>? = if (allNull) {
      null
    } else {
      mapOf(
        "title" to (title ?: JSONObject.NULL),
        "description" to (description ?: JSONObject.NULL),
        "imageUrl" to (imageUrl ?: JSONObject.NULL)
      )
    }

    // JS numbers always cross the bridge as doubles, so read the ttl as one before narrowing.
    // toHashMap() types its values as nullable; a JS null is serialized as JSON null by the SDK.
    @Suppress("UNCHECKED_CAST")
    val appsFlyer: Map<String, Any>? =
      if (params.hasKey("appsFlyer") && !params.isNull("appsFlyer")) {
        params.getMap("appsFlyer")?.toHashMap() as? Map<String, Any>
      } else {
        null
      }

    val attributionTtl: Int? =
      if (params.hasKey("attributionTtl") && !params.isNull("attributionTtl")) {
        params.getDouble("attributionTtl").toInt()
      } else {
        null
      }

    CoroutineScope(Dispatchers.Main).launch {
      try {
        val result = appLinkService?.createAppLink(
          url = params.getString("url") ?: "",
          name = params.getString("name") ?: "",
          urlPrefix = params.getString("urlPrefix") ?: "",
          shortId = if (params.hasKey("shortId") && !params.isNull("shortId")) params.getString("shortId") else null,
          socialMeta = socialMeta,
          isOpenInBrowserAndroid = params.getBoolean("isOpenInBrowserAndroid"),
          isOpenInAndroidApp = params.getBoolean("isOpenInAndroidApp"),
          androidFallbackUrl = params.getString("androidFallbackUrl") ?: "",
          isOpenInBrowserApple = params.getBoolean("isOpenInBrowserApple"),
          isOpenInIosApp = params.getBoolean("isOpenInIosApp"),
          iosFallbackUrl = params.getString("iosFallbackUrl") ?: "",
          appsFlyer = appsFlyer,
          attributionTtl = attributionTtl,
        )
        promise.resolve(result?.toString())
      } catch (e: Exception) {
        promise.reject("CREATE_FAILED", e.message, e)
      }
    }
  }

  @Deprecated("Use getAttributionInfo instead")
  @Suppress("DEPRECATION")
  @ReactMethod
  fun getReferralDetails(promise: Promise) {
    try {
      val referral = appLinkService?.getReferralDetails()
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

  /**
   * Returns the attribution details along with isFirstLaunch, firstInstallTime, isConsumed
   * and any install referrer params, nested inside the data object.
   */
  @ReactMethod
  fun getAttributionInfo(promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val attribution = appLinkService?.getAttributionInfo()

        if (attribution != null) {
          promise.resolve(jsonToWritableMap(attribution))
        } else {
          promise.reject("NO_ATTRIBUTION", "No attribution details available")
        }
      } catch (e: Exception) {
        promise.reject("ATTRIBUTION_ERROR", e.message, e)
      }
    }
  }

  @Deprecated("Use getAttributionInfo instead")
  @Suppress("DEPRECATION")
  @ReactMethod
  fun getReferralInfo(promise: Promise) {
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val referral = appLinkService?.getReferralInfo()

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
  }

  fun handleIntent(intent: Intent) {
    if (appLinkService != null) {
      appLinkService?.handleDeepLink(intent, context.packageName)
    } else {
      pendingIntent = intent
    }
  }

  override fun onNewIntent(intent: Intent) {
    intent?.let {
      appLinkService?.handleDeepLink(it, context.packageName)
    }
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
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
