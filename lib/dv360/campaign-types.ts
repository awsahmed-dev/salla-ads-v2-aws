/* ================================================================
   DV360 Campaign Types -- aligned to Display & Video 360 API v4
   Focus: YouTube & Partners line items
   Objectives: AWARENESS, CONSIDERATION, CONVERSION, PERFORMANCE
   ================================================================ */

/* ---- Enums ---- */

/** Our wizard objectives, mapped to DV360 CampaignGoalType */
export type DV360Objective = "AWARENESS" | "CONSIDERATION" | "CONVERSION" | "PERFORMANCE";

/** Maps to DV360 API CampaignGoal.campaignGoalType */
export type DV360CampaignGoalType =
  | "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS"
  | "CAMPAIGN_GOAL_TYPE_ONLINE_ACTION";

/** Maps to DV360 API PerformanceGoal.performanceGoalType */
export type DV360PerformanceGoalType =
  | "PERFORMANCE_GOAL_TYPE_CPM"
  | "PERFORMANCE_GOAL_TYPE_CPC"
  | "PERFORMANCE_GOAL_TYPE_CPA"
  | "PERFORMANCE_GOAL_TYPE_CPIAVC"
  | "PERFORMANCE_GOAL_TYPE_CTR"
  | "PERFORMANCE_GOAL_TYPE_VIEWABILITY"
  | "PERFORMANCE_GOAL_TYPE_VTR"
  | "PERFORMANCE_GOAL_TYPE_VIDEO_COMPLETION_RATE";

/** Maps to DV360 API LineItemType -- YouTube & Partners specific */
export type DV360LineItemType =
  | "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_REACH"
  | "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_VIEW"
  | "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_ACTION"
  | "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_SIMPLE";

/** Maps to DV360 API BiddingStrategy.youtubeAndPartnersBiddingStrategy */
export type DV360BiddingStrategy =
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPV"
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPM"
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM"
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPA"
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_ROAS"
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_LIFT"
  | "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS";

/** Maps to DV360 API Pacing.pacingPeriod + pacingType */
export type DV360PacingType = "PACING_TYPE_EVEN" | "PACING_TYPE_AHEAD" | "PACING_TYPE_ASAP";

/** Maps to DV360 API FrequencyCap.timeUnit */
export type DV360FrequencyTimeUnit = "TIME_UNIT_MINUTES" | "TIME_UNIT_HOURS" | "TIME_UNIT_DAYS" | "TIME_UNIT_WEEKS" | "TIME_UNIT_MONTHS" | "TIME_UNIT_LIFETIME";

/** YouTube video ad formats */
export type DV360VideoFormat =
  | "SKIPPABLE_IN_STREAM"    // Skip after 5s, pay per view/impression
  | "NON_SKIPPABLE_IN_STREAM" // 15s forced, pay per impression
  | "BUMPER"                 // 6s forced, pay per impression
  | "IN_FEED"               // Thumbnail in YouTube feed, pay per view
  | "SHORTS";               // YouTube Shorts vertical video

/** Maps to DV360 API InventorySourceType for YouTube */
export type DV360InventorySource = "YOUTUBE" | "GOOGLE_TV" | "VIDEO_PARTNERS";

/** Content category / brand safety. Maps to DV360 ContentFilterType */
export type DV360ContentCategory = "CONTENT_FILTER_TYPE_STANDARD" | "CONTENT_FILTER_TYPE_EXPANDED" | "CONTENT_FILTER_TYPE_LIMITED";

/** Device type targeting. Maps to DV360 DeviceType */
export type DV360DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "CONNECTED_TV";

/** Gender targeting */
export type DV360Gender = "MALE" | "FEMALE" | "UNKNOWN";

/** Age range targeting. Maps to DV360 AgeRange */
export type DV360AgeRange = "18_24" | "25_34" | "35_44" | "45_54" | "55_64" | "65_PLUS" | "UNKNOWN";

/** Parental status targeting */
export type DV360ParentalStatus = "PARENT" | "NOT_A_PARENT" | "UNKNOWN";

/** Household income targeting */
export type DV360HouseholdIncome = "TOP_10" | "11_20" | "21_30" | "31_40" | "41_50" | "LOWER_50" | "UNKNOWN";

/* ---- Objective Config ---- */

export interface DV360ObjectiveConfig {
  /** DV360 API CampaignGoalType */
  campaignGoalType: DV360CampaignGoalType;
  /** Human-readable label */
  label: string;
  /** Description shown to the merchant */
  description: string;
  /** DV360 YouTube line item type for this objective */
  lineItemType: DV360LineItemType;
  /** Allowed bidding strategies */
  allowedBiddingStrategies: DV360BiddingStrategy[];
  /** Default bidding strategy */
  defaultBiddingStrategy: DV360BiddingStrategy;
  /** Allowed performance goal types */
  allowedPerformanceGoals: DV360PerformanceGoalType[];
  /** Default performance goal */
  defaultPerformanceGoal: DV360PerformanceGoalType;
  /** Whether conversion tracking is required */
  conversionTrackingRequired: boolean;
  /** Allowed video formats */
  allowedVideoFormats: DV360VideoFormat[];
  /** Default video format */
  defaultVideoFormat: DV360VideoFormat;
  /** Default CTA label */
  defaultCTA: string;
  /** Whether this objective is currently active in the wizard */
  active: boolean;
}

export const DV360_OBJECTIVE_CONFIGS: Record<DV360Objective, DV360ObjectiveConfig> = {
  AWARENESS: {
    campaignGoalType: "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS",
    label: "Awareness",
    description: "Maximize reach and brand recall on YouTube with video ads optimized for impressions and frequency",
    lineItemType: "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_REACH",
    allowedBiddingStrategies: [
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_LIFT",
    ],
    defaultBiddingStrategy: "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM",
    allowedPerformanceGoals: ["PERFORMANCE_GOAL_TYPE_CPM", "PERFORMANCE_GOAL_TYPE_VIEWABILITY"],
    defaultPerformanceGoal: "PERFORMANCE_GOAL_TYPE_CPM",
    conversionTrackingRequired: false,
    allowedVideoFormats: ["SKIPPABLE_IN_STREAM", "NON_SKIPPABLE_IN_STREAM", "BUMPER"],
    defaultVideoFormat: "SKIPPABLE_IN_STREAM",
    defaultCTA: "",
    active: true,
  },
  CONSIDERATION: {
    campaignGoalType: "CAMPAIGN_GOAL_TYPE_BRAND_AWARENESS",
    label: "Consideration",
    description: "Drive video views and audience engagement with ads optimized for watch time and interaction",
    lineItemType: "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_VIEW",
    allowedBiddingStrategies: [
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPV",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_LIFT",
    ],
    defaultBiddingStrategy: "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPV",
    allowedPerformanceGoals: ["PERFORMANCE_GOAL_TYPE_CPIAVC", "PERFORMANCE_GOAL_TYPE_VTR", "PERFORMANCE_GOAL_TYPE_VIDEO_COMPLETION_RATE", "PERFORMANCE_GOAL_TYPE_CPM"],
    defaultPerformanceGoal: "PERFORMANCE_GOAL_TYPE_CPIAVC",
    conversionTrackingRequired: false,
    allowedVideoFormats: ["SKIPPABLE_IN_STREAM", "IN_FEED", "SHORTS"],
    defaultVideoFormat: "SKIPPABLE_IN_STREAM",
    defaultCTA: "Learn more",
    active: true,
  },
  CONVERSION: {
    campaignGoalType: "CAMPAIGN_GOAL_TYPE_ONLINE_ACTION",
    label: "Conversion",
    description: "Drive online actions like purchases and sign-ups with YouTube video ads optimized for conversions",
    lineItemType: "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_ACTION",
    allowedBiddingStrategies: [
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPA",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_ROAS",
    ],
    defaultBiddingStrategy: "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS",
    allowedPerformanceGoals: ["PERFORMANCE_GOAL_TYPE_CPA", "PERFORMANCE_GOAL_TYPE_CPC", "PERFORMANCE_GOAL_TYPE_CTR"],
    defaultPerformanceGoal: "PERFORMANCE_GOAL_TYPE_CPA",
    conversionTrackingRequired: true,
    allowedVideoFormats: ["SKIPPABLE_IN_STREAM", "IN_FEED", "SHORTS"],
    defaultVideoFormat: "SKIPPABLE_IN_STREAM",
    defaultCTA: "Shop now",
    active: true,
  },
  PERFORMANCE: {
    campaignGoalType: "CAMPAIGN_GOAL_TYPE_ONLINE_ACTION",
    label: "Performance",
    description: "Maximize conversions and ROAS with fully automated YouTube ads using AI-optimized bidding, placements, and multi-format delivery",
    lineItemType: "LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_SIMPLE",
    allowedBiddingStrategies: [
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPA",
      "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_ROAS",
    ],
    defaultBiddingStrategy: "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS",
    allowedPerformanceGoals: ["PERFORMANCE_GOAL_TYPE_CPA", "PERFORMANCE_GOAL_TYPE_CPC", "PERFORMANCE_GOAL_TYPE_CTR"],
    defaultPerformanceGoal: "PERFORMANCE_GOAL_TYPE_CPA",
    conversionTrackingRequired: true,
    allowedVideoFormats: ["SKIPPABLE_IN_STREAM", "NON_SKIPPABLE_IN_STREAM", "BUMPER", "IN_FEED", "SHORTS"],
    defaultVideoFormat: "SKIPPABLE_IN_STREAM",
    defaultCTA: "Shop now",
    active: true,
  },
};

/* ---- Settings Interfaces ---- */

/** Step 0: Objective settings */
export interface DV360ObjectiveSettings {
  /** Selected objective */
  objective: DV360Objective;
  /** Campaign name entered by the merchant */
  campaignName: string;
  /** DV360 Advertiser ID (linked from Salla) */
  advertiserId: string;
  /** Floodlight activity ID for conversion tracking */
  floodlightActivityId: string;
  /** YouTube channel URL (optional) */
  youtubeChannelUrl: string;
}

/** Step 1: Audience & targeting */
export interface DV360AudienceSettings {
  /** Geographic targeting: country/region/city IDs. For type "city", radiusKm is used for proximity (lat/lng + radius). */
  geoTargets: { id: string; name: string; type: "country" | "region" | "city"; radiusKm?: number }[];
  /** Language targeting */
  languages: { id: string; name: string }[];
  /** Age range targeting */
  ageRanges: DV360AgeRange[];
  /** Gender targeting */
  genders: DV360Gender[];
  /** Parental status targeting */
  parentalStatuses: DV360ParentalStatus[];
  /** Household income targeting */
  householdIncomes: DV360HouseholdIncome[];
  /** Interest / affinity audience segments */
  interests: { id: string; name: string; type: "AFFINITY" | "IN_MARKET" | "CUSTOM_INTENT" }[];
  /** Keyword targeting (positive) */
  keywords: string[];
  /** Negative keyword targeting */
  excludeKeywords: string[];
  /** Custom audience IDs */
  customAudiences: { id: string; name: string }[];
  /** Inventory sources (where ads show) */
  inventorySources: DV360InventorySource[];
  /** Content category / brand safety */
  contentCategory: DV360ContentCategory;
  /** Device targeting */
  deviceTypes: DV360DeviceType[];
  /** Optimized targeting (DV360 targeting expansion) */
  optimizedTargeting: boolean;
  /** Salla: Exclude recent purchasers */
  excludeRecentPurchasers: boolean;
  /** Salla: Days window for exclusion */
  excludeRecentPurchasersDays: number;
  /** Salla: Lookalike audiences enabled */
  sallaLookalikeEnabled: boolean;
  /** Salla: Buyer category for lookalike */
  sallaAudienceCategory: string;
  /** Target frequency (Awareness only) -- impressions per user per time unit */
  targetFrequency: {
    enabled: boolean;
    maxImpressions: number;
    timeUnit: DV360FrequencyTimeUnit;
  };
  /** Day and time scheduling */
  dayAndTimeSchedule: {
    id: string;
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    startHour: number;
    endHour: number;
  }[];
}

/** Step 2: Budget & bidding */
export interface DV360BudgetSettings {
  /** Total campaign budget amount in SAR */
  budgetAmount: number;
  /** Currency code */
  currency: string;
  /** Campaign start date */
  startDate: string;
  /** Campaign end date */
  endDate: string;
  /** Pacing strategy */
  pacing: DV360PacingType;
  /** Frequency cap */
  frequencyCap: {
    enabled: boolean;
    maxImpressions: number;
    timeUnit: DV360FrequencyTimeUnit;
  };
  /** Bidding strategy */
  biddingStrategy: DV360BiddingStrategy;
  /** Target CPM amount (SAR) -- for Awareness */
  targetCpm: number | null;
  /** Target CPV amount (SAR) -- for Consideration */
  targetCpv: number | null;
  /** Target CPA amount (SAR) -- for Conversion */
  targetCpa: number | null;
  /** Target ROAS (%) -- for Performance */
  targetRoas: number | null;
  /** Performance goal type */
  performanceGoalType: DV360PerformanceGoalType;
  /** Performance goal amount (currency micros for DV360 API) */
  performanceGoalAmount: number | null;
  /** Salla Boost addon */
  performanceBoost: boolean;
}

/** A single video ad / line item creative */
export interface DV360VideoAd {
  id: string;
  /** Ad name */
  name: string;
  /** YouTube video URL */
  youtubeVideoUrl: string;
  /** Video format */
  videoFormat: DV360VideoFormat;
  /** Whether video is skippable (derived from format but can be overridden) */
  skippable: boolean;
  /** Companion banner image URL (300x60 or auto-generated) */
  companionBannerUrl: string;
  /** Call-to-action text */
  callToAction: string;
  /** Display URL shown on the ad */
  displayUrl: string;
  /** Landing page URL */
  landingPageUrl: string;
  /** Ad headline (for In-Feed format) */
  headline: string;
  /** Ad description (for In-Feed format) */
  description: string;
}

/** Step 3: Creative settings */
export interface DV360CreativeSettings {
  /** Video ads (one per line item) */
  videoAds: DV360VideoAd[];
}

/** Full campaign data */
export interface DV360CampaignData {
  objective: DV360ObjectiveSettings;
  audience: DV360AudienceSettings;
  budget: DV360BudgetSettings;
  creative: DV360CreativeSettings;
}

/* ---- Factory Functions ---- */

let _videoAdCounter = 0;

export function createVideoAd(objective: DV360Objective): DV360VideoAd {
  const ts = Date.now() + ++_videoAdCounter;
  const config = DV360_OBJECTIVE_CONFIGS[objective];
  return {
    id: `vid-${ts}`,
    name: "",
    youtubeVideoUrl: "",
    videoFormat: config.defaultVideoFormat,
    skippable: config.defaultVideoFormat === "SKIPPABLE_IN_STREAM" || config.defaultVideoFormat === "IN_FEED",
    companionBannerUrl: "",
    callToAction: config.defaultCTA,
    displayUrl: "",
    landingPageUrl: "",
    headline: "",
    description: "",
  };
}

/* ---- Step Label Configs per Objective ---- */

export const DV360_STEP_LABELS: Record<DV360Objective, string[]> = {
  AWARENESS: ["Audience & Reach", "Budget & Frequency", "Video Ads", "Review & Launch"],
  CONSIDERATION: ["Audience & Interests", "Budget & Bidding", "Video Ads", "Review & Launch"],
  CONVERSION: ["Audience & Conversions", "Budget & Bidding", "Video Ads", "Review & Launch"],
  PERFORMANCE: ["Audience & Signals", "Budget & Bidding", "Video Ads", "Review & Launch"],
};

/* ---- Defaults ---- */

export const defaultDV360Campaign: DV360CampaignData = {
  objective: {
    objective: "AWARENESS",
    campaignName: "",
    advertiserId: "",
    floodlightActivityId: "",
    youtubeChannelUrl: "",
  },
  audience: {
    geoTargets: [{ id: "SA", name: "Saudi Arabia", type: "country" }],
    languages: [{ id: "ar", name: "Arabic" }, { id: "en", name: "English" }],
    ageRanges: ["18_24", "25_34", "35_44", "45_54", "55_64", "65_PLUS"],
    genders: ["MALE", "FEMALE"],
    parentalStatuses: [],
    householdIncomes: [],
    interests: [],
    keywords: [],
    excludeKeywords: [],
    customAudiences: [],
    inventorySources: ["YOUTUBE"],
    contentCategory: "CONTENT_FILTER_TYPE_STANDARD",
    deviceTypes: ["DESKTOP", "MOBILE", "TABLET", "CONNECTED_TV"],
    optimizedTargeting: true,
    excludeRecentPurchasers: false,
    excludeRecentPurchasersDays: 30,
    sallaLookalikeEnabled: false,
    sallaAudienceCategory: "",
    targetFrequency: {
      enabled: false,
      maxImpressions: 3,
      timeUnit: "TIME_UNIT_WEEKS",
    },
    dayAndTimeSchedule: [],
  },
  budget: {
    budgetAmount: 5000,
    currency: "SAR",
    startDate: "",
    endDate: "",
    pacing: "PACING_TYPE_EVEN",
    frequencyCap: {
      enabled: true,
      maxImpressions: 5,
      timeUnit: "TIME_UNIT_WEEKS",
    },
    biddingStrategy: "YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM",
    targetCpm: null,
    targetCpv: null,
    targetCpa: null,
    targetRoas: null,
    performanceGoalType: "PERFORMANCE_GOAL_TYPE_CPM",
    performanceGoalAmount: null,
    performanceBoost: true,
  },
  creative: {
    videoAds: [],
  },
};
