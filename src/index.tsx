import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from 'react-native';

import type { AppLinkParams, CreateAppLinkResponse } from './types';

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
 * Initializes the Appsonair React Native AppLink module.
 * Should be called once during app startup to set up deep link handling.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if initialization succeeds.
 */
export const initializeAppLink = async (): Promise<boolean> => {
  return await AppsonairReactNativeApplink.initialize();
};

/**
 * Creates a new app link using the provided parameters.
 * The resulting app link can be used to navigate to specific content within the app.
 *
 * @param {AppLinkParams} params - Parameters used to generate the deep link.
 * @returns {Promise<CreateAppLinkResponse>} A promise that resolves to the generated deep link URL, or `null` if creation fails.
 */
export const createAppLink = async (
  params: AppLinkParams
): Promise<CreateAppLinkResponse> => {
  const result = await AppsonairReactNativeApplink.createAppLink(params);

  if (typeof result === 'string') {
    return JSON.parse(result);
  }

  return result;
};

/**
 * Fetches referral details from the Appsonair deep link service.
 * This method retrieves any available referral metadata associated with the user's session.
 *
 * @returns A Promise that resolves to an object containing referral details, or `null` if no referral data is available.
 */
export const getReferralDetails = async (): Promise<any> => {
  return await AppsonairReactNativeApplink.getReferralDetails();
};

/**
 * Registers a listener for when a deep link is successfully processed.
 * The callback receives the processed deep link URL and any associated result data.
 *
 * @param {(event: { url: string; result: string }) => void} callback - Function to be called when a deep link is processed.
 * @returns {EmitterSubscription | null} An event subscription, or `null` if the listener could not be registered.
 */
export const onDeepLinkProcessed = (
  callback: (event: { url: string; result: string }) => void
): EmitterSubscription | null => {
  return emitter?.addListener('onDeepLinkProcessed', callback) ?? null;
};
