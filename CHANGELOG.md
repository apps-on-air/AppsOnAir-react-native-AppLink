## 2.0.0

* `getReferralInfo()` is now deprecated, use `getAttributionInfo()` instead.

* Introduced `getAttributionInfo()` method.
    * Returns the same data as `getReferralInfo()` with additional `isFirstLaunch`, `firstInstallTime`, `isConsumed` and `attributionStatus` fields included in the response.

* Introduced `onAttributionListener()` listener.
    * When an attribution is detected, and again every time the app returns to the foreground so the payload stays current.

* Added `appsFlyer` and `attributionTtl` params to `AppLinkParams` for AppsFlyer attribution support in `createAppLink` method.

**Deprecated:**

* `onReferralLinkDetected()` — use `onAttributionListener()`.
* `getReferralInfo()` and `getReferralDetails()` — use `getAttributionInfo()`.

## 1.2.5

- Improvements & fixes.

## 1.2.4

- Improvements & fixes.

## 1.2.3

- Referral tracking enhancement.

## 1.2.2

- iOS dependency upgrade

## 1.2.1

- Dependencies upgrade and improvements

## 1.2.0

- `getReferralDetails()` method is now deprecated use `getReferralInfo()` instead.

- Introduced `onReferralLinkDetected()` listner.
  - It is triggered only when the app is installed and launched for the first time with a referral details.

## 1.1.5

- Add Objective-C++ support

## 1.1.4

- Added additional information in Referral Details

## 1.1.3

- @ReactModule crash fix in Android

## 1.1.2

- Update native dependency

## 1.1.1

- Documentation Update

## 1.1.0

- Parameters have been standardized to camelCase across the project.
- SocialMeta params will now be an object.
- Example usage has been updated for clarity and consistency.
- README.md has been improved to reflect the latest changes and usage patterns.

## 1.0.2

- Fix Type issue for CreateAppLinkResponse

## 1.0.1

- Readme file updated.

## 1.0.0

- Initial stable release.

## 0.1.1

- Update native dependency

## 0.1.0

- Update native dependency

## 0.0.1

- Initial Release (Beta)
