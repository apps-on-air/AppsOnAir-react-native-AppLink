package com.appsonairreactnativeapplink

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
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

      override fun onReferralLinkDetected(result: JSONObject) {
        val map = jsonToWritableMap(result)
        sendEvent("onReferralLinkDetected", map)
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
        is JSONObject -> map.putMap(key, jsonToWritableMap(value))
        is org.json.JSONArray -> map.putArray(key, jsonToWritableArray(value))
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
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
        is JSONObject -> writableArray.pushMap(jsonToWritableMap(value))
        is org.json.JSONArray -> writableArray.pushArray(jsonToWritableArray(value))
        is Boolean -> writableArray.pushBoolean(value)
        is Int -> writableArray.pushInt(value)
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
