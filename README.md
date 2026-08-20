# AppsOnAir-react-native-AppLink

**AppsOnAir-react-native-AppLink** enables seamless handling of deep links and in-app routing within your React Native app. With simple integration, you can configure, manage, and act on links directly from the web dashboard in real time. For more details, refer to the [documentation](https://documentation.appsonair.com/MobileQuickstart/GettingStarted/).

## 🚀 Features

- ✅ Deep link support (URI schemes and AppLinks)
- ✅ Fallback behavior (e.g., open Play Store or App Store)
- ✅ Custom domain support
- ✅ Referral and install attribution tracking
- ✅ Seamless migration from Firebase Dynamic Links to AppLink

**Note:** For comprehensive instructions on migrating Firebase Dynamic Links to AppLinks, refer to the [documentation](https://documentation.appsonair.com/MobileQuickstart/AppLink/firebase-dynamiclinks-migration).

## Installation

Install the **AppsOnAir React Native AppLink** package using `npm`:

```sh
npm install appsonair-react-native-applink
```

After installation, navigate to your iOS project directory and install the native dependencies using CocoaPods:

```sh
cd ios
pod install
cd ..
```

## Minimum Requirements

### Android

- Android Gradle Plugin (AGP): version 8.0.2 or higher
- Kotlin: version 1.7.10 or higher
- Gradle: version 8.0 or higher

### iOS

- Minimum deployment target: iOS 13.0

## Android Setup

### Adding AppId in AndroidManifest.xml

Add the following `<meta-data>` tag to your application’s AndroidManifest.xml file inside the `<application>` tag:

- Make sure the `android:name` is set to "AppsonairAppId"
- Replace the `android:value` with your actual AppId provided by AppsOnAir

```xml
</application>
    ...
    <meta-data
        android:name="AppsonairAppId"
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

### Adding AppId in Info.plist

- Replace the `<string>` value with your actual AppsOnAir AppId

```xml
<key>AppsonairAppId</key>
<string>XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX</string>
```

### Universal Links (Associated Domains)

To support **Universal Links**, create or edit the `YOUR_PROJECT.entitlements` file and add the following configuration:

```xml
<!-- If Using Universal Links -->
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:YOUR_DOMAIN</string> <!-- Replace with your actual domain -->
</array>
```

> Note: After configuring the Associated Domain for Universal Links, it may take up to 24 hours for the changes to propagate and become active. The setup and verification process is handled by Apple.

To support a **Custom URL Scheme**, add the following to your app’s `Info.plist` file:

```xml
<!-- If Using Custom Url Schema -->
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
// Step 1: Import AppsOnAir_AppLink
import AppsOnAir_AppLink
...

// Step 2: AppLink Class instance create
var window: UIWindow?
let appLinkService = AppLinkService.shared
...

    // Step 3: Handle AppLink Service
    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
        let url = userActivity.webpageURL else {
            return false
        }
        appLinkService.handleAppLink(incomingURL: url)
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        appLinkService.handleAppLink(incomingURL: url)
        return true
    }

```

## Usage

### Function 1: Initialize AppLink

Before handling any deep links, you need to initialize the AppsOnAir AppLink SDK. This is typically done in your app’s entry point — such as inside a top-level component or during app startup.

```tsx
import React, { useEffect } from 'react';
import { initializeAppLink } from 'appsonair-react-native-applink';

const App = () => {
  useEffect(() => {
    // Initialize AppLink on app startup
    initializeAppLink();
  }, []);

  return (
    // your JSX
  );
};
```

### Function 2: Listen for Deep Link Events

Use `onDeepLinkProcessed` to listen for incoming deep links after **initialization**. This allows you to respond to navigation events or extract data from the link.

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

### Function 3: Listen for Attribution Events

Use `onAttributionListener` to listen for attribution data after **initialization**. This allows you to respond to navigation events or extract data from the link.

```tsx
import React, { useEffect } from 'react';
import {
  initializeAppLink,
  onAttributionListener
} from 'appsonair-react-native-applink';

const App = () => {
  useEffect(() => {
    initializeAppLink();

    const sub = onAttributionListener((event) => {
      console.log(`✅ Attribution:\n${JSON.stringify(event, null, 2)}`);
    });

    return () => {
      sub?.remove();
    };
  }, []);

  return (
    // your UI rendering deepLinkResult
  );
};
```

`onAttributionListener` fires at most twice, on both platforms: once when the attribution is first
detected, and once more on the return to the foreground that follows `isFirstLaunch` flipping to
`false`, so the payload carries that flip. It does not fire on later foreground returns — they
would only repeat the same persisted state. Gate any one time logic — analytics, navigation,
granting a referral reward — on `isFirstLaunch` rather than on the callback firing, or
de-duplicate by `shortId`. The payload is the same one
[`getAttributionInfo`](#function-5-get-attribution-info) resolves to.

A plain cold start of an already installed app does not emit: the first detection only runs on the
first launch after installation. Use `getAttributionInfo` when you need the value on demand.

### Function 4: Create a New AppLink

Use `createAppLink` to programmatically generate a **New AppLink** from your React Native app by passing a structured set of parameters.

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
    iosFallbackUrl: '',
    androidFallbackUrl: '',
    shortId: '',
    isOpenInAndroidApp: true,
    isOpenInBrowserAndroid: false,
    isOpenInIosApp: true,
    isOpenInBrowserApple: false,
    // Attribution window for this link, in seconds. An install inside it is attributed to the
    // click; past it the install is treated as organic.
    attributionTtl: 3600,
    // Optional AppsFlyer attribution parameters, forwarded to the API untouched.
    appsFlyer: {
      channel: 'email',
      campaignId: '01',
      campaign: 'summer_sale',
      subs: ['sub1', 'sub2'],
      metaTitle: 'metaTitle',
      metaDescription: 'metaDescription',
    },
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
      <Button title="Create AppLink" onPress={handleCreateLink} />
    </View>
  );
};
```

#### Attribution parameters

Both are optional. Omit them and the link behaves exactly as before.

| Parameter | Type | Description |
| --- | --- | --- |
| `attributionTtl` | Number | Attribution window for this link, **in seconds**. An install that happens within this window of the click is reported as `non-organic` and carries the referral data; once the window has elapsed the click no longer attributes the install, and the referral is re-read from an IP based lookup instead. Applies to `getAttributionInfo()` and both deprecated getters. |
| `appsFlyer` | Object | AppsFlyer attribution parameters, forwarded to the API untouched. Keys beyond the documented ones are passed through as-is. |

`appsFlyer` accepts:

| Key | Type | Description |
| --- | --- | --- |
| `channel` | String | Media source / channel driving traffic to this link. |
| `campaignId` | String | Unique identifier for the marketing campaign. |
| `campaign` | String | Human-readable campaign name. |
| `subs` | String[] | Sub-parameters for granular tracking. |
| `metaTitle` | String | Title used for attribution metadata. |
| `metaDescription` | String | Description used for attribution metadata. |

When a link carries `appsFlyer`, the resulting `appsFlyer` object appears in the payload of
`getAttributionInfo()` and `onAttributionListener`. It is deliberately **absent** from the
deprecated referral surface — `getReferralInfo()`, `getReferralDetails()` and
`onReferralLinkDetected()` — which keeps its original shape.

### Function 5: Get Attribution Info

Use `getAttributionInfo` to retrieve the referral and attribution data for this install.

```tsx
import { Button } from 'react-native';
import { getAttributionInfo } from 'appsonair-react-native-applink';

const App = () => {
  const handleAttributionDetails = async () => {
    try {
      const info = await getAttributionInfo();
      console.log('Attribution Info', JSON.stringify(info, null, 2));
    } catch (err) {
      console.log('Error', JSON.stringify(err, null, 2));
    }
  };

  return <Button title="Get Attribution Info" onPress={handleAttributionDetails} />;
};
```

Along with the referral details, `getAttributionInfo` and `onAttributionListener` add the
following keys inside the `data` object of the response:

| Response Key | Type | Description |
| --- | --- | --- |
| `isFirstLaunch` | Boolean | `true` during the first launch after installation, until the app leaves the foreground. |
| `firstInstallTime` | Long | Timestamp (epoch milliseconds) of the app's first installation. |
| `applink_click_time` | Long | Timestamp (epoch milliseconds) of the click this install is attributed to. Absent when the install referrer carried none. |
| `isConsumed` | Boolean | `true` when `attributionStatus` is `non-organic`. |
| `attributionStatus` | String | `non-organic` when the install happened within `attributionTtl` of the click, `organic` otherwise. |

### Deprecated APIs

The following APIs are deprecated and will be removed in a future release. Existing
integrations keep working, but should migrate:

| Deprecated | Use instead |
| --- | --- |
| `onReferralLinkDetected` | `onAttributionListener` |
| `getReferralInfo` | `getAttributionInfo` |
| `getReferralDetails` | `getAttributionInfo` |

