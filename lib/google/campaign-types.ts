/* ================================================================
   Campaign Types -- aligned to Google Ads API v23
   Objectives: PERFORMANCE_MAX, SHOPPING, DEMAND_GEN, SEARCH, DISPLAY, APP
   All objectives labelled; implementation TBD per objective.
   ================================================================ */

/* ---- Enums ---- */

/** Maps to Google Ads API AdvertisingChannelType.
 *  All six objectives are defined here; only selected ones will be active initially.
 */
export type GoogleObjective =
  | "PERFORMANCE_MAX"
  | "SHOPPING"
  | "DEMAND_GEN"
  | "SEARCH"
  | "DISPLAY"
  | "APP";

/** Maps to Google Ads API BiddingStrategyType.
 *  Reference: https://developers.google.com/google-ads/api/reference/rpc/v23/BiddingStrategyTypeEnum.BiddingStrategyType */
export type BiddingStrategy =
  | "MAXIMIZE_CONVERSIONS"
  | "MAXIMIZE_CONVERSION_VALUE"
  | "TARGET_CPA"
  | "TARGET_CPC"
  | "TARGET_ROAS"
  | "TARGET_SPEND"           // Maximize Clicks — maximize clicks within budget
  | "TARGET_IMPRESSION_SHARE"
  | "MANUAL_CPC"
  | "ENHANCED_CPC"           // Standalone strategy (enum 2) — NOT a toggle on MANUAL_CPC
  | "MANUAL_CPM"
  | "TARGET_CPM";

/** Maps to Google Ads API ConversionAction goal types */
export type ConversionGoal =
  | "PURCHASE"
  | "ADD_TO_CART"
  | "BEGIN_CHECKOUT"
  | "SIGN_UP"
  | "PAGE_VIEW"
  | "LEAD"
  | "CONTACT"
  | "APP_INSTALL"
  | "IN_APP_PURCHASE";

/** Maps to Google Ads API BudgetDeliveryMethod */
export type DeliveryMethod = "STANDARD" | "ACCELERATED";

/** Maps to Google Ads API BudgetPeriodEnum.BudgetPeriod.
 *  Reference: https://developers.google.com/google-ads/api/reference/rpc/v23/BudgetPeriodEnum.BudgetPeriod */
export type BudgetPeriod = "DAILY" | "CUSTOM_PERIOD";

/** Maps to Google Ads API CampaignStatus */
export type CampaignStatus = "ENABLED" | "PAUSED";

/** Asset type for Google Ads */
export type GoogleAssetType =
  | "IMAGE"
  | "VIDEO"
  | "HEADLINE"
  | "LONG_HEADLINE"
  | "DESCRIPTION"
  | "BUSINESS_NAME"
  | "LOGO"
  | "CALL_TO_ACTION"
  | "YOUTUBE_VIDEO";

/** Ad format types across Google campaign types */
export type GoogleAdFormat =
  | "RESPONSIVE_SEARCH_AD"       // Search
  | "RESPONSIVE_DISPLAY_AD"      // Display
  | "PERFORMANCE_MAX_ASSET_GROUP" // PMax
  | "SHOPPING_PRODUCT_AD"        // Shopping
  | "DEMAND_GEN_AD"              // Demand Gen (discovery + video)
  | "APP_AD"                     // App
  | "VIDEO_AD";                  // YouTube/Demand Gen video

/** Gender targeting. Maps to Google Ads API GenderType */
export type GoogleGender = "MALE" | "FEMALE" | "UNDETERMINED";

/** Device targeting. Maps to Google Ads API DeviceType */
export type GoogleDevice = "MOBILE" | "DESKTOP" | "TABLET" | "CONNECTED_TV";

/** Audience targeting mode for Search campaigns.
 *  OBSERVATION = monitor + optional bid adjust, don't restrict delivery.
 *  TARGETING = restrict delivery to matched audience only. */
export type AudienceTargetingMode = "OBSERVATION" | "TARGETING";

/** Device type for Search/Display campaign bid adjustments.
 *  Maps to CampaignCriterion with device bid modifiers. */
export type SearchDeviceType = "MOBILE" | "DESKTOP" | "TABLET";

/** Minute precision for ad schedule. Maps to MinuteOfHourEnum.MinuteOfHour. */
export type ScheduleMinute = "ZERO" | "FIFTEEN" | "THIRTY" | "FORTY_FIVE";

/** Ad schedule entry for dayparting.
 *  Maps to CampaignCriterion.ad_schedule.
 *  Supported by Search + PMax campaigns. */
export interface AdScheduleEntry {
  id: string;
  /** Day of week: MONDAY..SUNDAY */
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  /** Start hour 0-23 */
  startHour: number;
  /** Start minute granularity (15-min intervals). Maps to AdScheduleInfo.start_minute */
  startMinute: ScheduleMinute;
  /** End hour 0-23 */
  endHour: number;
  /** End minute granularity (15-min intervals). Maps to AdScheduleInfo.end_minute */
  endMinute: ScheduleMinute;
}

/** Budget type: how the budget is consumed over the campaign lifetime */
export type PaymentMethod = "prepaid" | "pay_as_you_go";

/* ---- Objective Config ---- */

export interface GoogleObjectiveConfig {
  /** Google Ads API AdvertisingChannelType */
  apiChannelType: string;
  /** Human-readable label */
  label: string;
  /** Description shown to the merchant */
  description: string;
  /** Allowed bidding strategies for this campaign type */
  allowedBiddingStrategies: BiddingStrategy[];
  /** Default bidding strategy */
  defaultBiddingStrategy: BiddingStrategy;
  /** Whether conversion tracking is required */
  conversionTrackingRequired: boolean;
  /** Whether a product feed / Merchant Center is needed */
  merchantCenterRequired: boolean;
  /** Whether asset groups are used (PMax, Demand Gen) vs traditional ad groups */
  usesAssetGroups: boolean;
  /** Allowed ad formats */
  allowedAdFormats: GoogleAdFormat[];
  /** Whether audience signals are supported */
  audienceSignalsSupported: boolean;
  /** Whether keyword targeting is used */
  keywordsSupported: boolean;
  /** Default CTA label */
  defaultCTA: string;
}

export const OBJECTIVE_CONFIGS: Record<string, GoogleObjectiveConfig> = {
  PERFORMANCE_MAX: {
    apiChannelType: "PERFORMANCE_MAX",
    label: "Performance Max",
    description: "AI-powered campaigns across all Google channels including Search, Display, YouTube, Discover, Gmail, and Maps",
    allowedBiddingStrategies: ["MAXIMIZE_CONVERSIONS", "MAXIMIZE_CONVERSION_VALUE", "TARGET_CPA", "TARGET_ROAS"],
    defaultBiddingStrategy: "MAXIMIZE_CONVERSIONS",
    conversionTrackingRequired: true,
    merchantCenterRequired: false,
    usesAssetGroups: true,
    allowedAdFormats: ["PERFORMANCE_MAX_ASSET_GROUP"],
    audienceSignalsSupported: true,
    keywordsSupported: false,
    defaultCTA: "Shop now",
  },
  SHOPPING: {
    apiChannelType: "SHOPPING",
    label: "Shopping",
    description: "Showcase your products with rich product listings across Google Shopping, Search, and partner sites",
    allowedBiddingStrategies: ["MAXIMIZE_CONVERSIONS", "TARGET_ROAS", "MANUAL_CPC", "ENHANCED_CPC", "TARGET_SPEND", "MAXIMIZE_CONVERSION_VALUE"],
    defaultBiddingStrategy: "MAXIMIZE_CONVERSIONS",
    conversionTrackingRequired: true,
    merchantCenterRequired: true,
    usesAssetGroups: false,
    allowedAdFormats: ["SHOPPING_PRODUCT_AD"],
    audienceSignalsSupported: false,
    keywordsSupported: false,
    defaultCTA: "Shop now",
  },
  DEMAND_GEN: {
    apiChannelType: "DEMAND_GEN",
    label: "Demand Gen",
    description: "Engage audiences on YouTube, Discover, and Gmail with visually rich image and video ads",
    allowedBiddingStrategies: ["MAXIMIZE_CONVERSIONS", "MAXIMIZE_CONVERSION_VALUE", "TARGET_CPA", "TARGET_CPC", "TARGET_ROAS", "TARGET_SPEND", "MANUAL_CPC"],
    defaultBiddingStrategy: "MAXIMIZE_CONVERSIONS",
    conversionTrackingRequired: true,
    merchantCenterRequired: false,
    usesAssetGroups: false, // Demand Gen uses AdGroups, NOT AssetGroups
    allowedAdFormats: ["DEMAND_GEN_AD", "VIDEO_AD"],
    audienceSignalsSupported: true,
    keywordsSupported: false,
    defaultCTA: "Learn more",
  },
  SEARCH: {
    apiChannelType: "SEARCH",
    label: "Search",
    description: "Reach people actively searching on Google with text ads that appear above search results",
    allowedBiddingStrategies: ["MAXIMIZE_CONVERSIONS", "MAXIMIZE_CONVERSION_VALUE", "TARGET_CPA", "TARGET_ROAS", "TARGET_SPEND", "TARGET_IMPRESSION_SHARE", "MANUAL_CPC", "ENHANCED_CPC"],
    defaultBiddingStrategy: "MAXIMIZE_CONVERSIONS",
    conversionTrackingRequired: true,
    merchantCenterRequired: false,
    usesAssetGroups: false,
    allowedAdFormats: ["RESPONSIVE_SEARCH_AD"],
    audienceSignalsSupported: true,
    keywordsSupported: true,
    defaultCTA: "Shop now",
  },
  DISPLAY: {
    apiChannelType: "DISPLAY",
    label: "Display",
    description: "Show visual ads across 3 million+ websites and apps in the Google Display Network",
    allowedBiddingStrategies: ["MAXIMIZE_CONVERSIONS", "TARGET_CPA", "MAXIMIZE_CONVERSION_VALUE", "TARGET_ROAS", "MANUAL_CPC", "ENHANCED_CPC", "TARGET_CPM"],
    defaultBiddingStrategy: "MAXIMIZE_CONVERSIONS",
    conversionTrackingRequired: false,
    merchantCenterRequired: false,
    usesAssetGroups: false,
    allowedAdFormats: ["RESPONSIVE_DISPLAY_AD"],
    audienceSignalsSupported: true,
    keywordsSupported: true,
    defaultCTA: "Learn more",
  },
  APP: {
    apiChannelType: "MULTI_CHANNEL",
    label: "App",
    description: "Drive app installs and in-app actions across Search, Play, YouTube, Discover, and Display",
    allowedBiddingStrategies: ["MAXIMIZE_CONVERSIONS", "TARGET_CPA"],
    defaultBiddingStrategy: "TARGET_CPA",
    conversionTrackingRequired: true,
    merchantCenterRequired: false,
    usesAssetGroups: false,
    allowedAdFormats: ["APP_AD"],
    audienceSignalsSupported: false,
    keywordsSupported: false,
    defaultCTA: "Install now",
  },
};

/* ---- Step: Objective ---- */

/** Google Ads conversion tag setup mode — platform-managed only (external tags not supported by Google Ads API across MCC boundaries) */
export type TagMode = "salla_managed" | "none";

export interface GoogleObjectiveSettings {
  campaignName: string;
  objective: GoogleObjective;
  /** Google Ads conversion tag setup — always Salla-managed */
  tagMode: TagMode;
  /** Merchant Center connection (for Shopping / PMax with feed) */
  merchantCenterConnected: boolean;
  merchantCenterId: string;
  /** Product feed details */
  feedEnabled: boolean;
  feedId: string;
  /** Target country for Shopping */
  targetCountry: string;
  /** Shopping-specific settings. Maps to Campaign.shopping_setting */
  shoppingSettings: ShoppingSettings;
  /** Demand Gen channel controls */
  demandGenChannels: DemandGenChannelControls;
  /** Demand Gen ad format */
  demandGenAdType: DemandGenAdType;
  /** App campaign settings. Maps to AppCampaignSetting */
  appSettings: AppCampaignSettings;
  /**
   * Required declaration when targeting EU political advertising.
   * Maps to Campaign.contains_eu_political_advertising.
   */
  containsEuPoliticalAdvertising:
    | "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING"
    | "CONTAINS_EU_POLITICAL_ADVERTISING";
}

/* ---- Step: Audience ---- */

export interface GoogleAudienceSettings {
  /** Geographic targeting (country codes; maps to geo_target_constant via lib/google/geo-constants.ts) */
  locationIds: string[];
  /** Selected city ids from shared location list (same UX as other platforms; map to locationIds when sending to API) */
  cityIds: string[];
  /** Per-city radius in km for proximity targeting (ProximityInfo). Keys = city id. */
  cityRadii?: Record<string, number>;
  /** Excluded locations (negative targeting). Maps to CampaignCriterion with negative=true.
   *  e.g. Target SA but exclude specific cities. */
  excludedLocationIds: string[];
  /** Positive location targeting method. Maps to GeoTargetTypeSetting.positive_geo_target_type */
  locationTargetingMethod: "PRESENCE" | "PRESENCE_OR_INTEREST";
  /** Negative location targeting method. Maps to GeoTargetTypeSetting.negative_geo_target_type */
  negativeLocationTargetingMethod: "PRESENCE" | "PRESENCE_OR_INTEREST";
  /** Language codes */
  languages: string[];
  /** Age range */
  ageMin: number;
  ageMax: number;
  /** Gender targeting */
  genders: GoogleGender[];
  /** Device targeting */
  devices: GoogleDevice[];
  /** Audience segments (in-market, affinity, custom) */
  audienceSegments: string[];
  /** Custom audience IDs to exclude */
  excludedAudiences: string[];
  /** Keywords for Search campaigns */
  keywords: string[];
  /** Negative keywords */
  negativeKeywords: string[];
  /** Audience signals for PMax / Demand Gen */
  audienceSignals: string[];
  /** Search themes for PMax (up to 25 per asset group). Maps to AssetGroupSignal.search_theme */
  searchThemes: string[];
  /** Custom segment keywords (what people search for) */
  customSegmentKeywords: string[];
  /** Custom segment URLs (websites people browse) */
  customSegmentUrls: string[];
  /** In-market segment IDs */
  inMarketSegments: string[];
  /** Affinity segment IDs */
  affinitySegments: string[];
  /** Lookalike segments (Demand Gen). Maps to SimilarUserListInfo */
  lookalikeSegments: string[];
  /** Lookalike expansion level: NARROW, BALANCED, BROAD */
  lookalikeExpansion: "NARROW" | "BALANCED" | "BROAD";
  /** Customer match lists (Demand Gen). Maps to CustomerMatchUserListInfo */
  customerMatchLists: string[];
  /** Operating system targeting */
  operatingSystems: string[];
  /** Audience expansion toggle */
  optimizedTargeting: boolean;
  /** Exclude recent converters (Salla segment) */
  excludeRecentConverters: boolean;
  excludeRecentConvertersDays: number;
  /** Salla lookalike buyer category (when optimizedTargeting enabled) */
  sallaAudienceCategory: string;

  /* ---- Search-specific audience fields ---- */

  /** Audience targeting mode for Search (OBSERVATION default, TARGETING restricts).
   *  Maps to AdGroupTargetingSetting.target_restrictions. */
  audienceTargetingMode: AudienceTargetingMode;
  /** Device types for Search campaigns with bid adjustments.
   *  Maps to CampaignCriterion device bid modifiers. */
  searchDevices: SearchDeviceType[];
  /** Bid adjustment percentages per device type (-100 to +900).
   *  Maps to CampaignCriterion.bid_modifier. */
  searchDeviceBidAdjustments: Record<SearchDeviceType, number>;
  /** Bid adjustment percentages per audience segment in Observation mode.
   *  Maps to AdGroupCriterion.bid_modifier. */
  audienceBidAdjustments: Record<string, number>;
  /** Ad schedule entries for dayparting.
   *  Maps to CampaignCriterion.ad_schedule. */
  adScheduleEntries: AdScheduleEntry[];
  /** Household income targeting tiers.
   *  Maps to CampaignCriterion.income_range. */
  householdIncome: string[];
  /** Parental status targeting.
   *  Maps to CampaignCriterion.parental_status. */
  parentalStatus: string[];
}

/* ---- Step: Budget ---- */

export interface GoogleBudgetSettings {
  /** Always daily for Salla */
  budgetPeriod: BudgetPeriod;
  /** Daily budget in SAR */
  amount: number;
  /** Bidding strategy */
  biddingStrategy: BiddingStrategy;
  /** Target CPA amount (when using TARGET_CPA) */
  targetCpa: number;
  /** Target CPC amount (when using TARGET_CPC; Demand Gen only) */
  targetCpc: number;
  /** Target ROAS percentage (when using TARGET_ROAS, e.g. 400 for 400%) */
  targetRoas: number;
  /** Maximum CPC bid limit (when using MANUAL_CPC) */
  maxCpcBid: number;
  /** Target impression share percentage (for SEARCH with TARGET_IMPRESSION_SHARE) */
  targetImpressionShare: number;
  /** Where to show ads for impression share (ANYWHERE_ON_PAGE, TOP_OF_PAGE, ABSOLUTE_TOP_OF_PAGE) */
  impressionShareLocation: "ANYWHERE_ON_PAGE" | "TOP_OF_PAGE" | "ABSOLUTE_TOP_OF_PAGE";
  /** Max CPC bid limit for impression share */
  impressionShareMaxCpc: number;
  /** Conversion goal */
  conversionGoal: ConversionGoal;
  /** Delivery method */
  deliveryMethod: DeliveryMethod;
  /** Schedule */
  startDate: string;
  endDate: string;
  /** Optional time precision (v23) in HH:mm */
  startTime: string;
  endTime: string;
  endDateOptional: boolean;
  schedule: "all_day" | "custom";
  /** Ad scheduling (day-parting) */
  adSchedule: string[];
  /** Budget type */
  paymentMethod: PaymentMethod;
  /** Salla performance boost upsell */
  performanceBoost: boolean;
  /** Salla auto-increase configuration */
  autoIncrease: {
    enabled: boolean;
    pct: number;
    intervalDays: number;
    maxDailyBudget: number;
  };
  /** URL expansion opt-out (PMax). When false, Google can serve ads for related URLs. Maps to Campaign.url_expansion_opt_out */
  urlExpansionOptOut: boolean;
  /** Brand guidelines enabled (PMax). Maps to Campaign.brand_guidelines_enabled */
  brandGuidelinesEnabled: boolean;
  /** Campaign-level asset automation settings. Maps to Campaign.asset_automation_settings.
   *  Applies to PMax (5 types) and Search (3 types). */
  assetAutomationSettings: AssetAutomationEntry[];
  /** AI Max for Search settings. Maps to Campaign.ai_max_setting.
   *  Only applies to Search campaigns. */
  aiMaxSettings: AiMaxSettings;
  /** Programmatic text controls for AI generated assets (Search + PMax). */
  textGuidelines: TextGuidelines;
  /**
   * Demand Gen budget mode.
   * DAILY -> amount
   * TOTAL -> demandGenTotalAmount
   */
  demandGenBudgetMode: "DAILY" | "TOTAL";
  /** Total budget amount in SAR for Demand Gen TOTAL mode. */
  demandGenTotalAmount: number;
}

/* ---- AI / Automation Settings ---- */

/** Asset automation type. Maps to AssetAutomationTypeEnum.AssetAutomationType.
 *  Controls campaign-level AI features for auto-generating/enhancing assets. */
export type AssetAutomationType =
  | "TEXT_ASSET_AUTOMATION"
  | "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION"
  | "GENERATE_IMAGE_EXTRACTION"
  | "GENERATE_IMAGE_ENHANCEMENT"
  | "GENERATE_ENHANCED_YOUTUBE_VIDEOS";

/** Opt-in status. Maps to AssetAutomationStatusEnum.AssetAutomationStatus */
export type AssetAutomationStatus = "OPTED_IN" | "OPTED_OUT";

/** A single asset automation entry. Maps to Campaign.asset_automation_settings repeated field. */
export interface AssetAutomationEntry {
  type: AssetAutomationType;
  status: AssetAutomationStatus;
}

/** AI Max for Search settings. Maps to Campaign.ai_max_setting.
 *  Enables AI-powered keyword expansion, final URL expansion, and text customization. */
export interface AiMaxSettings {
  /** Master toggle. Maps to Campaign.ai_max_setting.enable_ai_max */
  enableAiMax: boolean;
  /** Brand names to include (keep ads on-brand). Maps to BrandSuggestion */
  brandInclusions: string[];
  /** Brand names to exclude (prevent competitor brand targeting) */
  brandExclusions: string[];
  /** URL patterns to restrict final URL expansion to. Maps to PageFeedAsset */
  urlInclusions: string[];
}

export interface TextGuidelines {
  /** Terms that must never appear in generated text. */
  termExclusions: string[];
  /** Required short messaging restrictions/instructions. */
  messagingRestrictions: string[];
}

/** Demand Gen ad-level automation types. Maps to ad.asset_automation_settings.
 *  Controls per-ad AI creative generation features. */
export type DemandGenAdAutomationType =
  | "GENERATE_DESIGN_VERSIONS_FOR_IMAGES"
  | "GENERATE_SHORTER_YOUTUBE_VIDEOS"
  | "GENERATE_VERTICAL_YOUTUBE_VIDEOS"
  | "GENERATE_VIDEOS_FROM_OTHER_ASSETS";

/* ---- Demand Gen Settings ---- */

/** Demand Gen ad format type */
export type DemandGenAdType = "MULTI_ASSET" | "CAROUSEL" | "VIDEO_RESPONSIVE";

/** Channel controls for Demand Gen campaigns.
 *  Maps to campaign-level channel control settings. */
export interface DemandGenChannelControls {
  youtubeInStream: boolean;
  youtubeInFeed: boolean;
  youtubeShorts: boolean;
  discover: boolean;
  gmail: boolean;
  display: boolean;
}

/** Image aspect ratio bucket. Maps to different API fields per format. */
export type DemandGenImageRatio = "LANDSCAPE" | "SQUARE" | "PORTRAIT" | "TALL_PORTRAIT";

/** A single Demand Gen ad within an ad group.
 *  Maps to AdGroupAd.ad with one of:
 *  - DemandGenMultiAssetAdInfo
 *  - DemandGenCarouselAdInfo
 *  - DemandGenVideoResponsiveAdInfo
 *
 *  Fields are a superset of all 3 formats. The UI and API mapping
 *  read only the fields relevant to the selected `adType`. */
export interface DemandGenAd {
  id: string;
  name: string;
  adType: DemandGenAdType;

  /* ---- TEXT ASSETS (Multi-Asset + Video Responsive) ---- */
  /** Headlines: max 5, max 40 chars input (30 display width).
   *  API ref says "display width 30" but Help Center confirms 40 char input limit.
   *  Reference: https://support.google.com/google-ads/answer/13704860 */
  headlines: { text: string }[];
  /** Long headlines: max 5, 90 chars. Only used for VIDEO_RESPONSIVE format.
   *  Do NOT send for MULTI_ASSET or CAROUSEL ads. */
  longHeadlines: { text: string }[];
  /** Descriptions: max 5, max display width 90 chars. */
  descriptions: { text: string }[];

  /* ---- SHARED REQUIRED FIELDS ---- */
  /** Max display width 25. Required on all formats. */
  businessName: string;
  finalUrl: string;
  callToAction: string;

  /* ---- IMAGE ASSETS (Multi-Asset) ---- */
  /** All image types combined max 20. Each has an aspect ratio bucket.
   *  - LANDSCAPE 1.91:1 min 600x314 (marketing_images)
   *  - SQUARE    1:1   min 300x300 (square_marketing_images)
   *  - PORTRAIT  4:5   min 480x600 (portrait_marketing_images)
   *  - TALL_PORTRAIT 9:16 min 600x1067 (tall_portrait_marketing_images) */
  images: { id: string; url: string; aspectRatio: DemandGenImageRatio }[];

  /** Logo: 1:1, min 128x128. Multi-Asset max 5, Carousel exactly 1, VideoResponsive array. */
  logos: { id: string; url: string }[];

  /* ---- VIDEO ASSETS (Video Responsive) ---- */
  /** YouTube video assets. Maps to DemandGenVideoResponsiveAdInfo.videos */
  videos: { id: string; youtubeUrl: string }[];
  /** v23: optional companion banner for Video Responsive ads */
  companionBannerUrl?: string;
  /** Breadcrumbs shown next to displayed URL (Video Responsive only) */
  breadcrumb1: string;
  breadcrumb2: string;

  /* ---- CAROUSEL SPECIFIC ---- */
  /** Carousel: single headline (not array). Max display width 30. */
  carouselHeadline: string;
  /** Carousel: single description. Max display width 90. */
  carouselDescription: string;
  /** Carousel cards (2-10). Each card is an asset with its own image, headline, and final URL. */
  carouselCards: { id: string; headline: string; imageUrl: string; finalUrl: string; callToAction: string }[];

  /** Ad-level asset automation for Demand Gen. Maps to Ad.asset_automation_settings.
   *  Controls AI-powered creative generation per ad. */
  adAssetAutomation: Record<DemandGenAdAutomationType, AssetAutomationStatus>;
}

/** A Demand Gen ad group.
 *  Maps to AdGroup with demand_gen_ad_group_settings.
 *  Unlike PMax (which uses AssetGroups), Demand Gen uses standard AdGroups
 *  each containing one or more AdGroupAds. */
export interface DemandGenAdGroup {
  id: string;
  name: string;
  /** Per-ad-group channel controls. Maps to DemandGenAdGroupSettings.channel_controls.selected_channels */
  channelControls: DemandGenChannelControls;
  /** Ads within this ad group */
  ads: DemandGenAd[];
}

/** Factory: create a new Demand Gen ad with unique ID */
export function createDemandGenAd(index: number): DemandGenAd {
  const ts = Date.now();
  return {
    id: `dg-ad-${ts}-${index}`,
    name: `Ad ${index}`,
    adType: "MULTI_ASSET",
    headlines: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }, { text: "" }],
    longHeadlines: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }, { text: "" }],
    descriptions: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }, { text: "" }],
    businessName: "",
    finalUrl: "",
    callToAction: "AUTOMATED",
    images: [],
    logos: [],
    videos: [],
    breadcrumb1: "",
    breadcrumb2: "",
    carouselHeadline: "",
    carouselDescription: "",
    carouselCards: [
      { id: `card-${ts}-1`, headline: "", imageUrl: "", finalUrl: "", callToAction: "AUTOMATED" },
      { id: `card-${ts}-2`, headline: "", imageUrl: "", finalUrl: "", callToAction: "AUTOMATED" },
    ],
    adAssetAutomation: {
      GENERATE_DESIGN_VERSIONS_FOR_IMAGES: "OPTED_IN",
      GENERATE_SHORTER_YOUTUBE_VIDEOS: "OPTED_IN",
      GENERATE_VERTICAL_YOUTUBE_VIDEOS: "OPTED_IN",
      GENERATE_VIDEOS_FROM_OTHER_ASSETS: "OPTED_IN",
    },
  };
}

/** Factory: create a new Demand Gen ad group with unique ID and one default ad */
export function createDemandGenAdGroup(index: number): DemandGenAdGroup {
  return {
    id: `dg-ag-${Date.now()}-${index}`,
    name: `Ad Group ${index}`,
    channelControls: {
      youtubeInStream: true,
      youtubeInFeed: true,
      youtubeShorts: true,
      discover: true,
      gmail: true,
      display: false,
    },
    ads: [createDemandGenAd(1)],
  };
}

/* ---- Shopping Campaign Settings ---- */

/** Maps to Google Ads API Campaign.ShoppingSetting */
export interface ShoppingSettings {
  /** Google Merchant Center account ID. Maps to ShoppingSetting.merchant_id */
  merchantId: string;
  /** Campaign priority (0=Low, 1=Medium, 2=High). Maps to ShoppingSetting.campaign_priority */
  campaignPriority: 0 | 1 | 2;
  /** Feed label for filtering products. Maps to ShoppingSetting.feed_label */
  feedLabel: string;
  /** Enable local inventory ads. Maps to ShoppingSetting.enable_local */
  enableLocal: boolean;
}

/** Product dimension types for listing group partitions.
 *  Maps to Google Ads API ListingGroupFilterDimension */
export type ProductDimensionType =
  | "PRODUCT_BRAND"
  | "PRODUCT_CATEGORY"
  | "PRODUCT_TYPE"
  | "PRODUCT_CONDITION"
  | "PRODUCT_CUSTOM_ATTRIBUTE_0"
  | "PRODUCT_CUSTOM_ATTRIBUTE_1"
  | "PRODUCT_CUSTOM_ATTRIBUTE_2"
  | "PRODUCT_CUSTOM_ATTRIBUTE_3"
  | "PRODUCT_CUSTOM_ATTRIBUTE_4"
  | "PRODUCT_ITEM_ID"
  | "PRODUCT_CHANNEL";

/** A product group filter/partition node.
 *  Maps to Google Ads API AdGroupListingGroupFilter */
export interface ProductGroupNode {
  id: string;
  /** Dimension used for this partition level */
  dimensionType: ProductDimensionType;
  /** Value of the dimension (e.g. brand name, category path) */
  dimensionValue: string;
  /** Whether this is a subdivision (branch) or unit (leaf) */
  type: "SUBDIVISION" | "UNIT_INCLUDED" | "UNIT_EXCLUDED";
  /** Max CPC bid for MANUAL_CPC in micros. Maps to ListingGroupFilter.cpc_bid_micros */
  cpcBidMicros?: number;
  /** Children partitions (only for SUBDIVISION) */
  children: ProductGroupNode[];
}

/** Retail PMax listing group mode (asset-group listing filter) */
export type RetailListingMode = "ALL" | "CATEGORY" | "BRAND" | "CUSTOM_LABEL";

/** A negative keyword for Shopping campaigns */
export interface NegativeKeyword {
  id: string;
  text: string;
  matchType: "BROAD" | "PHRASE" | "EXACT";
}

/* ---- Search Campaign Types ---- */

/** Keyword match type. Maps to Google Ads API KeywordMatchType */
export type KeywordMatchType = "BROAD" | "PHRASE" | "EXACT";

/** A single keyword with match type for Search campaigns.
 *  Maps to AdGroupCriterion with type=KEYWORD */
export interface SearchKeyword {
  id: string;
  text: string;
  matchType: KeywordMatchType;
}

/** Pin position for RSA headlines (1=first, 2=second, 3=third shown position) */
export type HeadlinePinPosition = 1 | 2 | 3 | null;
/** Pin position for RSA descriptions (1=first, 2=second shown position) */
export type DescriptionPinPosition = 1 | 2 | null;

/** A single RSA headline with optional pin. Maps to AdTextAsset inside ResponsiveSearchAdInfo.headlines */
export interface RSAHeadline {
  id: string;
  text: string;
  /** Pin to a specific display position. null = no pin (Google chooses). */
  pinnedPosition: HeadlinePinPosition;
}

/** A single RSA description with optional pin. Maps to AdTextAsset inside ResponsiveSearchAdInfo.descriptions */
export interface RSADescription {
  id: string;
  text: string;
  /** Pin to a specific display position. null = no pin. */
  pinnedPosition: DescriptionPinPosition;
}

/** Responsive Search Ad. Maps to ResponsiveSearchAdInfo */
export interface GoogleSearchAd {
  id: string;
  name: string;
  /** Headlines: min 3, max 15, max 30 chars each. */
  headlines: RSAHeadline[];
  /** Descriptions: min 2, max 4, max 90 chars each. */
  descriptions: RSADescription[];
  /** Final URL (landing page) */
  finalUrl: string;
  /** Display path segment 1. Max 15 chars. Maps to ResponsiveSearchAdInfo.path1 */
  displayPath1: string;
  /** Display path segment 2. Max 15 chars. Maps to ResponsiveSearchAdInfo.path2 */
  displayPath2: string;
}

/** Sitelink extension asset. Maps to SitelinkAsset */
export interface SearchSitelinkAsset {
  id: string;
  /** Link text shown in the ad. Max 25 chars. */
  linkText: string;
  /** Description line 1. Max 35 chars. */
  description1: string;
  /** Description line 2. Max 35 chars. */
  description2: string;
  /** Landing page URL */
  finalUrl: string;
}

/** Callout extension asset. Maps to CalloutAsset */
export interface SearchCalloutAsset {
  id: string;
  /** Callout text. Max 25 chars. */
  text: string;
}

/** Structured snippet extension. Maps to StructuredSnippetAsset */
export interface SearchStructuredSnippet {
  id: string;
  /** Predefined header type. Maps to StructuredSnippetAsset.header */
  header: string;
  /** 3-10 values, 25 chars each. Maps to StructuredSnippetAsset.values */
  values: string[];
}

/** Predefined structured snippet headers from Google Ads API */
export const STRUCTURED_SNIPPET_HEADERS = [
  "Amenities", "Brands", "Courses", "Degree programs", "Destinations",
  "Featured hotels", "Insurance coverage", "Models", "Neighborhoods",
  "Service catalog", "Shows", "Styles", "Types",
] as const;

/** Price extension asset. Maps to PriceAsset in the Google Ads API.
 *  Shows product/service prices directly in the ad. */
export interface SearchPriceAsset {
  id: string;
  /** Price asset type. Maps to PriceExtensionType. */
  type: "BRANDS" | "EVENTS" | "LOCATIONS" | "NEIGHBORHOODS" | "PRODUCT_CATEGORIES" | "PRODUCT_TIERS" | "SERVICES" | "SERVICE_CATEGORIES" | "SERVICE_TIERS";
  /** Price qualifier. Maps to PriceExtensionPriceQualifier. */
  priceQualifier: "FROM" | "UP_TO" | "AVERAGE" | "NONE";
  /** Language code for the price assets. */
  languageCode: string;
  /** Price offerings (3-8 items). Maps to PriceOffering. */
  offerings: {
    id: string;
    /** Header text. Max 25 chars. */
    header: string;
    /** Description. Max 25 chars. */
    description: string;
    /** Price in micros (e.g., 99_000_000 = 99 SAR). */
    priceMicros: number;
    /** Price unit. Maps to PriceExtensionPriceUnit. */
    unit: "PER_HOUR" | "PER_DAY" | "PER_WEEK" | "PER_MONTH" | "PER_YEAR" | "NONE";
    /** Final URL for this offering. */
    finalUrl: string;
  }[];
}

/** Promotion extension asset. Maps to PromotionAsset in the Google Ads API.
 *  Shows promotional offers with optional discount details and countdown. */
export interface SearchPromotionAsset {
  id: string;
  /** Promotion target. What's being promoted. Max 20 chars. */
  promotionTarget: string;
  /** Discount modifier. Maps to PromotionExtensionDiscountModifier. */
  discountModifier: "UP_TO" | "NONE";
  /** Discount type: monetary or percentage. */
  discountType: "MONETARY" | "PERCENT_OFF" | "NONE";
  /** Monetary discount in micros (when discountType = MONETARY). */
  moneyAmountMicros: number;
  /** Percentage discount (when discountType = PERCENT_OFF, e.g. 20 = 20%). */
  percentOff: number;
  /** Promotion occasion. Maps to PromotionExtensionOccasion. */
  occasion: "NEW_YEARS" | "VALENTINES_DAY" | "EASTER" | "MOTHERS_DAY" | "FATHERS_DAY"
    | "LABOR_DAY" | "BACK_TO_SCHOOL" | "HALLOWEEN" | "BLACK_FRIDAY" | "CYBER_MONDAY"
    | "CHRISTMAS" | "BOXING_DAY" | "INDEPENDENCE_DAY" | "NATIONAL_DAY" | "END_OF_SEASON"
    | "WINTER_SALE" | "SUMMER_SALE" | "FALL_SALE" | "SPRING_SALE" | "RAMADAN" | "EID_AL_FITR"
    | "EID_AL_ADHA" | "SINGLES_DAY" | "WOMENS_DAY" | "NONE";
  /** Final URL for the promotion landing page. */
  finalUrl: string;
  /** Promotion start date (YYYY-MM-DD). Optional. */
  startDate: string;
  /** Promotion end date (YYYY-MM-DD). Optional. */
  endDate: string;
}

/** A Search ad group. Contains keywords + RSAs.
 *  Maps to AdGroup (type = SEARCH_STANDARD) */
export interface SearchAdGroup {
  id: string;
  name: string;
  /** Keywords with match types. Maps to AdGroupCriterion */
  keywords: SearchKeyword[];
  /** Negative keywords at ad group level */
  negativeKeywords: SearchKeyword[];
  /** Responsive Search Ads within this ad group. Maps to AdGroupAd.ad.responsive_search_ad */
  ads: GoogleSearchAd[];
}

/** Factory: create a new RSA with proper defaults (3 headlines + 2 descriptions) */
export function createSearchAd(index: number): GoogleSearchAd {
  const ts = Date.now();
  return {
    id: `rsa-${ts}-${index}`,
    name: `Responsive Search Ad ${index}`,
    headlines: Array.from({ length: 15 }, (_, i) => ({
      id: `h-${ts}-${i}`,
      text: "",
      pinnedPosition: null,
    })),
    descriptions: Array.from({ length: 4 }, (_, i) => ({
      id: `d-${ts}-${i}`,
      text: "",
      pinnedPosition: null,
    })),
    finalUrl: "",
    displayPath1: "",
    displayPath2: "",
  };
}

/** Factory: create a new Search ad group with 1 default RSA */
export function createSearchAdGroup(index: number): SearchAdGroup {
  return {
    id: `search-ag-${Date.now()}-${index}`,
    name: `Ad Group ${index}`,
    keywords: [],
    negativeKeywords: [],
    ads: [createSearchAd(1)],
  };
}

/* ---- Step: Creative ---- */

/** A single creative asset for Google Ads */
export interface GoogleCreativeAsset {
  id: string;
  type: GoogleAssetType;
  /** Text content for headlines/descriptions */
  text?: string;
  /** URL for image/video assets */
  url?: string;
  /** PMax image slot classification used for asset requirement validation in prototype UI. */
  pmaxImageType?: "LANDSCAPE" | "SQUARE" | "PORTRAIT";
  file?: File;
  /** YouTube video ID for video assets */
  youtubeVideoId?: string;
  thumbnailUrl?: string;
}

/* ---- App Campaign Types ---- */

/** App campaign bidding strategy goal type.
 *  Maps to AppCampaignBiddingStrategyGoalTypeEnum.AppCampaignBiddingStrategyGoalType.
 *  Reference: https://developers.google.com/google-ads/api/reference/rpc/v23/AppCampaignBiddingStrategyGoalTypeEnum */
export type AppCampaignGoalType =
  | "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST"
  | "OPTIMIZE_INSTALLS_WITHOUT_TARGET_INSTALL_COST"
  | "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_INSTALL_COST"
  | "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_CONVERSION_COST"
  | "OPTIMIZE_IN_APP_CONVERSIONS_WITHOUT_TARGET_CPA"
  | "OPTIMIZE_RETURN_ON_ADVERTISING_SPEND"
  | "OPTIMIZE_TOTAL_VALUE_WITHOUT_TARGET_ROAS"
  | "OPTIMIZE_PRE_REGISTRATION_CONVERSION_VOLUME";

/** Whether a given App campaign goal type requires MMP (Mobile Measurement Partner)
 *  integration (e.g. AppsFlyer, Adjust, Firebase) for post-install event tracking. */
export const APP_GOAL_MMP_REQUIRED: Record<AppCampaignGoalType, boolean> = {
  OPTIMIZE_INSTALLS_TARGET_INSTALL_COST: false,
  OPTIMIZE_INSTALLS_WITHOUT_TARGET_INSTALL_COST: false,
  OPTIMIZE_PRE_REGISTRATION_CONVERSION_VOLUME: false,
  OPTIMIZE_IN_APP_CONVERSIONS_TARGET_INSTALL_COST: true,
  OPTIMIZE_IN_APP_CONVERSIONS_TARGET_CONVERSION_COST: true,
  OPTIMIZE_IN_APP_CONVERSIONS_WITHOUT_TARGET_CPA: true,
  OPTIMIZE_RETURN_ON_ADVERTISING_SPEND: true,
  OPTIMIZE_TOTAL_VALUE_WITHOUT_TARGET_ROAS: true,
};

/** App store type. Maps to AppCampaignAppStore. */
export type AppStore = "APPLE_APP_STORE" | "GOOGLE_APP_STORE";

/** App campaign settings. Maps to AppCampaignSetting.
 *  Reference: https://developers.google.com/google-ads/api/reference/rpc/v23/Campaign.AppCampaignSetting */
export interface AppCampaignSettings {
  /** App store platform */
  appStore: AppStore;
  /** App package name (Android) or app ID (iOS). Maps to app_id. Immutable after creation. */
  appId: string;
  /** App display name (informational, not in API) */
  appName: string;
  /** Bidding strategy goal. Maps to bidding_strategy_goal_type */
  biddingStrategyGoalType: AppCampaignGoalType;
  /** Required sub-type. Maps to Campaign.advertising_channel_sub_type.
   *  APP_CAMPAIGN = install, APP_CAMPAIGN_FOR_ENGAGEMENT = re-engagement,
   *  APP_CAMPAIGN_FOR_PRE_REGISTRATION = pre-reg. */
  advertisingChannelSubType: "APP_CAMPAIGN" | "APP_CAMPAIGN_FOR_ENGAGEMENT" | "APP_CAMPAIGN_FOR_PRE_REGISTRATION";
}

/** App ad creative. Maps to AppAdInfo in the Google Ads API.
 *  Google auto-generates ads from these assets. */
export interface GoogleAppAd {
  id: string;
  name: string;
  /** Required ad text (always shown). Maps to mandatory_ad_text */
  mandatoryAdText: string;
  /** Headlines (up to 5, max 30 chars each). Maps to headlines */
  headlines: { id: string; text: string }[];
  /** Descriptions (up to 5, max 90 chars each). Maps to descriptions */
  descriptions: { id: string; text: string }[];
  /** Landscape images (1.91:1, min 1200x628). Maps to images */
  images: GoogleCreativeAsset[];
  /** YouTube video URLs/IDs (up to 20). Maps to youtube_videos */
  youtubeVideos: string[];
  /** HTML5 media bundles (optional). Maps to html5_media_bundles */
  html5MediaBundles: GoogleCreativeAsset[];
}

/** Factory: create default App ad */
export function createAppAd(index: number): GoogleAppAd {
  return {
    id: `app-ad-${Date.now()}-${index}`,
    name: `App Ad ${index}`,
    mandatoryAdText: "",
    headlines: [
      { id: `ah-${Date.now()}-1`, text: "" },
      { id: `ah-${Date.now()}-2`, text: "" },
    ],
    descriptions: [
      { id: `ad-${Date.now()}-1`, text: "" },
      { id: `ad-${Date.now()}-2`, text: "" },
    ],
    images: [],
    youtubeVideos: [],
    html5MediaBundles: [],
  };
}

/** Asset group for PMax campaigns.
 *  Maps to AssetGroup + AssetGroupAsset resources.
 *  Reference: https://developers.google.com/google-ads/api/docs/performance-max/asset-groups
 *
 *  Minimum requirements per asset group:
 *  - 3 headlines (30 chars), 1 long headline (90 chars), 2 descriptions (90 chars)
 *  - 1 landscape image (1.91:1), 1 square image (1:1), 1 logo (1:1)
 *  - 1 business name (25 chars) */
export interface GoogleAssetGroup {
  id: string;
  name: string;
  /** Final URL (landing page). Required. */
  finalUrl: string;
  /** Mobile-specific landing page. Maps to AssetGroup.final_mobile_urls. Optional. */
  finalMobileUrl: string;
  /** Headlines: min 3, max 15, 30 chars each. Maps to AssetFieldType.HEADLINE */
  headlines: GoogleCreativeAsset[];
  /** Long headlines: min 1, max 5, 90 chars each. Maps to AssetFieldType.LONG_HEADLINE */
  longHeadlines: GoogleCreativeAsset[];
  /** Descriptions: min 2, max 5, 90 chars each. Maps to AssetFieldType.DESCRIPTION */
  descriptions: GoogleCreativeAsset[];
  /** Images: max 20 combined. Maps to MARKETING_IMAGE (1.91:1) + SQUARE_MARKETING_IMAGE (1:1) + PORTRAIT_MARKETING_IMAGE (4:5) */
  images: GoogleCreativeAsset[];
  /** Square logos: min 1, max 5, 1:1 ratio, min 128x128. Maps to AssetFieldType.LOGO */
  logos: GoogleCreativeAsset[];
  /** Landscape logos: max 20, 4:1 ratio, min 512x128. Maps to AssetFieldType.LANDSCAPE_LOGO. Optional. */
  landscapeLogos: GoogleCreativeAsset[];
  /** YouTube videos: max 15, min 10 seconds, 16:9 or 1:1 or 9:16. Maps to AssetFieldType.YOUTUBE_VIDEO */
  videos: GoogleCreativeAsset[];
  /** Business name: max 25 chars. Maps to AssetFieldType.BUSINESS_NAME */
  businessName: string;
  /** Call to action. Maps to AssetFieldType.CALL_TO_ACTION_SELECTION */
  callToAction: string;
  /** Display path */
  displayPath1: string;
  displayPath2: string;
  /** Search themes for this asset group (up to 25). Maps to AssetGroupSignal.search_theme.
   *  Each theme is a keyword/phrase that helps Google understand what the asset group is about. */
  searchThemes: string[];
  /** Audience signal IDs for this asset group. Maps to AssetGroupSignal.audience.
   *  References existing Audience resources. */
  audienceSignals: string[];
}

/** Display content targeting type.
 *  Maps to AdGroupCriterion keyword/topic/placement. */
export type DisplayContentTargetingType = "KEYWORDS" | "TOPICS" | "PLACEMENTS";

/** Display ad group with targeting + responsive display ads.
 *  Maps to AdGroup + AdGroupCriterion + AdGroupAd. */
export interface DisplayAdGroup {
  id: string;
  name: string;
  /** Content targeting keywords (contextual). Maps to AdGroupCriterion with keyword. */
  contentKeywords: string[];
  /** Topic targeting IDs. Maps to AdGroupCriterion with topic. */
  topics: string[];
  /** Managed placement URLs. Maps to AdGroupCriterion with placement. */
  placements: string[];
  /** Exclusion placements. Maps to AdGroupCriterion with negative=true placement. */
  excludedPlacements: string[];
  /** Responsive display ads within this ad group */
  ads: GoogleDisplayAd[];
}

/** Responsive Display Ad for Display campaigns.
 *  Maps to ResponsiveDisplayAdInfo in the Google Ads API. */
export interface GoogleDisplayAd {
  id: string;
  name: string;
  /** Headlines (1-5, max 30 chars each). Maps to ResponsiveDisplayAdInfo.headlines */
  headlines: GoogleCreativeAsset[];
  /** Long headline (1 required, max 90 chars). Maps to ResponsiveDisplayAdInfo.long_headline */
  longHeadline: string;
  /** Descriptions (1-5, max 90 chars each). Maps to ResponsiveDisplayAdInfo.descriptions */
  descriptions: GoogleCreativeAsset[];
  /** Marketing images (1-15 total with square, landscape 1.91:1 min 600x314). Maps to marketing_images */
  images: GoogleCreativeAsset[];
  /** Square marketing images (1-15 total with landscape, 1:1 min 300x300). Maps to square_marketing_images */
  squareImages: GoogleCreativeAsset[];
  /** Logo images (0-5, 4:1 min 512x128). Maps to logo_images */
  logos: GoogleCreativeAsset[];
  /** Square logo images (0-5, 1:1 min 128x128). Maps to square_logo_images */
  squareLogos: GoogleCreativeAsset[];
  /** YouTube video IDs (0-5). Maps to youtube_videos */
  youtubeVideos: string[];
  /** Final URL */
  finalUrl: string;
  /** Business name (max 25 chars). Maps to business_name */
  businessName: string;
  /** Call to action text (max 30 chars). Maps to call_to_action_text */
  callToAction: string;
  /** Main color hex (e.g. #ffffff). Maps to main_color */
  mainColor: string;
  /** Accent color hex. Maps to accent_color */
  accentColor: string;
  /** Allow flexible color. Maps to allow_flexible_color */
  allowFlexibleColor: boolean;
  /** Price prefix (e.g. "as low as"). Maps to price_prefix */
  pricePrefix: string;
  /** Promo text (e.g. "Free shipping"). Maps to promo_text */
  promoText: string;
  /** Format setting. Maps to format_setting */
  formatSetting: "ALL_FORMATS" | "NON_NATIVE" | "NATIVE";
}

export function createDisplayAd(index = 1): GoogleDisplayAd {
  return {
    id: `dad_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `Responsive Display Ad ${index}`,
    headlines: [
      { id: `dh_${Date.now()}_1`, type: "HEADLINE", text: "" },
      { id: `dh_${Date.now()}_2`, type: "HEADLINE", text: "" },
      { id: `dh_${Date.now()}_3`, type: "HEADLINE", text: "" },
      { id: `dh_${Date.now()}_4`, type: "HEADLINE", text: "" },
      { id: `dh_${Date.now()}_5`, type: "HEADLINE", text: "" },
    ],
    longHeadline: "",
    descriptions: [
      { id: `dd_${Date.now()}_1`, type: "DESCRIPTION", text: "" },
      { id: `dd_${Date.now()}_2`, type: "DESCRIPTION", text: "" },
      { id: `dd_${Date.now()}_3`, type: "DESCRIPTION", text: "" },
      { id: `dd_${Date.now()}_4`, type: "DESCRIPTION", text: "" },
      { id: `dd_${Date.now()}_5`, type: "DESCRIPTION", text: "" },
    ],
    images: [],
    squareImages: [],
    logos: [],
    squareLogos: [],
    youtubeVideos: [],
    finalUrl: "",
    businessName: "",
    callToAction: "AUTOMATED",
    mainColor: "",
    accentColor: "",
    allowFlexibleColor: true,
    pricePrefix: "",
    promoText: "",
    formatSetting: "ALL_FORMATS",
  };
}

export function createDisplayAdGroup(index = 1): DisplayAdGroup {
  return {
    id: `dag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: `Ad Group ${index}`,
    contentKeywords: [],
    topics: [],
    placements: [],
    excludedPlacements: [],
    ads: [createDisplayAd(1)],
  };
}

export interface GoogleCreativeSettings {
  /** Asset groups (PMax only) */
  assetGroups: GoogleAssetGroup[];
  /** YouTube upload destination (prototype) */
  youtubeUploadDestination?: "GOOGLE_MANAGED" | "BRAND";
  /** Optional YouTube channel ID for brand uploads */
  youtubeChannelId?: string;
  /** Optional YouTube channel name for display */
  youtubeChannelName?: string;
  /** Demand Gen ad groups (each with multiple ads). Maps to AdGroup + AdGroupAd */
  demandGenAdGroups: DemandGenAdGroup[];
  /** Search ad groups (each with keywords + RSAs). Maps to AdGroup + AdGroupCriterion + AdGroupAd */
  searchAdGroups: SearchAdGroup[];
  /** Display ad groups (each with content targeting + responsive display ads).
   *  Maps to AdGroup + AdGroupCriterion + AdGroupAd. */
  displayAdGroups: DisplayAdGroup[];
  /** Display ads (deprecated -- use displayAdGroups) */
  displayAds: GoogleDisplayAd[];
  /** App ads. Maps to AdGroupAd with AppAdInfo */
  appAds: GoogleAppAd[];
  /** Product group listing tree root (Shopping). Maps to AdGroupListingGroupFilter tree */
  productGroupRoot: ProductGroupNode | null;
  /** Retail PMax listing group mode */
  retailListingMode?: RetailListingMode;
  /** Selected values for retail listing groups (categories/brands/labels) */
  retailListingValues?: string[];
  /** Negative keywords (Shopping). Maps to CampaignCriterion with negative=true */
  negativeKeywords: NegativeKeyword[];
  /** Campaign-level sitelink extensions. Maps to CampaignAsset with SitelinkAsset */
  sitelinkExtensions: SearchSitelinkAsset[];
  /** Campaign-level callout extensions. Maps to CampaignAsset with CalloutAsset */
  calloutExtensions: SearchCalloutAsset[];
  /** Campaign-level structured snippet extensions. Maps to CampaignAsset with StructuredSnippetAsset */
  structuredSnippetExtensions: SearchStructuredSnippet[];
  /** Campaign-level price extensions. Maps to CampaignAsset with PriceAsset */
  priceExtensions: SearchPriceAsset[];
  /** Campaign-level promotion extensions. Maps to CampaignAsset with PromotionAsset */
  promotionExtensions: SearchPromotionAsset[];
  /** Whether to include Google Search Partners network.
   *  Maps to Campaign.network_settings.target_search_network. */
  searchPartners: boolean;
  /** Display Expansion on Search. When true, ads may show on GDN from Search campaigns.
   *  Maps to Campaign.network_settings.target_content_network. Default true. */
  targetContentNetwork: boolean;
}

/* ---- Full Campaign ---- */

export interface GoogleCampaignData {
  objective: GoogleObjectiveSettings;
  audience: GoogleAudienceSettings;
  budget: GoogleBudgetSettings;
  creative: GoogleCreativeSettings;
}

export const defaultGoogleCampaign: GoogleCampaignData = {
  objective: {
    campaignName: "",
    objective: "PERFORMANCE_MAX",
    tagMode: "salla_managed",
    merchantCenterConnected: false,
    merchantCenterId: "",
    feedEnabled: false,
    feedId: "",
    targetCountry: "SA",
    shoppingSettings: {
      merchantId: "",
      campaignPriority: 0,
      feedLabel: "",
      enableLocal: false,
    },
    demandGenChannels: {
      youtubeInStream: true,
      youtubeInFeed: true,
      youtubeShorts: true,
      discover: true,
      gmail: true,
      display: false,
    },
    demandGenAdType: "MULTI_ASSET",
    appSettings: {
      appStore: "GOOGLE_APP_STORE",
      appId: "",
      appName: "",
      biddingStrategyGoalType: "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST",
      advertisingChannelSubType: "APP_CAMPAIGN",
    },
    containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
  },
  audience: {
    locationIds: ["SA"],
    cityIds: [],
    excludedLocationIds: [],
    locationTargetingMethod: "PRESENCE",
    negativeLocationTargetingMethod: "PRESENCE_OR_INTEREST",
    languages: ["ar"],
    ageMin: 18,
    ageMax: 65,
    genders: [],
    devices: [],
    audienceSegments: [],
    excludedAudiences: [],
    keywords: [],
    negativeKeywords: [],
    audienceSignals: [],
    searchThemes: [],
    customSegmentKeywords: [],
    customSegmentUrls: [],
    inMarketSegments: [],
    affinitySegments: [],
    lookalikeSegments: [],
    lookalikeExpansion: "BALANCED",
    customerMatchLists: [],
    operatingSystems: [],
    optimizedTargeting: true,
    excludeRecentConverters: false,
    excludeRecentConvertersDays: 30,
    sallaAudienceCategory: "",
    audienceTargetingMode: "OBSERVATION",
    searchDevices: ["MOBILE", "DESKTOP", "TABLET"],
    searchDeviceBidAdjustments: { MOBILE: 0, DESKTOP: 0, TABLET: 0 },
    audienceBidAdjustments: {},
    adScheduleEntries: [],
    householdIncome: [],
    parentalStatus: [],
  },
  budget: {
    budgetPeriod: "DAILY",
    amount: 200,
    biddingStrategy: "MAXIMIZE_CONVERSIONS",
    targetCpa: 0,
    targetCpc: 0,
    targetRoas: 400,
    maxCpcBid: 0,
    targetImpressionShare: 50,
    impressionShareLocation: "ANYWHERE_ON_PAGE",
    impressionShareMaxCpc: 0,
    conversionGoal: "PURCHASE",
    deliveryMethod: "STANDARD",
    startDate: "",
    endDate: "",
    startTime: "00:00",
    endTime: "23:59",
    endDateOptional: false,
    schedule: "all_day",
    adSchedule: [],
    paymentMethod: "prepaid",
    performanceBoost: true,
    autoIncrease: {
      enabled: false,
      pct: 20,
      intervalDays: 7,
      maxDailyBudget: 600,
    },
    urlExpansionOptOut: false,
    brandGuidelinesEnabled: false,
    assetAutomationSettings: [],
    aiMaxSettings: {
      enableAiMax: false,
      brandInclusions: [],
      brandExclusions: [],
      urlInclusions: [],
    },
    textGuidelines: {
      termExclusions: [],
      messagingRestrictions: [],
    },
    demandGenBudgetMode: "DAILY",
    demandGenTotalAmount: 0,
  },
  creative: {
    assetGroups: [],
    youtubeUploadDestination: "GOOGLE_MANAGED",
    youtubeChannelId: "",
    youtubeChannelName: "",
    demandGenAdGroups: [
      {
        id: "dg-ag-1",
        name: "Ad Group 1",
        channelControls: {
          youtubeInStream: true,
          youtubeInFeed: true,
          youtubeShorts: true,
          discover: true,
          gmail: true,
          display: false,
        },
        ads: [
          {
            id: "dg-ad-1",
            name: "Ad 1",
            adType: "MULTI_ASSET",
            headlines: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }, { text: "" }],
            longHeadlines: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }, { text: "" }],
            descriptions: [{ text: "" }, { text: "" }, { text: "" }, { text: "" }, { text: "" }],
            businessName: "",
            finalUrl: "",
            callToAction: "AUTOMATED",
            images: [],
            logos: [],
            videos: [],
            companionBannerUrl: "",
            breadcrumb1: "",
            breadcrumb2: "",
            carouselHeadline: "",
            carouselDescription: "",
            carouselCards: [
              { id: "card-default-1", headline: "", imageUrl: "", finalUrl: "", callToAction: "AUTOMATED" },
              { id: "card-default-2", headline: "", imageUrl: "", finalUrl: "", callToAction: "AUTOMATED" },
            ],
            adAssetAutomation: {
              GENERATE_DESIGN_VERSIONS_FOR_IMAGES: "OPTED_IN",
              GENERATE_SHORTER_YOUTUBE_VIDEOS: "OPTED_IN",
              GENERATE_VERTICAL_YOUTUBE_VIDEOS: "OPTED_IN",
              GENERATE_VIDEOS_FROM_OTHER_ASSETS: "OPTED_IN",
            },
          },
        ],
      },
    ],
    searchAdGroups: [createSearchAdGroup(1)],
    displayAdGroups: [createDisplayAdGroup(1)],
    appAds: [createAppAd(1)],
  displayAds: [],
    productGroupRoot: {
      id: "root",
      dimensionType: "PRODUCT_CATEGORY",
      dimensionValue: "",
      type: "UNIT_INCLUDED",
      children: [],
    },
    retailListingMode: "ALL",
    retailListingValues: [],
    negativeKeywords: [],
    sitelinkExtensions: [],
    calloutExtensions: [],
    structuredSnippetExtensions: [],
    priceExtensions: [],
    promotionExtensions: [],
    searchPartners: true,
    targetContentNetwork: true,
  },
};
