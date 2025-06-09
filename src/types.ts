export interface AppLinkParams {
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
}

export interface CreateAppLinkResponse {
  status: string;
  data: string;
  message: {
    shortUrl: string;
  };
}
