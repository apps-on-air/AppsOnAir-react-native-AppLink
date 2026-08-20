import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from 'react-native';

import type {
  AppLinkParams,
  AttributionInfo,
  CreateAppLinkResponse,
  LinkInfo,
} from './types';

export * from './types';

const LINKING_ERROR =
  `The package 'appsonair-react-native-applink' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const AppsonairReactNativeApplink = NativeModules.AppsonairReactNativeApplink
  ? NativeModules.AppsonairReactNativeApplink
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const emitter = NativeModules.AppsonairReactNativeApplink
  ? new NativeEventEmitter(NativeModules.AppsonairReactNativeApplink)
  : null;

/**
 * Initializes the AppsOnAir React Native AppLink module.
 * Should be called once during app startup to set up deep link handling.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if initialization succeeds.
 */
export const initializeAppLink = async (): Promise<boolean> => {
  return await AppsonairReactNativeApplink.initialize();
};

/**
 * Creates a new AppLink using the provided parameters.
 * The resulting AppLink can be used to navigate to specific content within the app.
 *
 * @param {AppLinkParams} params - Parameters used to generate the deep link.
 * @returns {Promise<CreateAppLinkResponse>} A promise that resolves to the generated deep link URL, or `null` if creation fails.
 */
export const createAppLink = async ({
  url,
  name,
  urlPrefix,
  shortId,
  socialMeta,
  isOpenInBrowserAndroid = false,
  isOpenInAndroidApp = true,
  androidFallbackUrl = '',
  isOpenInBrowserApple = false,
  isOpenInIosApp = true,
  iosFallbackUrl = '',
  appsFlyer,
  attributionTtl,
}: AppLinkParams): Promise<CreateAppLinkResponse> => {
  const result = await AppsonairReactNativeApplink.createAppLink({
    url,
    name,
    urlPrefix,
    shortId: shortId === '' ? undefined : shortId,
    metaTitle: socialMeta?.title || null,
    metaDescription: socialMeta?.description || null,
    metaImageUrl: socialMeta?.imageUrl || null,
    isOpenInBrowserAndroid,
    isOpenInAndroidApp,
    androidFallbackUrl,
    isOpenInBrowserApple,
    isOpenInIosApp,
    iosFallbackUrl,
    appsFlyer,
    attributionTtl,
  });

  if (typeof result === 'string') {
    return JSON.parse(result);
  }

  return result;
};

/**
 * Fetches attribution details from the AppsOnAir deep link service.
 *
 * @returns A Promise that resolves to an object containing attribution details.
 */
export const getAttributionInfo = async (): Promise<AttributionInfo> => {
  let result = await AppsonairReactNativeApplink.getAttributionInfo();

  if (typeof result === 'string') {
    result = JSON.parse(result);
  }

  if (typeof result?.data === 'string') {
    result.data = JSON.parse(result.data);
  }

  return result;
};

/**
 * @deprecated Use `getAttributionInfo` instead. This method will be removed in future versions.
 * Fetches referral details from the AppsOnAir deep link service.
 *
 * @returns A Promise that resolves to an object containing referral details.
 */
export const getReferralInfo = async (): Promise<LinkInfo> => {
  let result = await AppsonairReactNativeApplink.getReferralInfo();

  if (typeof result === 'string') {
    result = JSON.parse(result);
  }

  if (typeof result?.data === 'string') {
    result.data = JSON.parse(result.data);
  }

  return result;
};

/**
 * @deprecated Use `getAttributionInfo` instead. This method will be removed in future versions.
 * Fetches referral details from the AppsOnAir deep link service.
 *
 *
 * @returns A Promise that resolves to an object containing referral details.
 */
export const getReferralDetails = async (): Promise<LinkInfo> => {
  let result = await AppsonairReactNativeApplink.getReferralDetails();

  if (typeof result === 'string') {
    result = JSON.parse(result);
  }

  if (typeof result?.data === 'string') {
    result.data = JSON.parse(result.data);
  }

  return result;
};

/**
 * Registers a listener for when a deep link is successfully processed.
 * The callback receives the processed deep link URL and any associated result data.
 *
 * @param {(event: LinkInfo) => void} callback - Function to be called when a deep link is processed.
 * @returns {EmitterSubscription | null} An event subscription, or `null` if the listener could not be registered.
 */
export const onDeepLinkProcessed = (
  callback: (event: LinkInfo) => void
): EmitterSubscription | null => {
  return emitter?.addListener('onDeepLinkProcessed', callback) ?? null;
};

/**
 * Subscribes to attribution events (shape matches `getAttributionInfo`, incl. platform
 * differences). Fires at most twice: on first-install detection, then once more on the
 * next foreground after `isFirstLaunch` flips false (from persisted state, not refetch);
 * later foregrounds/cold starts on an installed app don't emit. Gate on `isFirstLaunch` or dedupe by `shortId`.
 *
 *
 * @param {(event: AttributionInfo) => void} callback - Function to be called when an attribution is detected.
 * @returns {EmitterSubscription | null} An event subscription, or `null` if the listener could not be registered.
 */
export const onAttributionListener = (
  callback: (event: AttributionInfo) => void
): EmitterSubscription | null => {
  return emitter?.addListener('onAttributionListener', callback) ?? null;
};

/**
 * @deprecated Use `onAttributionListener` instead. This method will be removed in future versions.
 * Subscribes to referral link detection events from the AppsOnAir SDK: sets up a listener
 * for the native `onReferralLinkDetected` event and forwards its payload to the callback.
 * shape (no `appsFlyer`, no attribution fields), delivered on detection only; unlike
 * `onAttributionListener`, it does not repeat on the foreground return after `isFirstLaunch` flips false.
 *
 * @param {(event: LinkInfo) => void} callback - Function to be called when a deep link is processed.
 * @returns {EmitterSubscription | null} An event subscription, or `null` if the listener could not be registered.
 */
export const onReferralLinkDetected = (
  callback: (event: LinkInfo) => void
): EmitterSubscription | null => {
  return emitter?.addListener('onReferralLinkDetected', callback) ?? null;
};
