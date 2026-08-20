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
  appsFlyer?: AppsFlyerParams;
  /** Time-to-live, in seconds, for attribution of this link. */
  attributionTtl?: number;
};

export type AppsFlyerParams = {
  /** Media source / channel driving traffic to this link. */
  channel?: string;
  /** Unique identifier for the marketing campaign. */
  campaignId?: string;
  /** Human-readable name of the marketing campaign. */
  campaign?: string;
  /** Sub-parameters for granular tracking. */
  subs?: string[];
  /** Title used for attribution metadata. */
  metaTitle?: string;
  /** Description used for attribution metadata. */
  metaDescription?: string;
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

export type LinkInfo = {
  message: string;
  status: string;
  data: {
    link: string;
    name: string;
    referralLink: string;
    shortId: string;
    socialMetaTags: {
      description: string;
      imageUrl: string;
      title: string;
    };
  };
};

export type AttributionInfo = {
  message: string;
  status: string;
  data: LinkInfo['data'] & {
    /** `true` only on the very first app launch after installation. */
    isFirstLaunch: boolean;
    /** The app's first installation time, as epoch milliseconds on both platforms. */
    firstInstallTime: number;
    /**
     * `true` if the referral has been consumed by the app. The SDK sets this to `true` on the
     */
    isConsumed: boolean;
    /**
     * `organic` if the link was clicked without any attribution parameters, `non-organic` if it
     */
    attributionStatus: 'organic' | 'non-organic';
    /**
     * Android only: the time of the AppsOnAir deep link click, as epoch milliseconds. This is
     */
    applink_click_time?: number;
    /** Android only: remaining Play install referrer params */
    [referrerParam: string]: unknown;
  };
};
