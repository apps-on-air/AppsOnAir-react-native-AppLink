## ![pub package](https://appsonair.com/images/logo.svg)

# AppsOnAir-react-native-AppLink

**AppsOnAir-react-native-AppLink** enables seamless handling of deep links and in-app routing within your React Native app. With simple integration, you can configure, manage, and act on links directly from the web dashboard in real time. For more details, refer to the [documentation](https://documentation.appsonair.com/MobileQuickstart/GettingStarted/).

## 🚀 Features

- ✅ Deep link support (URI schemes and App Links)
- ✅ Fallback behavior (e.g., open Play Store or App Store)
- ✅ Custom domain support
- ✅ Seamless firebase dynamic link migration to AppLink

## Minimum Requirements

### Android

- Android Gradle Plugin (AGP): version 8.0.2 or higher
- Kotlin: version 1.7.10 or higher
- Gradle: version 8.0 or higher

### iOS

- Minimum deployment target: iOS 13.0

## Android Setup

### Adding Application ID in AndroidManifest.xml

Add the following `<meta-data>` tag to your application’s AndroidManifest.xml file inside the `<application>` tag:

- Make sure the `android:name` is set to "appId"
- Replace the `android:value` with your actual Application ID provided by AppsOnAir

```xml
</application>
    ...
    <meta-data
        android:name="appId"
        android:value="********-****-****-****-************" />
</application>
```

### Adding Intent-Filter in AndroidManifest.xml

Add the following `<intent-filter>` inside the `<activity>` tag of your main activity in AndroidManifest.xml:

- Replace **your-domain.com** with your actual domain configured in AppsOnAir.

```xml
 <intent-filter android:autoVerify="true">
   <action android:name="android.intent.action.VIEW" />
   <category android:name="android.intent.category.DEFAULT" />
   <category android:name="android.intent.category.BROWSABLE" />
    <data
     android:host="your-domain.com"
     android:scheme="https" />
 </intent-filter>
```

If you're using a custom URI scheme, add this additional `<intent-filter>` block under the same activity:

- Replace **your-domain.com** and **your-scheme** with the custom domain and scheme you’ve defined.

```xml
 <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
     android:host="your-domain.com"
     android:scheme="your-scheme" />
</intent-filter>
```

Update your MainActivity.kt to handle incoming deep links by overriding the onNewIntent method.

### Handling Deep Links in MainActivity

Update your `MainActivity.kt` to handle incoming deep links by overriding the onNewIntent method.

Make sure the following imports are present at the top of your `MainActivity.kt`:

```kt
import android.content.Intent
import com.appsonairreactnativeapplink.AppsonairReactNativeApplinkModule
import com.facebook.react.ReactApplication
```

In your `MainActivity.kt` class (which should extend ReactActivity), override the `onNewIntent` method as shown below:

```kt
class MainActivity : ReactActivity() {
    ...
    ...
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
        }
    }
}
```

## iOS Setup

### Adding Application ID in Info.plist

- Replace the `<string>` value with your actual AppsOnAir Application ID

```xml
<key>AppsOnAirAPIKey</key>
<string>XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX</string>
```

### Universal Links (Associated Domains)

To support **Universal Links**, create or edit the `YOUR_PROJECT.entitlements` file and add the following configuration:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:YOUR_DOMAIN</string> <!-- Replace with your actual domain -->
</array>
```

> Note: After configuring the Associated Domain for Universal Links, it may take up to 24 hours for the changes to propagate and become active. The setup and verification process is handled by Apple.

To support a **Custom URL Scheme**, add the following to your app’s `Info.plist` file:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>YOUR_URL_NAME</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_CUSTOM_URL_SCHEME</string> <!-- Replace with your custom URL scheme -->
        </array>
    </dict>
</array>
```

> Replace YOUR_URL_NAME with a descriptive name for your app, and YOUR_CUSTOM_URL_SCHEME with the scheme you want to use.

### iOS Deep Link Handling in AppDelegate.swift

To handle both Universal Links and Custom URL Schemes, add the following methods to your `AppDelegate.swift` file:

```swift
import AppsOnAir_AppLink
...

  var window: UIWindow?
  let appOnAirLinkService = AppLinkService.shared
  ...

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
            let url = userActivity.webpageURL else {
        return false
    }
    appOnAirLinkService.handleAppLink(incomingURL: url)
    return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    appOnAirLinkService.handleAppLink(incomingURL: url)
    return true
    }
```

## Installation

Install the **AppsOnAir React Native AppLink** package using `npm`:

```sh
npm install appsOnAir-react-native-appLink
```

After installation, navigate to your iOS project directory and install the native dependencies using CocoaPods:

```sh
cd ios
pod install
cd ..
```

## Usage

### Function 1: Initialize App Link

Before handling any deep links, you need to initialize the AppsOnAir AppLink SDK. This is typically done in your app’s entry point — such as inside a top-level component or during app startup.

#### Example (Using useEffect in a functional component)

```tsx
import React, { useEffect } from 'react';
import { initializeAppLink } from 'appsonair-react-native-applink';

const App = () => {
  useEffect(() => {
    // Initialize App Link on app startup
    initializeAppLink();
  }, []);

  return (
    // your JSX
  );
};
```

### Function 2: Listen for Deep Link Events

Use `onDeepLinkProcessed` to listen for incoming deep links after initialization. This allows you to respond to navigation events or extract data from the link.

```tsx
import React, { useEffect } from 'react';
import {
  initializeAppLink,
  onDeepLinkProcessed,
} from 'appsonair-react-native-applink';

const App = () => {
  useEffect(() => {
    initializeAppLink();

    // Subscribe to deep link events
    const sub = onDeepLinkProcessed(event => {
      console.log(`✅ Processed:\n${JSON.stringify(event, null, 2)}`);
    });

    // Cleanup on unmount
    return () => {
      sub?.remove();
    };
  }, []);

  return (
    // your UI rendering deepLinkResult
  );
};
```

### Function 3: Create a New App Link

Use `createAppLink` to programmatically generate a new App Link from your React Native app by passing a structured set of parameters.

```tsx
import React, { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import {
  createAppLink,
  type AppLinkParams,
  type CreateAppLinkResponse,
} from 'appsonair-react-native-applink';

const App = () => {
  const [linkParams, setLinkParams] = useState<AppLinkParams>({
    name: '',
    url: '',
    urlPrefix: '', // Replace with your actual domain prefix
    metaTitle: '',
    metaDescription: '',
    metaImageUrl: '',
    iOSFallbackUrl: '',
    androidFallbackUrl: '',
    shortId: '',
    isOpenInAndroidApp: true,
    isOpenInBrowserAndroid: false,
    isOpenInIosApp: true,
    isOpenInBrowserApple: false,
  });

  const handleCreateLink = async () => {
    try {
      const result: CreateAppLinkResponse = await createAppLink(linkParams);

      if ('error' in result) {
        throw new Error(result.error);
      }

      if ('status' in result && result.status !== 'SUCCESS') {
        throw new Error(result.message);
      }

      if ('data' in result) {
        const shortUrl = result.data.shortUrl;

        Alert.alert('AppLink Created', shortUrl);
      } else {
        throw new Error(
          result.message ?? 'No data returned from createAppLink'
        );
      }
    } catch (err: any) {
      console.log(err);
      Alert.alert('Error Creating Link', err.message || 'Unknown error');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Enter URL"
        value={linkParams.url}
        onChangeText={(text) => setLinkParams({ ...linkParams, url: text })}
      />
      <Button title="Create App Link" onPress={handleCreateLink} />
    </View>
  );
};
```

### Function 4: Get Referral Details

Use `getReferralDetails` to retrieve any referral data passed through a deep link.

```tsx
import { Button } from 'react-native';
import { getReferralDetails } from 'appsonair-react-native-applink';

const App = () => {
  const handleReferralDetails = async () => {
    try {
      const info = await getReferralDetails();
      console.log('Referral Info', JSON.stringify(info, null, 2));
    } catch (err) {
      console.log('Error', JSON.stringify(err, null, 2));
    }
  };

  return <Button title="Get Referral Info" onPress={handleReferralDetails} />;
};
```
