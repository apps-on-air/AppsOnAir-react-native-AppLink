export type AppLinkParams = {
  url: string;
  name: string;
  urlPrefix: string;
  shortId?: string;
  socialMeta?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  isOpenInBrowserAndroid?: boolean;
  isOpenInAndroidApp?: boolean;
  androidFallbackUrl?: string;
  isOpenInBrowserApple?: boolean;
  isOpenInIosApp?: boolean;
  iosFallbackUrl?: string;
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
      statusCode: number;
      message: string;
    }
  | {
      error: string;
    };
