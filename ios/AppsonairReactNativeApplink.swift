import Foundation
import React
import AppsOnAir_AppLink

@objc(AppsonairReactNativeApplink)
class AppsonairReactNativeApplink: NSObject {

  let appOnAirLinkService = AppLinkService.shared

  @objc(initialize:withRejecter:)
  func initialize(resolve: @escaping RCTPromiseResolveBlock,
                  reject: @escaping RCTPromiseRejectBlock) {

    appOnAirLinkService.initialize { url, linkInfo in
      if let url = url {
        let eventData: [String: Any] = [
          "url": url.absoluteString,
          "result": linkInfo
        ]

        self.sendEvent(name: "onDeepLinkProcessed", body: eventData)
      } else {
        let eventData: [String: Any] = [
          "url": "",
          "error": "Failed to process deep link"
        ]
        self.sendEvent(name: "onDeepLinkError", body: eventData)
      }
    }
    
    resolve(true)
  }

  @objc(createAppLink:withResolver:withRejecter:)
  func createAppLink(params: NSDictionary,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {

    guard let url = params["url"] as? String,
          let name = params["name"] as? String,
          let urlPrefix = params["urlPrefix"] as? String else {
      reject("INVALID_PARAMS", "Missing required parameters", nil)
      return
    }

    let shortId = params["shortId"] as? String ?? ""

    let socialMeta: [String: String] = [
      "title": params["metaTitle"] as? String ?? "",
      "description": params["metaDescription"] as? String ?? "",
      "imageUrl": params["metaImageUrl"] as? String ?? ""
    ]

    let isOpenInBrowserApple = params["isOpenInBrowserApple"] as? Bool ?? false
    let isOpenInIosApp = params["isOpenInIosApp"] as? Bool ?? true
    let iOSFallbackUrl = params["iOSFallbackUrl"] as? String ?? ""

    let isOpenInBrowserAndroid = params["isOpenInBrowserAndroid"] as? Bool ?? false
    let isOpenInAndroidApp = params["isOpenInAndroidApp"] as? Bool ?? true
    let androidFallbackUrl = params["androidFallbackUrl"] as? String ?? ""

    appOnAirLinkService.createAppLink(
      url: url,
      name: name,
      urlPrefix: urlPrefix,
      shortId: shortId,
      socialMeta: socialMeta,
      isOpenInBrowserApple: isOpenInBrowserApple,
      isOpenInIosApp: isOpenInIosApp,
      iOSFallbackUrl: iOSFallbackUrl,
      isOpenInBrowserAndroid: isOpenInBrowserAndroid,
      isOpenInAndroidApp: isOpenInAndroidApp,
      androidFallbackUrl: androidFallbackUrl
    ) { linkInfo in
      if let status = linkInfo["status"] as? String, status == "SUCCESS" {
        resolve(linkInfo)
      } else {
        let message = linkInfo["message"] as? String ?? "Unknown error"
        let code = linkInfo["statusCode"] as? Int ?? 500
        reject("CREATE_FAILED", message, NSError(domain: "", code: code))
      }
    }
  }

  private func sendEvent(name: String, body: [String: Any]) {
    if let bridge = RCTBridge.current() {
      bridge.enqueueJSCall(
        "RCTDeviceEventEmitter",
        method: "emit",
        args: [name, body],
        completion: nil
      )
    }
  }

  @objc
  func addListener(_ eventName: NSString) {
    // No-op: Required by RN
  }

  @objc
  func removeListeners(_ count: Double) {
    // No-op: Required by RN
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
