import Foundation
import React
import AppsOnAir_AppLink

@objc(AppsonairReactNativeApplink)
class AppsonairReactNativeApplink: RCTEventEmitter {
    
  private var hasListeners = false
  private var pendingEvents: [[String: Any]] = []
    
  private var pendingDeepLinkEvent: [String: Any]? = nil

  override func supportedEvents() -> [String] {
    return ["onDeepLinkProcessed", "onDeepLinkError"]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  private let appOnAirLinkService = AppLinkService.shared

  @objc override func addListener(_ eventName: String) {
    super.addListener(eventName)
    startObserving()
  }

  @objc override func removeListeners(_ count: Double) {
    stopObserving()
  }

  override func startObserving() {
    hasListeners = true

    if let event = pendingDeepLinkEvent {
      sendEvent(withName: "onDeepLinkProcessed", body: event)
      pendingDeepLinkEvent = nil
    }

    for event in pendingEvents {
      if let name = event["name"] as? String,
      let body = event["body"] as? [String: Any] {
        sendEvent(withName: name, body: body)
      }
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
      self.appOnAirLinkService.initialize { url, linkInfo in
        if let url = url {
          let eventData: [String: Any] = [
            "url": url.absoluteString,
            "result": linkInfo
          ]
          if self.hasListeners {
            self.sendEvent(withName: "onDeepLinkProcessed", body: eventData)
          } else {
            self.pendingDeepLinkEvent = eventData
          }
        }
      }
    }
    resolve(true)
  }

  private func sendEvent(name: String, body: [String: Any]) {
    if hasListeners {
      self.sendEvent(withName: name, body: body)
    } else {
      pendingEvents.append(["name": name, "body": body])
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

    appOnAirLinkService.createAppLink(
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

  @objc(getReferralDetails:withRejecter:)
  func getReferralDetails(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    appOnAirLinkService.getReferralDetails { linkInfo in
      resolve(linkInfo)
    }
  }
}
