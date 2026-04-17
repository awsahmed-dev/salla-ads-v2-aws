/* ================================================================
   Campaign Types -- aligned to Snapchat Marketing API (Ad Squads)
   ================================================================ */

/* ---- Shared enums ---- */

/** Maps to API objective_v2_properties.objective */
export type CampaignObjective =
  | "SALES"
  | "WEBSITE_VISITS"
  | "APP_PROMOTION"
  | "ENGAGEMENT"
  | "SPONSORED_CHAT"
  | "LEADS";

/**
 * Maps to API ad_squad_ui_render_data.conversion_location.
 * Determines which optimization_goal values are valid for a given objective.
 * The combination of (objective_v2_type + conversion_location) → valid goals.
 */
export type ConversionLocation = "WEB" | "APP" | "LEAD_FORM" | "NONE";

/** Maps to API optimization_goal -- per-objective valid goals */
export type OptimizationGoal =
  | "PIXEL_PURCHASE"
  | "PIXEL_ADD_TO_CART"
  | "PIXEL_PAGE_VIEW"
  | "PIXEL_SIGNUP"
  | "SWIPES"
  | "LANDING_PAGE_VIEW"
  | "IMPRESSIONS"
  | "STORY_OPENS"
  | "VIDEO_VIEWS"
  | "VIDEO_VIEWS_15_SEC"
  | "USES"
  | "LEAD_FORM_SUBMISSIONS"
  | "APP_INSTALLS"
  | "APP_PURCHASE"        // Snap API uses singular form
  | "APP_SIGNUP"
  | "APP_ADD_TO_CART"
  | "APP_REENGAGE_OPEN";  // Snap API: re-engagement goal (open app)

/**
 * Snap API: TARGET_COST bid_strategy is only valid for these optimization_goal values.
 * Source: Ad Squads API — "Bid Strategy to Optimization Goal mapping" table.
 * NOT valid for: IMPRESSIONS, VIDEO_VIEWS, LEAD_FORM_SUBMISSIONS.
 * APP_REENGAGE_PURCHASE and APP_REENGAGE_OPEN omitted (require MMP integration).
 */
export const TARGET_COST_COMPATIBLE_GOALS: OptimizationGoal[] = [
  "APP_INSTALLS",
  "SWIPES",
  "USES",
  "VIDEO_VIEWS_15_SEC",
  "PIXEL_PURCHASE",
  "PIXEL_SIGNUP",
  "PIXEL_PAGE_VIEW",
  "PIXEL_ADD_TO_CART",
  "APP_PURCHASE",
  "APP_SIGNUP",
  "APP_ADD_TO_CART",
  "STORY_OPENS",
  "LANDING_PAGE_VIEW",
];

/* ---- Objective-to-config mapping ---- */

export interface ObjectiveConfig {
  /** Snap API objective_v2_type */
  snapObjectiveV2: string;
  /**
   * Allowed conversion locations for this objective.
   * First entry is the default. When length > 1 a selector is shown in Step 0.
   * Maps to API ad_squad_ui_render_data.conversion_location.
   */
  conversionLocations: ConversionLocation[];
  /**
   * Optimization goals keyed by conversion location.
   * The budget step filters the goal list based on the advertiser's selected location.
   */
  goalsByLocation: Partial<Record<ConversionLocation, OptimizationGoal[]>>;
  /** Human-readable label */
  label: string;
  /**
   * Union of all goals across all conversion locations.
   * Kept for backward compat — budget step uses goalsByLocation for filtering.
   */
  allowedGoals: OptimizationGoal[];
  /** Default optimization goal */
  defaultGoal: OptimizationGoal;
  /** Whether pixel is required, optional, or not needed */
  pixelRequirement: "required" | "optional" | "none";
  /** Whether catalog is available */
  catalogAvailable: boolean;
  /** Whether conversion window applies */
  hasConversionWindow: boolean;
  /** Allowed bid strategies */
  allowedBidStrategies: BidStrategy[];
  /** Allowed creative ad types (legacy, maps to SnapCreativeType | "INFLUENCER") */
  allowedAdFormats: string[];
  /** Allowed UI-level formats */
  allowedFormats: AdFormat[];
  /** Allowed UI-level destinations (for SINGLE format) */
  allowedDestinations: AdDestination[];
  /** Default CTA */
  defaultCTA: string;
}

/**
 * Returns the valid optimization goals for a specific (objective, conversionLocation) pair.
 * Falls back to the full allowedGoals list when no location-specific mapping exists.
 */
export function getGoalsForLocation(
  objective: CampaignObjective,
  location: ConversionLocation
): OptimizationGoal[] {
  const config = OBJECTIVE_CONFIGS[objective];
  return config.goalsByLocation[location] ?? config.allowedGoals;
}

export const OBJECTIVE_CONFIGS: Record<CampaignObjective, ObjectiveConfig> = {
  SALES: {
    snapObjectiveV2: "SALES",
    conversionLocations: ["WEB"],
    goalsByLocation: {
      WEB: ["PIXEL_PURCHASE", "PIXEL_ADD_TO_CART", "PIXEL_PAGE_VIEW", "LANDING_PAGE_VIEW", "SWIPES"],
    },
    label: "Sales",
    allowedGoals: ["PIXEL_PURCHASE", "PIXEL_ADD_TO_CART", "PIXEL_PAGE_VIEW", "LANDING_PAGE_VIEW", "SWIPES"],
    defaultGoal: "PIXEL_PURCHASE",
    pixelRequirement: "required",
    catalogAvailable: true,
    hasConversionWindow: true,
    allowedBidStrategies: ["AUTO_BID", "LOWEST_COST_WITH_MAX_BID", "TARGET_COST"],
    allowedAdFormats: ["WEB_VIEW", "DEEP_LINK", "COLLECTION", "COMPOSITE", "DYNAMIC", "INFLUENCER"],
    allowedFormats: ["SINGLE", "COLLECTION", "STORY", "INFLUENCER"],
    allowedDestinations: ["WEBSITE", "DEEP_LINK"],
    defaultCTA: "SHOP_NOW",
  },
  WEBSITE_VISITS: {
    snapObjectiveV2: "TRAFFIC",
    conversionLocations: ["WEB"],
    goalsByLocation: {
      WEB: ["SWIPES", "PIXEL_PAGE_VIEW", "LANDING_PAGE_VIEW"],
    },
    label: "Website Visits",
    allowedGoals: ["SWIPES", "PIXEL_PAGE_VIEW", "LANDING_PAGE_VIEW"],
    defaultGoal: "SWIPES",
    pixelRequirement: "optional",
    catalogAvailable: false,
    hasConversionWindow: false,
    allowedBidStrategies: ["AUTO_BID", "LOWEST_COST_WITH_MAX_BID", "TARGET_COST"],
    allowedAdFormats: ["WEB_VIEW", "DEEP_LINK", "COLLECTION", "COMPOSITE", "INFLUENCER"],
    allowedFormats: ["SINGLE", "COLLECTION", "STORY", "INFLUENCER"],
    allowedDestinations: ["WEBSITE", "DEEP_LINK"],
    defaultCTA: "VIEW",
  },
  ENGAGEMENT: {
    snapObjectiveV2: "AWARENESS_AND_ENGAGEMENT",
    conversionLocations: ["NONE"],
    goalsByLocation: {
      NONE: ["IMPRESSIONS", "SWIPES", "STORY_OPENS", "VIDEO_VIEWS", "VIDEO_VIEWS_15_SEC", "USES"],
    },
    label: "Interaction",
    allowedGoals: ["IMPRESSIONS", "SWIPES", "STORY_OPENS", "VIDEO_VIEWS", "VIDEO_VIEWS_15_SEC", "USES"],
    defaultGoal: "IMPRESSIONS",
    pixelRequirement: "none",
    catalogAvailable: false,
    hasConversionWindow: false,
    allowedBidStrategies: ["AUTO_BID", "LOWEST_COST_WITH_MAX_BID", "TARGET_COST"],
    allowedAdFormats: ["WEB_VIEW", "SNAP_AD", "COLLECTION", "COMPOSITE", "INFLUENCER"],
    allowedFormats: ["SINGLE", "COLLECTION", "STORY", "INFLUENCER"],
    allowedDestinations: ["WEBSITE", "NO_CTA"],
    defaultCTA: "VIEW",
  },
  SPONSORED_CHAT: {
    snapObjectiveV2: "AWARENESS_AND_ENGAGEMENT",
    conversionLocations: ["NONE"],
    goalsByLocation: {
      NONE: ["IMPRESSIONS", "SWIPES"],
    },
    label: "Sponsored Ads",
    allowedGoals: ["IMPRESSIONS", "SWIPES"],
    defaultGoal: "IMPRESSIONS",
    pixelRequirement: "none",
    catalogAvailable: false,
    hasConversionWindow: false,
    allowedBidStrategies: ["AUTO_BID", "LOWEST_COST_WITH_MAX_BID", "TARGET_COST"],
    allowedAdFormats: ["WEB_VIEW", "APP_INSTALL", "COMPOSITE", "INFLUENCER"],
    allowedFormats: ["SINGLE", "STORY", "INFLUENCER"],
    allowedDestinations: ["WEBSITE", "APP_INSTALL"],
    defaultCTA: "VIEW",
  },
  APP_PROMOTION: {
    snapObjectiveV2: "APP_PROMOTION",
    conversionLocations: ["APP"],
    goalsByLocation: {
      // IMPRESSIONS and SWIPES do not require MMP. APP_PURCHASE/SIGNUP/ADD_TO_CART require MMP.
      // APP_LEVEL_COMPLETE, APP_ACHIEVEMENT_UNLOCKED, APP_AD_VIEW omitted (require MMP).
      APP: ["APP_INSTALLS", "IMPRESSIONS", "APP_PURCHASE", "APP_SIGNUP", "APP_ADD_TO_CART", "SWIPES"],
    },
    label: "App Promotion",
    allowedGoals: ["APP_INSTALLS", "IMPRESSIONS", "APP_PURCHASE", "APP_SIGNUP", "APP_ADD_TO_CART", "SWIPES"],
    defaultGoal: "APP_INSTALLS",
    pixelRequirement: "none",
    catalogAvailable: false,
    hasConversionWindow: true,
    allowedBidStrategies: ["AUTO_BID", "LOWEST_COST_WITH_MAX_BID", "TARGET_COST"],
    allowedAdFormats: ["APP_INSTALL", "DEEP_LINK", "COLLECTION", "COMPOSITE", "INFLUENCER"],
    allowedFormats: ["SINGLE", "COLLECTION", "STORY", "INFLUENCER"],
    allowedDestinations: ["APP_INSTALL", "DEEP_LINK"],
    defaultCTA: "INSTALL_NOW",
  },
  LEADS: {
    snapObjectiveV2: "LEADS",
    /**
     * LEADS supports two conversion locations:
     *  - LEAD_FORM: Snapchat native lead form (goals: LEAD_FORM_SUBMISSIONS, SWIPES)
     *  - WEB: Website with pixel tracking (goals: SWIPES, LANDING_PAGE_VIEW)
     * A selector is shown in Step 0 when this objective is selected.
     */
    conversionLocations: ["LEAD_FORM", "WEB"],
    goalsByLocation: {
      LEAD_FORM: ["LEAD_FORM_SUBMISSIONS", "SWIPES"],
      WEB: ["SWIPES", "LANDING_PAGE_VIEW"],
    },
    label: "Lead Generation",
    allowedGoals: ["LEAD_FORM_SUBMISSIONS", "SWIPES", "LANDING_PAGE_VIEW"],
    defaultGoal: "LEAD_FORM_SUBMISSIONS",
    pixelRequirement: "optional",
    catalogAvailable: false,
    hasConversionWindow: false,
    /**
     * TARGET_COST is in the list but filtered at runtime by goal compatibility:
     * LEAD_FORM_SUBMISSIONS does NOT support TARGET_COST (API will reject).
     * SWIPES and LANDING_PAGE_VIEW DO support TARGET_COST.
     * See TARGET_COST_COMPATIBLE_GOALS and step-budget.tsx filtering logic.
     */
    allowedBidStrategies: ["AUTO_BID", "LOWEST_COST_WITH_MAX_BID", "TARGET_COST"],
    allowedAdFormats: ["LEAD_GENERATION", "WEB_VIEW"],
    allowedFormats: ["SINGLE"],
    allowedDestinations: ["LEAD_FORM", "WEBSITE"],
    defaultCTA: "SIGN_UP",
  },
};

/**
 * Maps to API conversion_window.
 * Snap API supports exactly 2 values for both SALES and APP_PROMOTION objectives.
 * SWIPE_1DAY and SWIPE_7DAY_VIEW_1DAY are NOT valid Snap API values and have been removed.
 */
export type ConversionWindow =
  | "SWIPE_28DAY_VIEW_1DAY"  // 28-day click + 1-day view (default, always available)
  | "SWIPE_7DAY";            // 7-day click only (requires pixel eligibility check)

/**
 * Snap API: Smart Targeting (auto_expansion_type = SMART_TARGETING) is NOT available
 * for these optimization goals. The API will reject ad squads with smart targeting
 * enabled when using these goals.
 */
export const SMART_TARGETING_INCOMPATIBLE_GOALS: OptimizationGoal[] = [
  "IMPRESSIONS",
  "STORY_OPENS",
  "SWIPES",
  "USES",
  "VIDEO_VIEWS",
  "VIDEO_VIEWS_15_SEC",
];

/**
 * Maps to API billing_event.
 * Snap API only supports IMPRESSION — this is the only valid value.
 * Required on every Ad Squad payload.
 */
export type BillingEvent = "IMPRESSION";

/** The only valid billing event per Snap API */
export const BILLING_EVENT: BillingEvent = "IMPRESSION";

/** Maps to API bid_strategy */
export type BidStrategy =
  | "AUTO_BID"
  | "TARGET_COST"
  | "LOWEST_COST_WITH_MAX_BID";

/** Maps to API pacing_type */
export type PacingType = "STANDARD" | "ACCELERATED";

/** Maps to API placement_v2.config */
export type PlacementConfig = "AUTOMATIC" | "CUSTOM";

/** Budget type: how the budget is consumed over the campaign lifetime */
export type PaymentMethod = "prepaid" | "pay_as_you_go";

/* ---- Step: Objective ---- */

/** Pixel connection mode: use an existing Snap Pixel or let Salla create one */
export type PixelMode = "existing" | "salla_managed" | "none";

export interface ObjectiveSettings {
  campaignName: string;
  objective: CampaignObjective;
  /**
   * Selected conversion location for this objective.
   * Determines which optimization goals are available in the budget step.
   * Set automatically to the first entry of OBJECTIVE_CONFIGS[objective].conversionLocations.
   * When the objective supports multiple locations, a selector is shown in Step 0.
   */
  conversionLocation: ConversionLocation;
  catalogEnabled: boolean;
  catalogSource: string;
  /** Snap API: ad_squad.pixel_id -- required for PIXEL_* optimization goals */
  pixelMode: PixelMode;
  /** The selected pixel ID (either existing or Salla-created) */
  pixelId: string;
  /** Display name for selected pixel */
  pixelName: string;
  /** App settings for APP_PROMOTION objective */
  appSettings?: AppSettings;
}

/* ---- Step: Audience ---- */

export interface LocationCircle {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

export interface SallaAudienceSegment {
  id: string;
  name: string;
  category: string;
  size: number;
}

export interface AudienceSettings {
  countries: string[];
  cities: LocationCircle[];
  /** Region/state IDs for narrowing within selected countries (Snap API region_id). */
  regions: string[];
  genders: string[];
  ageMin: number;
  ageMax: number;
  languages: string[];
  deviceOS: string[];
  /** SLC IDs to include (OR logic — ad shown to anyone matching any). */
  interests: string[];
  /** SLC IDs to exclude. */
  interestsExclude: string[];
  customAudiencesInclude: string[];
  customAudiencesExclude: string[];
  regulatedContent: boolean;
  interestExpansion: boolean;
  customAudienceExpansion: boolean;
  /** SMART_TARGETING — expands across genders and beyond max age. Requires both expansion options enabled. */
  smartTargeting: boolean;
  excludeRecentPurchasers: boolean;
  excludeRecentPurchasersDays: number;
  sallaAudienceEnabled: boolean;
  sallaAudienceCategory: string;
}

/* ---- Step: Budget ---- */

export interface BudgetSettings {
  /** Maps to API daily_budget_micro or lifetime_budget_micro */
  type: "daily" | "lifetime";
  amount: number;
  /** Maps to API optimization_goal */
  optimizationGoal: OptimizationGoal;
  /** Maps to API conversion_window */
  conversionWindow: ConversionWindow;
  /** Maps to API bid_strategy */
  bidStrategy: BidStrategy;
  /** Maps to API bid_micro (SAR, converted to micro on send) */
  bidAmount: number;
  /** Maps to API pacing_type */
  pacingType: PacingType;
  /** Schedule dates */
  startDate: string;
  endDate: string;
  /** When true, end date is not required (pay-as-you-go continuous running) */
  endDateOptional: boolean;
  /** All day vs custom hours */
  schedule: "all_day" | "custom";
  /**
   * Snap API: ad_squad.cap_and_exclusion_config.frequency_cap_config
   * Controls how many times a single user sees the ad within a time window.
   * Note: frequency cap + multi-format delivery in the same ad squad is not supported.
   */
  frequencyCapEnabled: boolean;
  /** Max impressions per user within the interval (Snap default: 4). frequency_cap_type is always IMPRESSIONS for SALES objective. */
  frequencyCapCount: number;
  /** Time window in hours. API field: time_interval + frequency_cap_interval (HOURS|DAYS). Max 720 hours (30 days). */
  frequencyCapInterval: number;
  /** Salla billing method */
  paymentMethod: PaymentMethod;
  /** Salla performance boost upsell */
  performanceBoost: boolean;
  /** Salla auto-increase: gradually scale daily budget over the campaign lifetime */
  autoIncrease: {
    enabled: boolean;
    /** Percentage to increase by at each interval (5-100) */
    pct: number;
    /** Interval in days between increases (3, 5, 7, 14) */
    intervalDays: number;
    /** Maximum daily budget cap (SAR). Auto-increase stops at this amount. */
    maxDailyBudget: number;
  };
}

/* ---- Step: Creative (Ad Design) ---- */

/**
 * Maps to Snapchat API creative types valid for SALES objective:
 *  - WEB_VIEW (single image/video with swipe-up URL)
 *  - COLLECTION (top snap + 4+ product tiles via interaction_zone)
 *  - COMPOSITE (story ad: 1-20 snap ads in sequence)
 *  - Dynamic (COLLECTION with dynamic_render_properties and catalog)
 */
export type SnapCreativeType =
  | "WEB_VIEW"
  | "COLLECTION"
  | "COMPOSITE"
  | "DYNAMIC"
  | "LEAD_GENERATION"
  | "APP_INSTALL"
  | "SNAP_AD"
  | "DEEP_LINK";

/** UI-level ad format (what the ad looks like) */
export type AdFormat = "SINGLE" | "COLLECTION" | "STORY" | "DYNAMIC" | "INFLUENCER";

/** UI-level destination (where swipe-up goes) */
export type AdDestination = "WEBSITE" | "DEEP_LINK" | "APP_INSTALL" | "NO_CTA" | "LEAD_FORM";

/**
 * Snap API: COLLECTION creatives set call_to_action = null at the creative level,
 * but the CTA value is sent as the interaction zone `headline` field instead.
 * The UI still shows a CTA dropdown — the payload builder must map asset.cta
 * to interaction_zone.headline for COLLECTION, and to creative.call_to_action
 * for all other formats.
 */
export function shouldMapCTAToInteractionZone(format: AdFormat): boolean {
  return format === "COLLECTION";
}

/** Derive Snap API creative type from UI format + destination */
export function deriveCreativeType(format: AdFormat, destination: AdDestination): SnapCreativeType {
  switch (format) {
    case "COLLECTION": return "COLLECTION";
    case "STORY": return "COMPOSITE";
    case "DYNAMIC": return "DYNAMIC";
    case "INFLUENCER": return "WEB_VIEW";
    case "SINGLE":
      switch (destination) {
        case "WEBSITE": return "WEB_VIEW";
        case "DEEP_LINK": return "DEEP_LINK";
        case "APP_INSTALL": return "APP_INSTALL";
        case "NO_CTA": return "SNAP_AD";
        case "LEAD_FORM": return "LEAD_GENERATION";
      }
  }
}

/** Snap API media type */
export type SnapMediaType = "IMAGE" | "VIDEO";

/**
 * Call-to-action values valid for WEB_VIEW (Sales/web conversion).
 * Sourced from Snap API creative-type-to-CTA mapping table.
 */
export type WebViewCTA =
  | "SHOP_NOW"
  | "ORDER_NOW"
  | "BUY_TICKETS"
  | "GET_NOW"
  | "BOOK_NOW"
  | "MORE"
  | "VIEW"
  | "SIGN_UP"
  | "APPLY_NOW"
  | "DOWNLOAD"
  | "WATCH"
  | "LISTEN"
  | "READ"
  | "PLAY"
  | "TRY"
  | "DONATE"
  | "RESPOND"
  | "SHOWTIMES"
  | "VIEW_MENU"
  | "SHOW"
  | "VOTE"
  | "PRE_REGISTER"
  | "PLAY_GAME";

/**
 * Call-to-action values valid for LEAD_GENERATION creatives.
 * Sourced from Snap API creative-type-to-CTA mapping table for LEAD_GENERATION.
 */
export type LeadGenCTA =
  | "APPLY_NOW"
  | "MORE"
  | "BOOK_NOW"
  | "GET_NOW"
  | "SIGN_UP"
  | "TEST_DRIVE"
  | "REQUEST_APPOINTMENT"
  | "REQUEST_QUOTE"
  | "FREE_TRIAL"
  | "CLAIM_SAMPLE"
  | "GET_COUPON";

/**
 * Call-to-action values valid for APP_INSTALL creatives.
 * Snap API creative-type-to-CTA mapping for APP_INSTALL.
 * Note: MORE is NOT valid for APP_INSTALL per the Snap API.
 */
export type AppInstallCTA =
  | "INSTALL_NOW"
  | "DOWNLOAD"
  | "GET_NOW"
  | "TRY"
  | "PLAY"
  | "USE_APP"
  | "ORDER_NOW"
  | "SHOP_NOW"
  | "BOOK_NOW"
  | "DONATE"
  | "SIGN_UP"
  | "WATCH"
  | "VOTE"
  | "DIRECTIONS"
  | "PLAY_GAME";

/**
 * Call-to-action values valid for DEEP_LINK creatives.
 * Sourced from Snap API creative-type-to-CTA mapping for DEEP_LINK.
 */
export type DeepLinkCTA =
  | "DONATE"
  | "PLAY"
  | "SHOP_NOW"
  | "SIGN_UP"
  | "USE_APP"
  | "MORE"
  | "OPEN_APP"
  | "TRY"
  | "WATCH"
  | "VIEW_PROFILE"
  | "VOTE"
  | "DIRECTIONS"
  | "PRE_REGISTER"
  | "PLAY_GAME"
  | "DOWNLOAD";

/** App platform for APP_PROMOTION objective */
export type AppPlatform = "IOS" | "ANDROID" | "BOTH";

/**
 * App configuration for APP_PROMOTION objective.
 * Maps to ad_squad.app_install_properties (Snap API).
 */
export interface AppSettings {
  /** iOS App Store ID (numeric, e.g. "447188370") */
  iosAppId: string;
  /** Android package name (e.g. "com.example.app") */
  androidAppUrl: string;
  /** Which platform(s) to target */
  appPlatform: AppPlatform;
  /** App name for display purposes */
  appName: string;
  /** Optional icon URL for preview */
  appIconUrl: string;
  /**
   * Deep link URI for app re-engagement (not used for APP_INSTALL).
   * Maps to deep_link_properties.deep_link_uri
   */
  deepLinkUri: string;
  /**
   * Fallback URL if app is not installed.
   * Maps to deep_link_properties.fallback_type = WEB_VIEW_FALLBACK
   */
  fallbackUrl: string;
}

/**
 * Snap API: deep_link_properties on Creative.
 * Used with DEEP_LINK creative type to open an app or fallback to web.
 */
export interface DeepLinkProperties {
  /** Deep link URI scheme (e.g. "myapp://product/123") */
  deepLinkUri: string;
  /** Snap API: app_name — required, max 30 chars */
  appName: string;
  /** Snap API: icon_media_id — required, the uploaded app icon media ID */
  iconMediaId: string;
  /** Which platforms to target: determines which of ios_app_id / android_app_url are required */
  appPlatform: "BOTH" | "IOS" | "ANDROID";
  /** iOS App ID for Universal Links fallback */
  iosAppId?: string;
  /** Android package name for App Links fallback */
  androidAppUrl?: string;
  /** Fallback URL when app is not installed */
  fallbackUrl: string;
  /** Snap API: fallback_type -- WEB_VIEW_FALLBACK or APP_STORE_FALLBACK */
  fallbackType: "WEB_VIEW_FALLBACK" | "APP_STORE_FALLBACK";
}

/**
 * Snap API: web_view_properties on Creative (advanced options).
 * Controls in-app browser behavior for WEB_VIEW creatives.
 */
export interface WebViewProperties {
  /** Target URL for the swipe-up action */
  url: string;
  /** Open in Snapchat's in-app browser vs external browser */
  useSnapBrowser: boolean;
  /** Preload the web page for faster load times */
  preloadEnabled: boolean;
  /** Deep link URL to open app if installed (optional) */
  deepLinkUrl?: string;
  /**
   * Snap API: block_preload -- blocks preloading of the landing page.
   * Use for pages that track impressions (prevents inflated metrics).
   */
  blockPreload: boolean;
}

/* ---- Lead Generation Form Types (Snap API: lead_generation_form) ---- */

/** Standard form field types from Snap API */
export type LeadFormFieldType =
  | "FIRST_NAME"
  | "LAST_NAME"
  | "EMAIL"
  | "PHONE_NUMBER"
  | "ADDRESS"
  | "POSTAL_CODE"
  | "BIRTHDAY_DATE"
  | "JOB_TITLE"
  | "COMPANY_NAME"
  | "CUSTOM";

/** Custom form field question types */
export type CustomFieldType =
  | "TEXT"
  | "DATE"
  | "MULTIPLE_CHOICE_SINGLE_SELECTION"
  | "MULTIPLE_CHOICE_MULTI_SELECTION";

export interface MultipleChoiceOption {
  choice_description: string;
  option_preferred_status?: "PREFERRED" | "NOT_PREFERRED";
}

export interface CustomFormFieldProperties {
  type: CustomFieldType;
  description: string;
  multiple_choice_options?: MultipleChoiceOption[];
}

export interface LeadFormField {
  id: string;
  type: LeadFormFieldType;
  custom_form_field_properties?: CustomFormFieldProperties;
}

export interface LeadFormConsentField {
  consent_description: string;
  required: boolean;
}

export interface LeadFormLegalDisclosure {
  title: string;
  description: string;
  consent_form_fields: LeadFormConsentField[];
}

/** CTA options for the end page shown after form submission */
export type LeadFormEndPageCTA =
  | "VIEW_WEBSITE"
  | "BOOK_NOW"
  | "LEARN_MORE"
  | "DONATE"
  | "SPECIAL_OFFER"
  | "SCHEDULE_NOW"
  | "BUY_TICKETS"
  | "TEST_DRIVE"
  | "APPLY_NOW"
  | "GET_COUPON"
  | "CLAIM_SAMPLE"
  | "FREE_TRIAL";

export interface LeadFormEndPageProperties {
  call_to_action: LeadFormEndPageCTA;
  url: string;
}

/**
 * Full lead generation form entity -- maps to Snap API lead_generation_form.
 * Requirements:
 *   - FIRST_NAME and LAST_NAME must be included
 *   - At least one of EMAIL or PHONE_NUMBER must be included
 *   - ADDRESS and POSTAL_CODE cannot both be included
 *   - Form title max 25 chars, description max 180 chars
 */
export interface LeadGenerationForm {
  /** Form name (internal label) */
  name: string;
  /** Displayed title on the form (max 25 chars) */
  title: string;
  /** Displayed description on the form (max 180 chars) */
  description: string;
  /** Form fields */
  form_fields: LeadFormField[];
  /** Privacy policy URL */
  privacy_policy_url: string;
  /** Optional legal disclosures — Snap API expects an array.
   *  Each disclosure: title (max 35 chars), description (max 80 chars), up to 2 consent fields. */
  legal_disclosures?: LeadFormLegalDisclosure[];
  /** Optional banner image media ID (750x230 min, 1875x575 max, 75:23 ratio) */
  banner_media_id?: string;
  /** Local preview for banner */
  bannerPreviewUrl?: string;
  /** Optional end page shown after submission */
  end_page_properties?: LeadFormEndPageProperties;
}

export function makeDefaultAppSettings(): AppSettings {
  return {
    iosAppId: "",
    androidAppUrl: "",
    appPlatform: "BOTH",
    appName: "",
    appIconUrl: "",
    deepLinkUri: "",
    fallbackUrl: "",
  };
}

export function makeDefaultLeadForm(): LeadGenerationForm {
  return {
    name: "",
    title: "",
    description: "",
    form_fields: [
      { id: `lf_${Date.now()}_1`, type: "FIRST_NAME" },
      { id: `lf_${Date.now()}_2`, type: "LAST_NAME" },
      { id: `lf_${Date.now()}_3`, type: "EMAIL" },
    ],
    privacy_policy_url: "",
  };
}

/**
 * Top Snap crop position -- Snap API top_snap_crop_position.
 * OPTIMIZED lets Snap auto-crop for each placement.
 */
export type CropPosition = "OPTIMIZED" | "MIDDLE" | "TOP" | "BOTTOM";

/**
 * Snap API: creator_partnership_type.
 * Controls the paid partnership label on the ad.
 */
export type CreatorPartnershipType = "NONE" | "AD_PARTNERSHIP" | "BRAND_PARTNERSHIP";

/**
 * A single creative asset (maps to one Snap Creative entity).
 * Supports image (1080x1920, PNG/JPG, <=5MB) and video (1080x1920, mp4/mov, 3-180s, <=100MB).
 */
/**
 * Media source: upload local file, or claim influencer content via Ad Code.
 * claim_media_by_ad_code returns a media_entity_id used as top_snap_media_id.
 */
export type MediaSource = "upload" | "ad_code";

export interface CreativeAsset {
  id: string;
  /** Snap API: name -- auto-generated internal label (max 375 chars). Not shown to users. */
  name: string;
  /** Where the media comes from */
  mediaSource: MediaSource;
  /** Media type: IMAGE or VIDEO */
  mediaType: SnapMediaType;
  /** Local preview URL (blob or uploaded) */
  url: string;
  /** File reference for upload */
  file?: File;
  /** Duration in seconds (populated from video metadata on upload) */
  videoDuration?: number;
  /** Snap API claim_media: ad_code shared by influencer */
  adCode?: string;
  /** Snap API claim_media: media_entity_id once claimed */
  claimedMediaId?: string;
  /** Snap API claim_media: status (PENDING_UPLOAD | READY) */
  claimStatus?: "PENDING" | "READY" | "ERROR";
  /** Snap API: creator_profile_properties.profile_id -- show creator's profile on ad */
  creatorProfileId?: string;
  /** Snap API: creator_partnership_type -- paid partnership label */
  creatorPartnershipType?: CreatorPartnershipType;
  /** Snap API: profile_tagged_in_headline -- brand's profile ID tagged in the headline */
  profileTaggedInHeadline?: string;
  /**
   * Snap API: brand_name -- max 32 chars.
   * Optional when profile_properties.profile_id is set (Public Profile name is used instead).
   */
  brandName: string;
  /** Snap API: headline -- max 34 chars */
  headline: string;
  /** Snap API: call_to_action */
  cta: WebViewCTA;
  /** Snap API: top_snap_crop_position */
  cropPosition: CropPosition;
  /** Snap API: web_view_properties.url */
  websiteUrl: string;
  /** Snap API: shareable */
  shareable: boolean;
  /** Snap API: deep_link_properties -- for DEEP_LINK creative type */
  deepLinkProperties?: DeepLinkProperties;
  /** Snap API: web_view_properties (advanced) -- for WEB_VIEW creative type */
  webViewProperties?: WebViewProperties;
  /** Snap API: cta_color_display_mode -- Auto or Default CTA button color */
  ctaColorDisplayMode?: "AUTO" | "DEFAULT";
  /** Snap API: third_party_impression_urls -- third-party tracking */
  thirdPartyImpressionUrls?: string[];
  /** Snap API: third_party_swipe_urls -- third-party swipe tracking */
  thirdPartySwipeUrls?: string[];
}

/**
 * Collection Ad tile (maps to a Creative Element BUTTON in an Interaction Zone).
 * Per Snap API: each tile is a Creative Element with a media_id.
 * The tile's tap action uses the collection-level web_view_properties.url (from the Top Snap),
 * NOT a per-tile URL. Title is optional.
 * Min 2 tiles, max 4 tiles.
 */
export interface CollectionTile {
  id: string;
  /** Tile image (160x160 min, square, PNG/JPG, max 2MB). Uploaded as a Media entity. */
  imageUrl: string;
  file?: File;
  /** Optional product title shown below the tile */
  title: string;
  /** Product URL (swipe-up destination for this tile) */
  url?: string;
}

/**
 * Snap API: Offer Disclaimer (STATIC type for non-DPA ads).
 * Shown as "See Offer Details" pill on the ad.
 * Compatible with WEB_VIEW, COMPOSITE, and COLLECTION for Sales.
 * Max 5,000 chars for disclaimer_text.
 */
export interface OfferDisclaimer {
  enabled: boolean;
  /** Snap API: name -- internal label for the disclaimer */
  name: string;
  /** Snap API: disclaimer_text -- displayed to the user (max 5,000 chars) */
  disclaimerText: string;
}

/**
 * Snap API: dynamic_render_properties for Dynamic Product Ads (DPA).
 * Controls how catalog products are rendered in the ad template.
 */
export interface DynamicTemplateConfig {
  /**
   * Snap API: product_set_id -- a subset of the catalog.
   * Product sets are defined in Snap Ads Manager or via Product Feed.
   */
  productSetId: string;
  productSetName: string;
  /** Whether to show product price on the template */
  showPrice: boolean;
  /** Whether to show sale/discount badge */
  showSaleBadge: boolean;
  /** Caption text overlay mode */
  captionMode: "product_name" | "product_name_price" | "product_description";
}

export function makeDefaultDynamicTemplate(): DynamicTemplateConfig {
  return {
    productSetId: "",
    productSetName: "",
    showPrice: true,
    showSaleBadge: true,
    captionMode: "product_name_price",
  };
}

/**
 * Snap API: forced_view_eligibility on Creative.
 * Controls non-skippable behavior for Commercials.
 *  - FULL_DURATION: entire video is non-skippable (video must be 3-6 seconds)
 *  - SIX_SECONDS: first 6 seconds non-skippable, rest skippable (video must be 7+ seconds)
 */
export type ForcedViewEligibility = "FULL_DURATION" | "SIX_SECONDS";

/**
 * Snap API: premium_content_bundle_ids on AdSquad.
 * Target specific Snap Discover premium content bundles.
 */
export const PREMIUM_CONTENT_BUNDLES = {
  LIFESTYLE_SPORTS: { id: "c7e251af-3606-4f03-91f1-98456161655d", label: "Lifestyle & Sports Shows" },
  ALL_SHOWS: { id: "1856c724-7cec-4139-a8a8-b87fc609f13e", label: "All Shows (including News)" },
} as const;

/**
 * Commercial configuration per ad.
 * Commercials are non-skippable video ads shown in Snap's premium content (Discover Shows).
 * Only eligible for WEB_VIEW / SNAP_AD formats with VIDEO media (3s+).
 */
export interface CommercialConfig {
  enabled: boolean;
  /**
   * Snap API: forced_view_eligibility.
   * FULL_DURATION for 3-6s videos, SIX_SECONDS for 7s+ videos.
   */
  forcedViewEligibility: ForcedViewEligibility;
  /**
   * Snap API: forced_view_setting on AdSquad.
   * Must match the Creative's forced_view_eligibility.
   */
  premiumContentBundle: "LIFESTYLE_SPORTS" | "ALL_SHOWS";
}

/**
 * Discover Tile / Preview Creative for Story Ads.
 * Maps to Snap API Creative type: PREVIEW.
 * This is the thumbnail shown in the Discover Feed / Stories Tab.
 * Required for Story Ads (COMPOSITE) to run in the Discover placement.
 */
export interface DiscoverTile {
  /** Whether the Discover Tile is enabled for this Story Ad */
  enabled: boolean;
  /** Preview headline shown on the tile in the Discover Feed (max 55 chars) */
  headline: string;
  /** Background image for the tile. Spec: 360x600 px min, 3:5 ratio, PNG only, max 2MB */
  backgroundImageUrl: string;
  backgroundImageFile?: File;
  /** Optional brand logo on the tile. Spec: 993x284 px, PNG only, max 2MB */
  logoImageUrl: string;
  logoImageFile?: File;
  /**
   * Tile media source for catalog Story Ads.
   * "DYNAMIC" — tile background auto-generated from catalog product images (no upload needed).
   * "STATIC"  — merchant uploads a custom background image (default for non-catalog).
   * Maps to Snap API PREVIEW creative `render_type`.
   */
  renderType?: "DYNAMIC" | "STATIC";
}

/**
 * A single Ad within the campaign.
 * Maps to one Snap Ad entity with its own Creative.
 * Advertisers can create multiple ads of different formats.
 */
export interface AdGroup {
  id: string;
  name: string;
  /** Snap creative type for this ad (derived from adFormat + adDestination) */
  adType: SnapCreativeType;
  /** UI-level format: what the ad looks like */
  adFormat: AdFormat;
  /** UI-level destination: where the swipe-up goes */
  adDestination: AdDestination;
  /** Main creative assets */
  assets: CreativeAsset[];
  /** Collection tiles (only for COLLECTION type, min 2) */
  collectionTiles: CollectionTile[];
  /** Optional offer disclaimer per ad */
  offerDisclaimer: OfferDisclaimer;
  /**
   * Dynamic Product Ads config (only for DYNAMIC type, or COLLECTION with dynamicCollectionEnabled).
   * Maps to Snap API dynamic_render_properties.
   */
  dynamicTemplateConfig?: DynamicTemplateConfig;
  /** When true, COLLECTION tiles are auto-populated from catalog product set */
  dynamicCollectionEnabled?: boolean;
  /**
   * Snap API: render_type on Creative.
   * "DYNAMIC" = hero + tiles fully auto-generated from catalog (no upload needed).
   * "STATIC"  = merchant uploads hero media (top_snap_media_id), tiles still from catalog.
   * Only relevant when catalogEnabled + COLLECTION or STORY format.
   */
  catalogRenderType?: "DYNAMIC" | "STATIC";
  /**
   * Commercial config -- non-skippable video ads in premium content.
   * Only for WEB_VIEW with VIDEO media. Maps to Snap API forced_view_eligibility + forced_view_setting.
   */
  commercialConfig?: CommercialConfig;
  /**
   * Discover Tile / Preview Creative -- only for COMPOSITE (Story Ads).
   * Enables the ad to appear in the Discover Feed / Stories Tab.
   * Maps to Snap API Creative type: PREVIEW with preview_creative_id on the COMPOSITE.
   */
  discoverTile?: DiscoverTile;
  /** True when this ad uses influencer content (ad code claiming) */
  isInfluencer?: boolean;
  /** Third-party tracking URLs */
  trackingUrls?: { impressionUrl: string; swipeUpUrl: string };
}

export interface CreativeSettings {
  /**
   * Snap API: profile_properties.profile_id (required on every creative).
   * Campaign-level: one brand profile for all ads in this campaign.
   */
  publicProfileId: string;
  /** All ads in this campaign -- each can have a different format */
  ads: AdGroup[];
  /** Snap API: placement_v2.config (shared across all ads) */
  placement: PlacementConfig;
  /** Snap API: brand_content_safety (shared across all ads) */
  brandSafety: "FULL_INVENTORY" | "LIMITED_INVENTORY";
  /** Snap API: snapchat_positions (only when placement === CUSTOM) */
  customPositions: string[];
  /** Campaign-level product set for catalog-powered ads (DYNAMIC / dynamic COLLECTION) */
  catalogProductSetId: string;
  catalogProductSetName: string;
  /** Sponsored Ads (Chat Feed) specific settings -- maps to Snap API `chat_properties` */
  sponsoredAdConfig: {
    /** chat_properties.additional_messages[0].text -- initial message shown in chat pane (max 500) */
    chatMessage: string;
    /** chat_properties.default_responses[0].text -- auto-reply when user sends a message (max 500) */
    autoResponseMessage: string;
    /**
     * Maps to Snap API: response_interaction_setting.
     * NO_USER_INPUT = user cannot reply (auto-response disabled).
     * SEND_DEFAULT_UNLIMITED = auto-reply is sent every time user messages.
     */
    responseInteractionSetting: "NO_USER_INPUT" | "SEND_DEFAULT_UNLIMITED";
    /** chat_properties.wallpaper_media_id -- branded chat background image 1080x1920 */
    wallpaperUrl: string;
  };
  /** Lead Generation form -- maps to Snap API lead_generation_form entity */
  leadForm?: LeadGenerationForm;
}

/* ---- Full Campaign ---- */

export interface CampaignData {
  objective: ObjectiveSettings;
  audience: AudienceSettings;
  budget: BudgetSettings;
  creative: CreativeSettings;
}

export const defaultCampaign: CampaignData = {
  objective: {
    campaignName: "",
    objective: "SALES",
    conversionLocation: "WEB",
    catalogEnabled: false,
    catalogSource: "",
    pixelMode: "none",
    pixelId: "",
    pixelName: "",
  },
  audience: {
    countries: ["SA"],
    cities: [],
    regions: [],
    genders: ["MALE", "FEMALE"],
    ageMin: 18,
    ageMax: 45,
    languages: ["ar"],
    deviceOS: ["iOS", "ANDROID"],
    interests: [],
    interestsExclude: [],
    customAudiencesInclude: [],
    customAudiencesExclude: [],
    regulatedContent: false,
    interestExpansion: true,
    customAudienceExpansion: true,
    smartTargeting: false,
    excludeRecentPurchasers: false,
    excludeRecentPurchasersDays: 30,
    sallaAudienceEnabled: false,
    sallaAudienceCategory: "",
  },
  budget: {
    type: "daily",
    amount: 400,
    optimizationGoal: "PIXEL_PURCHASE" as OptimizationGoal,
    conversionWindow: "SWIPE_28DAY_VIEW_1DAY",
    bidStrategy: "AUTO_BID",
    bidAmount: 0,
    pacingType: "STANDARD",
    startDate: "",
    endDate: "",
    endDateOptional: false,
    schedule: "all_day",
    frequencyCapEnabled: false,
    frequencyCapCount: 4,
    frequencyCapInterval: 48,
    paymentMethod: "prepaid",
    performanceBoost: true,
    autoIncrease: {
      enabled: false,
      pct: 20,
      intervalDays: 7,
      maxDailyBudget: 1200,
    },
  },
  creative: {
    publicProfileId: "",
    ads: [],
    placement: "AUTOMATIC",
    brandSafety: "FULL_INVENTORY",
    customPositions: ["INTERSTITIAL_USER", "INTERSTITIAL_CONTENT", "INTERSTITIAL_SPOTLIGHT", "FEED", "INSTREAM", "PUBLIC_STORIES_INSTREAM", "CAMERA", "CHAT_FEED", "POST_CAPTURE_CAROUSEL"],
    catalogProductSetId: "",
    catalogProductSetName: "",
    sponsoredAdConfig: {
      chatMessage: "",
      autoResponseMessage: "",
      responseInteractionSetting: "NO_USER_INPUT",
      wallpaperUrl: "",
    },
  },
};
