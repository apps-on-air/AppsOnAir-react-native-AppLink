import Foundation
import React
import AppsOnAir_AppLink

@objc(AppsonairReactNativeApplink)
class AppsonairReactNativeApplink: RCTEventEmitter {
    
  private var hasListeners = false
  private var pendingEvents: [(name: String, body: [String: Any])] = []

  override func supportedEvents() -> [String] {
    return ["onDeepLinkProcessed", "onReferralLinkDetected", "onAttributionListener"]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private let appLinkService = AppLinkService.shared

  @objc override func addListener(_ eventName: String) {
    super.addListener(eventName)
    startObserving()
  }

  @objc override func removeListeners(_ count: Double) {
    stopObserving()
  }

  override func startObserving() {
    hasListeners = true

    for event in pendingEvents {
      sendEvent(withName: event.name, body: event.body)
    }
    pendingEvents.removeAll()
  }

  override func stopObserving() {
    hasListeners = false
  }

  @objc(initialize:withRejecter:)
  func initialize(resolve: @escaping RCTPromiseResolveBlock,
                  reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.appLinkService.initialize(
        onDeepLinkProcessed: { url, linkInfo in
          if let url = url {
            self.sendEvent(name: "onDeepLinkProcessed", body: [
              "uri": url.absoluteString,
              "result": linkInfo
            ])
          }
        },
        onAttributionListener: { attributionInfo in
          self.sendEvent(name: "onAttributionListener", body: attributionInfo)
          // Kept so existing onReferralLinkDetected subscribers keep working. The SDK's own
          // onReferralLinkDetected passes the bare referral dictionary, but we forward the
          // enriched attribution payload — a superset — to match the Android bridge.
          self.sendEvent(name: "onReferralLinkDetected", body: attributionInfo)
        }
      )
    }
    resolve(true)
  }

  private func sendEvent(name: String, body: [String: Any]) {
    if hasListeners {
      self.sendEvent(withName: name, body: body)
    } else {
      pendingEvents.append((name: name, body: body))
    }
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

    let shortId = params["shortId"] is NSNull ? nil : params["shortId"] as? String

    let title = (params["metaTitle"] as? String).flatMap { $0.isEmpty ? nil : $0 }
    let description = (params["metaDescription"] as? String).flatMap { $0.isEmpty ? nil : $0 }
    let imageUrl = (params["metaImageUrl"] as? String).flatMap { $0.isEmpty ? nil : $0 }

    var socialMeta: [String: String?]? = nil

    if title != nil || description != nil || imageUrl != nil {
      socialMeta = [
        "title": title,
        "description": description,
        "imageUrl": imageUrl
      ]
    }

    let isOpenInBrowserApple = params["isOpenInBrowserApple"] as? Bool ?? false
    let isOpenInIosApp = params["isOpenInIosApp"] as? Bool ?? true
    let iosFallbackUrl = params["iosFallbackUrl"] as? String ?? ""

    let isOpenInBrowserAndroid = params["isOpenInBrowserAndroid"] as? Bool ?? false
    let isOpenInAndroidApp = params["isOpenInAndroidApp"] as? Bool ?? true
    let androidFallbackUrl = params["androidFallbackUrl"] as? String ?? ""

    // A JS `undefined` is dropped crossing the bridge, but an explicit `null` arrives as NSNull,
    // so both cases have to collapse back to nil before reaching the SDK.
    // The rest of this call resolves to the Swift-native createAppLink overload (Bool? flags),
    // so the ttl has to be an Int? rather than the NSNumber? the @objc overload wants.
    let appsFlyer = params["appsFlyer"] as? [String: Any]
    let attributionTtl = (params["attributionTtl"] as? NSNumber)?.intValue

    appLinkService.createAppLink(
      url: url,
      name: name,
      urlPrefix: urlPrefix,
      shortId: shortId,
      socialMeta: socialMeta,
      isOpenInBrowserApple: isOpenInBrowserApple,
      isOpenInIosApp: isOpenInIosApp,
      iosFallbackUrl: iosFallbackUrl,
      isOpenInAndroidApp: isOpenInAndroidApp,
      isOpenInBrowserAndroid: isOpenInBrowserAndroid,
      androidFallbackUrl: androidFallbackUrl,
      appsFlyer: appsFlyer,
      attributionTtl: attributionTtl
    ) { linkInfo in
      if let status = linkInfo["status"] as? String, status == "SUCCESS" {
        resolve(linkInfo)
      } else {
        let message = linkInfo["message"] as? String ?? linkInfo["error"] as? String ?? "Unknown error"
        let code = linkInfo["statusCode"] as? Int ?? 500
        reject("CREATE_FAILED", message, NSError(domain: "", code: code))
      }
    }
  }

  @available(*, deprecated, message: "Use getAttributionInfo instead")
  @objc(getReferralDetails:withRejecter:)
  func getReferralDetails(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    appLinkService.getReferralDetails { linkInfo in
      resolve(linkInfo)
    }
  }

  @available(*, deprecated, message: "Use getAttributionInfo instead")
  @objc(getReferralInfo:withRejecter:)
  func getReferralInfo(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    appLinkService.getReferralInfo { linkInfo in
      resolve(linkInfo)
    }
  }

  /// Returns the referral details with `isFirstLaunch`, `firstInstallTime`, `isConsumed` and
  /// (clipboard / advanced deferred link approach only) `attributionStatus` nested in `data`.
  @objc(getAttributionInfo:withRejecter:)
  func getAttributionInfo(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    appLinkService.getAttributionInfo { attributionInfo in
      resolve(attributionInfo)
    }
  }
}
