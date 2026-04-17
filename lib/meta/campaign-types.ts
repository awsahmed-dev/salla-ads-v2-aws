/* ================================================================
   Campaign Types -- aligned to Meta Marketing API v24 (Graph API)
   Two-tier integration: Facebook + Instagram placements
   Objectives: OUTCOME-based (v17+ simplified objectives)
   ================================================================ */

/* ---- Enums ---- */

/** Maps to API objective field on Campaign level. OUTCOME-based (v17+). */
export type MetaObjective =
  | "OUTCOME_SALES"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_AWARENESS"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_APP_PROMOTION";

/** Maps to API optimization_goal at Ad Set level */
export type MetaOptimizationGoal =
  | "OFFSITE_CONVERSIONS"  // Website purchases/conversions
  | "VALUE"                // Maximize purchase value (ROAS)
  | "LINK_CLICKS"          // Maximize link clicks
  | "LANDING_PAGE_VIEWS"   // Quality clicks that load landing page
  | "REACH"                // Maximize unique users reached
  | "IMPRESSIONS"          // Maximize total impressions
  | "AD_RECALL_LIFT"       // Brand awareness (estimated recall)
  | "THRUPLAY"             // Video views (15s+ or full video)
  | "POST_ENGAGEMENT"      // Likes, comments, shares on post
  | "LEAD_GENERATION"      // Instant Form submissions
  | "APP_INSTALLS"         // App installations
  | "CONVERSATIONS";       // Messenger / WhatsApp / Instagram Direct

/** Maps to API billing_event at Ad Set level */
export type MetaBillingEvent = "IMPRESSIONS" | "LINK_CLICKS" | "THRUPLAY";

/** Maps to API bid_strategy at Campaign or Ad Set level */
export type MetaBidStrategy =
  | "LOWEST_COST_WITHOUT_CAP"   // Lowest cost (auto, default)
  | "LOWEST_COST_WITH_BID_CAP"  // Bid cap
  | "COST_CAP"                  // Cost cap (target CPA)
  | "LOWEST_COST_WITH_MIN_ROAS"; // Minimum ROAS

/** Budget type: daily or lifetime */
export type MetaBudgetType = "daily" | "lifetime";

/** Maps to API publisher_platforms -- the two-tier Facebook + Instagram integration */
export type MetaPublisherPlatform = "facebook" | "instagram" | "audience_network" | "messenger";

/** Maps to API facebook_positions */
export type MetaFacebookPosition =
  | "feed"
  | "right_hand_column"
  | "instant_article"
  | "marketplace"
  | "video_feeds"
  | "story"
  | "reels"
  | "search"
  | "facebook_groups_feed";

/** Maps to API instagram_positions */
export type MetaInstagramPosition =
  | "stream"       // Instagram Feed
  | "story"        // Instagram Stories
  | "reels"        // Instagram Reels
  | "explore"      // Explore page
  | "explore_home" // Explore Home
  | "ig_search"    // Instagram Search
  | "profile_feed"; // Profile Feed

/** Maps to API special_ad_categories (required for certain regulated ads) */
export type MetaSpecialAdCategory =
  | "NONE"
  | "HOUSING"
  | "EMPLOYMENT"
  | "CREDIT"
  | "ISSUES_ELECTIONS_POLITICS";

/** Pixel setup mode for Salla integration */
export type MetaPixelMode = "existing" | "salla_managed" | "none";

/** Placement mode: automatic (Advantage+) or manual */
export type MetaPlacementMode = "AUTOMATIC" | "MANUAL";

/** Gender for audience targeting */
export type MetaGender = "ALL" | "MALE" | "FEMALE";

/** Conversion location for the promoted_object */
export type MetaConversionLocation = "WEBSITE" | "APP" | "MESSAGING" | "INSTANT_FORM" | "CALLS";

/** Pacing type */
export type MetaPacing = "standard" | "no_pacing";

/** Brand safety inventory filter level. Maps to API brand_safety_content_filter_levels. */
export type MetaBrandSafetyLevel =
  | "FACEBOOK_STANDARD"    // Standard inventory (recommended)
  | "AN_STANDARD"          // Audience Network standard
  | "FULL_INVENTORY"       // No restrictions -- maximum reach
  | "LIMITED_INVENTORY";   // Most restrictive -- no mature themes

/** Frequency cap configuration. Maps to API frequency_control_specs at Ad Set level. */
export interface MetaFrequencyCap {
  /** Whether frequency cap is enabled */
  enabled: boolean;
  /** Max impressions per user (1-20). Maps to max_frequency. */
  maxFrequency: number;
  /** Time window in days (1-30). Maps to interval_days. */
  intervalDays: number;
}

/** Click attribution window */
export type MetaClickAttributionWindow = "1d_click" | "7d_click";
/** View attribution window */
export type MetaViewAttributionWindow = "none" | "1d_view" | "7d_view";

/* ---- Ad Formats & CTAs ---- */

/** Meta ad format */
export type MetaAdFormat =
  | "SINGLE_IMAGE"
  | "SINGLE_VIDEO"
  | "CAROUSEL"
  | "COLLECTION"
  | "DYNAMIC";

/** Media type */
export type MetaMediaType = "IMAGE" | "VIDEO";

/** CTA values. Maps to API call_to_action.type on ad creative */
export type MetaCTA =
  | "SHOP_NOW"
  | "LEARN_MORE"
  | "SIGN_UP"
  | "DOWNLOAD"
  | "INSTALL_NOW"
  | "SUBSCRIBE"
  | "GET_OFFER"
  | "BOOK_NOW"
  | "CONTACT_US"
  | "APPLY_NOW"
  | "ORDER_NOW"
  | "GET_QUOTE"
  | "SEND_MESSAGE"
  | "WATCH_MORE"
  | "GET_DIRECTIONS"
  | "CALL_NOW"
  | "WHATSAPP_MESSAGE"
  | "NO_BUTTON";

/* ---- Objective Config ---- */

export interface MetaObjectiveConfig {
  /** Meta API objective value */
  apiObjective: string;
  /** Human-readable label */
  label: string;
  /** Description shown to the merchant */
  description: string;
  /** Allowed optimization goals for this objective */
  allowedGoals: MetaOptimizationGoal[];
  /** Default optimization goal */
  defaultGoal: MetaOptimizationGoal;
  /** Pixel requirement */
  pixelRequirement: "required" | "optional" | "none";
  /** Whether product catalog can be used */
  catalogAvailable: boolean;
  /** Allowed ad formats */
  allowedAdFormats: MetaAdFormat[];
  /** Default CTA */
  defaultCTA: MetaCTA;
  /** Allowed bid strategies */
  allowedBidStrategies: MetaBidStrategy[];
  /** Whether conversion/attribution windows apply */
  hasConversionWindow: boolean;
  /** Conversion locations available */
  conversionLocations: MetaConversionLocation[];
  /** Default destination_type (required at Ad Set level for OUTCOME-based objectives) */
  defaultDestinationType: string;
  /** Allowed destination_types per the API. OUTCOME_SALES supports WEBSITE, MESSENGER, PHONE_CALL. */
  allowedDestinationTypes: string[];
}

export const META_OBJECTIVE_CONFIGS: Record<string, MetaObjectiveConfig> = {
  OUTCOME_SALES: {
    apiObjective: "OUTCOME_SALES",
    label: "Sales",
    description: "Drive purchases on your website or from your product catalog",
    allowedGoals: ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "LANDING_PAGE_VIEWS", "CONVERSATIONS"],
    defaultGoal: "OFFSITE_CONVERSIONS",
    pixelRequirement: "required",
    catalogAvailable: true,
    allowedAdFormats: ["SINGLE_IMAGE", "SINGLE_VIDEO", "CAROUSEL", "COLLECTION", "DYNAMIC"],
    defaultCTA: "SHOP_NOW",
    allowedBidStrategies: ["LOWEST_COST_WITHOUT_CAP", "COST_CAP", "LOWEST_COST_WITH_BID_CAP", "LOWEST_COST_WITH_MIN_ROAS"],
    hasConversionWindow: true,
    conversionLocations: ["WEBSITE", "MESSAGING"],
    defaultDestinationType: "WEBSITE",
    allowedDestinationTypes: ["WEBSITE", "MESSENGER", "PHONE_CALL", "APP"],
  },
  OUTCOME_TRAFFIC: {
    apiObjective: "OUTCOME_TRAFFIC",
    label: "Traffic",
    description: "Send more people to your website, app, or landing page",
    allowedGoals: ["LINK_CLICKS", "LANDING_PAGE_VIEWS", "REACH", "IMPRESSIONS"],
    defaultGoal: "LINK_CLICKS",
    pixelRequirement: "optional",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_IMAGE", "SINGLE_VIDEO", "CAROUSEL"],
    defaultCTA: "LEARN_MORE",
    allowedBidStrategies: ["LOWEST_COST_WITHOUT_CAP", "COST_CAP", "LOWEST_COST_WITH_BID_CAP"],
    hasConversionWindow: false,
    conversionLocations: ["WEBSITE", "MESSAGING", "APP"],
    defaultDestinationType: "WEBSITE",
    allowedDestinationTypes: ["WEBSITE", "MESSENGER", "APP"],
  },
  OUTCOME_AWARENESS: {
    apiObjective: "OUTCOME_AWARENESS",
    label: "Awareness",
    description: "Maximize reach and brand recognition among your target audience",
    allowedGoals: ["REACH", "IMPRESSIONS", "AD_RECALL_LIFT", "THRUPLAY"],
    defaultGoal: "REACH",
    pixelRequirement: "none",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_IMAGE", "SINGLE_VIDEO", "CAROUSEL"],
    defaultCTA: "LEARN_MORE",
    allowedBidStrategies: ["LOWEST_COST_WITHOUT_CAP", "LOWEST_COST_WITH_BID_CAP"],
    hasConversionWindow: false,
    conversionLocations: [],
    defaultDestinationType: "UNDEFINED",
    allowedDestinationTypes: ["UNDEFINED"],
  },
  OUTCOME_ENGAGEMENT: {
    apiObjective: "OUTCOME_ENGAGEMENT",
    label: "Engagement",
    description: "Get more video views, post interactions, or messages",
    allowedGoals: ["THRUPLAY", "POST_ENGAGEMENT", "LINK_CLICKS", "REACH", "IMPRESSIONS"],
    defaultGoal: "THRUPLAY",
    pixelRequirement: "none",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_IMAGE", "SINGLE_VIDEO", "CAROUSEL"],
    defaultCTA: "LEARN_MORE",
    allowedBidStrategies: ["LOWEST_COST_WITHOUT_CAP", "COST_CAP", "LOWEST_COST_WITH_BID_CAP"],
    hasConversionWindow: false,
    conversionLocations: [],
    defaultDestinationType: "UNDEFINED",
    allowedDestinationTypes: ["UNDEFINED"],
  },
  OUTCOME_APP_PROMOTION: {
    apiObjective: "OUTCOME_APP_PROMOTION",
    label: "App Promotion",
    description: "Drive app installs and in-app actions from Facebook and Instagram",
    allowedGoals: ["APP_INSTALLS", "OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS"],
    defaultGoal: "APP_INSTALLS",
    pixelRequirement: "none",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_IMAGE", "SINGLE_VIDEO", "CAROUSEL"],
    defaultCTA: "INSTALL_NOW",
    allowedBidStrategies: ["LOWEST_COST_WITHOUT_CAP", "COST_CAP", "LOWEST_COST_WITH_BID_CAP", "LOWEST_COST_WITH_MIN_ROAS"],
    hasConversionWindow: true,
    conversionLocations: ["APP"],
    defaultDestinationType: "APP",
    allowedDestinationTypes: ["APP"],
  },
};

/* ---- Conversion Events ---- */

/** Maps to API custom_event_type for OFFSITE_CONVERSIONS / VALUE goals */
export type MetaConversionEvent =
  | "PURCHASE"
  | "INITIATE_CHECKOUT"
  | "ADD_TO_CART"
  | "VIEW_CONTENT"
  | "ADD_PAYMENT_INFO"
  | "COMPLETE_REGISTRATION"
  | "LEAD"
  | "SEARCH";

/* ---- App Settings ---- */

export type MetaAppPlatform = "IOS" | "ANDROID";

export interface MetaAppSettings {
  /** Maps to API application_id in promoted_object */
  appId: string;
  /** Display name (UI only) */
  appName: string;
  /** App platform */
  appPlatform: MetaAppPlatform;
  /** App Store / Google Play URL. Maps to API object_store_url in promoted_object. */
  appStoreUrl: string;
}

/* ---- Step: Objective ---- */

export interface MetaObjectiveSettings {
  /** Campaign name (UI + API name field) */
  campaignName: string;
  /** Selected objective */
  objective: MetaObjective;
  /** Special ad categories (required by Meta for regulated ads) */
  specialAdCategories: MetaSpecialAdCategory[];

  /* ---- Pixel ---- */
  /** Meta Pixel setup mode */
  pixelMode: MetaPixelMode;
  /** Maps to API pixel_id in promoted_object */
  pixelId: string;
  pixelName: string;

  /* ---- Catalog ---- */
  /** Whether product catalog is enabled. Maps to promoted_object.product_catalog_id. */
  catalogEnabled: boolean;
  catalogId: string;

  /* ---- Conversion Location ---- */
  /** Where conversions happen (WEBSITE, APP, INSTANT_FORM, MESSAGING, CALLS) */
  conversionLocation: MetaConversionLocation;

  /* ---- Placements (two-tier: Facebook + Instagram) ---- */
  /** Advantage+ (automatic) or Manual placements */
  placementMode: MetaPlacementMode;
  /** Selected publisher platforms. Maps to API publisher_platforms. */
  publisherPlatforms: MetaPublisherPlatform[];
  /** Selected Facebook positions. Maps to API facebook_positions. */
  facebookPositions: MetaFacebookPosition[];
  /** Selected Instagram positions. Maps to API instagram_positions. */
  instagramPositions: MetaInstagramPosition[];

  /* ---- Facebook Page & Instagram Account (required for ads) ---- */
  /** Maps to API actor_id on ad creative / promoted_object.page_id */
  facebookPageId: string;
  facebookPageName: string;
  /** Maps to API instagram_actor_id on ad creative */
  instagramAccountId: string;
  instagramAccountName: string;

  /* ---- App Promotion ---- */
  appSettings: MetaAppSettings;
}

/* ---- Step: Audience ---- */

export interface MetaAudienceSettings {
  /** Country codes for targeting. Maps to API geo_locations.countries. */
  countries: string[];
  /** City keys. Maps to API geo_locations.cities. */
  cities: string[];
  /** Per-city radius in km for proximity targeting (lat/lng + radius). Keys = city id. */
  cityRadii?: Record<string, number>;
  /** Age min (18-65). Maps to API age_min. */
  ageMin: number;
  /** Age max (18-65). Maps to API age_max. */
  ageMax: number;
  /** Gender. Maps to API genders (1=male, 2=female, empty=all). */
  gender: MetaGender;
  /** Locale codes. Maps to API locales. */
  languages: string[];
  /** Interest targeting IDs. Maps to API flexible_spec.interests. */
  interests: string[];
  /** Behavior targeting IDs. Maps to API flexible_spec.behaviors. */
  behaviors: string[];
  /** Custom audience IDs. Maps to API custom_audiences. */
  customAudienceIds: string[];
  /** Excluded custom audience IDs. Maps to API excluded_custom_audiences. */
  excludedAudienceIds: string[];
  /** Lookalike audience IDs */
  lookalikeAudienceIds: string[];
  /** Enable Advantage+ Audience (Meta's AI-expanded targeting). Maps to API targeting_optimization. */
  advantagePlusAudience: boolean;
  /** OS targeting. Maps to API user_os. */
  operatingSystems: string[];
  /** Salla: Exclude recent purchasers */
  excludeRecentPurchasers: boolean;
  /** Salla: Days window for exclusion */
  excludeRecentPurchasersDays: number;
  /** Salla: Auto-targeting / lookalike enabled */
  autoTargetingEnabled: boolean;
  /** Salla: Buyer category for lookalike seeding */
  sallaAudienceCategory: string;
}

/* ---- Step: Budget ---- */

export interface MetaBudgetSettings {
  /** Daily or lifetime budget */
  budgetType: MetaBudgetType;
  /** Budget amount in SAR */
  amount: number;
  /** Optimization goal */
  optimizationGoal: MetaOptimizationGoal;
  /** Conversion event (for OFFSITE_CONVERSIONS/VALUE) */
  conversionEvent: MetaConversionEvent;
  /** Bid strategy */
  bidStrategy: MetaBidStrategy;
  /** Bid/cost cap amount (when using COST_CAP or BID_CAP) */
  bidAmount: number;
  /** Minimum ROAS target (when using LOWEST_COST_WITH_MIN_ROAS) */
  roasTarget: number;
  /** Billing event -- auto-derived */
  billingEvent: MetaBillingEvent;
  /** Pacing */
  pacing: MetaPacing;
  /** Schedule */
  startDate: string;
  endDate: string;
  endDateOptional: boolean;
  /** Click attribution window */
  clickAttributionWindow: MetaClickAttributionWindow;
  /** View attribution window */
  viewAttributionWindow: MetaViewAttributionWindow;
  /** Payment method: pay as you go or prepaid */
  paymentMethod: "pay_as_you_go" | "prepaid";
  /** Salla performance boost upsell */
  performanceBoost: boolean;
  /** Salla auto-increase configuration */
  autoIncrease: {
    enabled: boolean;
    pct: number;
    intervalDays: number;
    maxDailyBudget: number;
  };
  /** Frequency cap. Maps to API frequency_control_specs. */
  frequencyCap: MetaFrequencyCap;
}

/* ---- Step: Creative ---- */

export interface MetaCreativeAsset {
  id: string;
  type: MetaMediaType;
  url: string;
  file?: File;
  /** Hash returned after upload. Maps to API image_hash or video_id. */
  mediaHash?: string;
  thumbnailUrl?: string;
}

export interface MetaCarouselCard {
  id: string;
  imageUrl: string;
  file?: File;
  headline?: string;
  description?: string;
  /** Link for this card */
  link?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  /** Ad format */
  adFormat: MetaAdFormat;
  /** Main creative assets */
  assets: MetaCreativeAsset[];
  /** Carousel cards (for CAROUSEL format, 2-10 cards) */
  carouselCards: MetaCarouselCard[];

  /* ---- Ad Copy ---- */
  /** Primary text (body). Maps to API message on ad creative. */
  primaryText: string;
  /** Headline. Maps to API title / asset_feed_spec.titles. */
  headline: string;
  /** Description / link description. Maps to API link_description. */
  description: string;
  /** Website URL. Maps to API link / website_url. */
  websiteUrl: string;
  /** Display link (shortened URL shown in ad). Maps to API caption. */
  displayLink: string;

  /* ---- CTA ---- */
  callToAction: MetaCTA;

  /* ---- Tracking ---- */
  /** UTM source */
  utmSource: string;
  /** UTM medium */
  utmMedium: string;
  /** UTM campaign */
  utmCampaign: string;
  /** URL parameters string */
  urlParameters: string;
}

export interface MetaCreativeSettings {
  /** All ads in this campaign */
  ads: MetaAd[];
  /** Brand safety inventory filter. Maps to API brand_safety_content_filter_levels. */
  brandSafetyLevel: MetaBrandSafetyLevel;
  /** Advantage+ Creative enhancements (brightness, crop, text). Maps to degrees_of_freedom_spec. */
  advantagePlusCreative?: boolean;
}

/* ---- Full Campaign ---- */

export interface MetaCampaignData {
  objective: MetaObjectiveSettings;
  audience: MetaAudienceSettings;
  budget: MetaBudgetSettings;
  creative: MetaCreativeSettings;
}

export const defaultMetaCampaign: MetaCampaignData = {
  objective: {
    campaignName: "",
    objective: "OUTCOME_SALES",
    specialAdCategories: ["NONE"],
    pixelMode: "none",
    pixelId: "",
    pixelName: "",
    catalogEnabled: false,
    catalogId: "",
    conversionLocation: "WEBSITE",
    placementMode: "AUTOMATIC",
    publisherPlatforms: ["facebook", "instagram"],
    facebookPositions: ["feed", "story", "reels", "marketplace", "video_feeds", "search"],
    instagramPositions: ["stream", "story", "reels", "explore", "ig_search"],
    facebookPageId: "",
    facebookPageName: "",
    instagramAccountId: "",
    instagramAccountName: "",
    appSettings: {
      appId: "",
      appName: "",
      appPlatform: "ANDROID",
      appStoreUrl: "",
    },
  },
  audience: {
    countries: ["SA"],
    cities: [],
    ageMin: 18,
    ageMax: 65,
    gender: "ALL",
    languages: ["ar"],
    interests: [],
    behaviors: [],
    customAudienceIds: [],
    excludedAudienceIds: [],
    lookalikeAudienceIds: [],
    advantagePlusAudience: true,
    operatingSystems: ["iOS", "ANDROID"],
    excludeRecentPurchasers: false,
    excludeRecentPurchasersDays: 30,
    autoTargetingEnabled: false,
    sallaAudienceCategory: "",
  },
  budget: {
    budgetType: "daily",
    amount: 200,
    optimizationGoal: "OFFSITE_CONVERSIONS",
    conversionEvent: "PURCHASE",
    bidStrategy: "LOWEST_COST_WITHOUT_CAP",
    bidAmount: 0,
    roasTarget: 1.0,
    billingEvent: "IMPRESSIONS",
    pacing: "standard",
    startDate: "",
    endDate: "",
    endDateOptional: false,
    clickAttributionWindow: "7d_click",
    viewAttributionWindow: "1d_view",
    paymentMethod: "pay_as_you_go",
    performanceBoost: true,
    autoIncrease: {
      enabled: false,
      pct: 20,
      intervalDays: 7,
      maxDailyBudget: 600,
    },
    frequencyCap: {
      enabled: false,
      maxFrequency: 3,
      intervalDays: 7,
    },
  },
  creative: {
    ads: [],
    brandSafetyLevel: "FACEBOOK_STANDARD",
  },
};

/* ---- Helpers ---- */

/**
 * Auto-determine billing_event from optimization_goal.
 * Per Meta API: OFFSITE_CONVERSIONS, VALUE, REACH, AD_RECALL_LIFT, POST_ENGAGEMENT,
 * LEAD_GENERATION, APP_INSTALLS, APP_EVENTS, CONVERSATIONS all use IMPRESSIONS.
 * LINK_CLICKS can use LINK_CLICKS or IMPRESSIONS. We default to IMPRESSIONS.
 */
export function getBillingEventForGoal(goal: MetaOptimizationGoal): MetaBillingEvent {
  switch (goal) {
    case "LINK_CLICKS":
    case "LANDING_PAGE_VIEWS":
      return "IMPRESSIONS"; // Could also be LINK_CLICKS, but IMPRESSIONS is recommended
    case "THRUPLAY":
      return "IMPRESSIONS"; // THRUPLAY billing is through IMPRESSIONS
    default:
      return "IMPRESSIONS";
  }
}

/**
 * Auto-determine destination_type from objective + conversionLocation.
 * Maps the Salla UI conversion location to the Meta API destination_type.
 */
export function getDestinationType(objective: MetaObjective, conversionLocation: MetaConversionLocation): string {
  // Common conversion-location-to-destination mappings
  if (conversionLocation === "MESSAGING") return "MESSENGER";
  if (conversionLocation === "CALLS") return "PHONE_CALL";
  if (conversionLocation === "APP") return "APP";
  if (conversionLocation === "INSTANT_FORM") return "ON_AD";

  switch (objective) {
    case "OUTCOME_SALES":
      return "WEBSITE";
    case "OUTCOME_TRAFFIC":
      return "WEBSITE";
    case "OUTCOME_ENGAGEMENT":
      return "UNDEFINED";
    case "OUTCOME_AWARENESS":
      return "UNDEFINED";
    case "OUTCOME_APP_PROMOTION":
      return "APP";
    default:
      return "WEBSITE";
  }
}
