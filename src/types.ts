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

export type CreateAppLinkResponse =
  | {
      status: string;
      message: string;
      data: {
        shortUrl: string;
      };
    }
  | {
      status: string;
      message: string;
    }
  | {
      error: string;
    };
