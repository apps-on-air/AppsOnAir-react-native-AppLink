import UIKit
import AppsOnAir_AppLink

/// iOS 27 requires the UIScene lifecycle for apps built with its SDK.
/// The window and React Native root view are created here instead of in AppDelegate.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    factory.startReactNative(
      withModuleName: "AppsonairReactNativeApplinkExample",
      in: window,
      launchOptions: nil
    )

    // Links that cold-launch the app arrive in connectionOptions.
    if let url = connectionOptions.urlContexts.first?.url {
      AppLinkService.shared.handleAppLink(incomingURL: url)
    } else if let activity = connectionOptions.userActivities.first(where: { $0.activityType == NSUserActivityTypeBrowsingWeb }),
              let url = activity.webpageURL {
      AppLinkService.shared.handleAppLink(incomingURL: url)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    AppLinkService.shared.handleAppLink(incomingURL: url)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let url = userActivity.webpageURL else { return }
    AppLinkService.shared.handleAppLink(incomingURL: url)
  }
}
