import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from 'react-native';

const LINKING_ERROR =
  `The package 'appsonair-react-native-applink' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

export type AppLinkParams = {
  url: string;
  name: string;
  urlPrefix: string;
  shortId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaImageUrl?: string;
  isOpenInBrowserAndroid?: boolean;
  isOpenInAndroidApp?: boolean;
  androidFallbackUrl?: string;
  isOpenInBrowserApple?: boolean;
  isOpenInIosApp?: boolean;
  iOSFallbackUrl?: string;
};

interface AppsonairReactNativeApplinkType {
  initialize(): Promise<boolean>;
  createAppLink(params: AppLinkParams): Promise<string | null>;
}

const NativeModule: AppsonairReactNativeApplinkType =
  NativeModules.AppsonairReactNativeApplink
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

export const initializeAppLink = (): Promise<boolean> =>
  NativeModule.initialize();

export const createAppLink = (params: AppLinkParams): Promise<string | null> =>
  NativeModule.createAppLink(params);

export const onDeepLinkProcessed = (
  callback: (event: { url: string; result: string }) => void
): EmitterSubscription | null =>
  emitter?.addListener('onDeepLinkProcessed', callback) ?? null;

export const onDeepLinkError = (
  callback: (event: { url: string; error: string }) => void
): EmitterSubscription | null =>
  emitter?.addListener('onDeepLinkError', callback) ?? null;
