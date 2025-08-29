import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from 'react-native';

import type { AppLinkParams, CreateAppLinkResponse, LinkInfo } from './types';

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
  });

  if (typeof result === 'string') {
    return JSON.parse(result);
  }

  return result;
};

/**
 * Fetches referral details from the AppsOnAir deep link service.
 * This method retrieves any available referral metadata associated with the user's session.
 *
 * @returns A Promise that resolves to an object containing referral details, or `null` if no referral data is available.
 */
export const getReferralInfo = async (): Promise<LinkInfo> => {
  let result = await AppsonairReactNativeApplink.getReferralInfo();

  if (typeof result === 'string') {
    JSON.parse(result);
  }

  if (typeof result?.data === 'string') {
    result.data = JSON.parse(result.data);
  }

  return result;
};

/**
 * @deprecated Use `getReferralInfo` instead. This method will be removed in future versions.
 * Fetches referral details from the AppsOnAir deep link service.
 * This method retrieves any available referral metadata associated with the user's session.
 *
 * @returns A Promise that resolves to an object containing referral details, or `null` if no referral data is available.
 */
export const getReferralDetails = async (): Promise<LinkInfo> => {
  let result = await AppsonairReactNativeApplink.getReferralDetails();

  if (typeof result === 'string') {
    JSON.parse(result);
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
 * Subscribes to referral link detection events from the AppsOnAir SDK.
 * When a referral link is detected, the native module emits an
 * `onReferralLinkDetected` event. This helper sets up a listener for that
 * event and forwards the payload to the provided callback.
 *
 * @param {(event: LinkInfo) => void} callback - Function to be called when a deep link is processed.
 * @returns {EmitterSubscription | null} An event subscription, or `null` if the listener could not be registered.
 */
export const onReferralLinkDetected = (
  callback: (event: LinkInfo) => void
): EmitterSubscription | null => {
  return emitter?.addListener('onReferralLinkDetected', callback) ?? null;
};
