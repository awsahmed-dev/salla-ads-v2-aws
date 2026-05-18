/* ================================================================
   Campaign Types -- aligned to TikTok Marketing API v1.3
   All 6 objectives fully supported with complete API field coverage.
   ================================================================ */

/* ---- Enums ---- */

/** Maps to API objective_type. */
export type TikTokObjective =
  | "PRODUCT_SALES"
  | "REACH"
  | "TRAFFIC"
  | "VIDEO_VIEWS"
  | "LEAD_GENERATION"
  | "APP_PROMOTION";

/** Promotion type within PRODUCT_SALES */
export type PromotionType = "WEBSITE" | "CATALOG";

/** Maps to API optimization_goal */
export type OptimizationGoal =
  | "CONVERSION"
  | "VALUE"
  | "CLICK"
  | "REACH"              // Reach objective: maximize unique users reached.
                         // (Phase 3: SHOW was removed — TikTok has no such goal; impression
                         //  capping is controlled via frequency + frequency_schedule.)
  | "LANDING_PAGE_VIEW"  // Traffic objective: higher-quality clicks that load the landing page
  | "VIDEO_VIEW"         // Video Views objective: maximize 2-second video views
  | "FOCUSED_VIEW"       // Video Views objective: maximize 6-second focused views (higher intent)
  | "LEAD_GENERATION"    // Lead Gen objective: maximize in-app instant form submissions
  | "INSTALL"            // App Promotion: maximize app installations
  | "IN_APP_EVENT";      // App Promotion: optimize for specific in-app events (AEO)

/** Optimization event for conversion tracking. Maps to API optimization_event.
 *  Only events supported by the Sales (PRODUCT_SALES) objective are listed. */
export type OptimizationEvent =
  | "COMPLETE_PAYMENT"   // Purchase -- bottom of funnel
  | "INITIATE_CHECKOUT"  // Checkout started
  | "ADD_TO_CART"        // Cart additions
  | "VIEW_CONTENT"       // Product page views
  | "ADD_BILLING";       // Payment info added

/** Maps to API bid_type */
export type BidType =
  | "BID_TYPE_NO_BID"      // Lowest Cost (auto, recommended for SMB)
  | "BID_TYPE_CUSTOM";     // Cost Cap or Bid Cap

/** Distinguishes Cost Cap vs Bid Cap when bidType is BID_TYPE_CUSTOM.
 *  Cost Cap: TikTok averages around your bid, may exceed per-auction.
 *  Bid Cap: Hard ceiling per auction, never exceeds your bid. */
export type BidStrategy = "COST_CAP" | "BID_CAP";

/** Maps to API billing_event */
export type BillingEvent = "CPC" | "OCPM" | "CPM" | "CPV";

/** Maps to API budget_mode */
export type BudgetMode = "BUDGET_MODE_DAY" | "BUDGET_MODE_TOTAL";

/** Maps to API deep_bid_type -- used when optimizationGoal is VALUE (Web/App VBO) */
export type DeepBidType = "VO_MIN_ROAS" | "VO_HIGHEST_VALUE" | "PACING" | "DEFAULT";

/** Maps to API click_attribution_window / view_attribution_window */
export type ClickAttributionWindow = "1" | "7" | "14" | "28";
export type ViewAttributionWindow = "0" | "1" | "7";

/** Maps to API pacing */
export type Pacing = "PACING_MODE_SMOOTH" | "PACING_MODE_FAST";

/** Frequency cap period. Maps to API frequency_schedule. */
export type FrequencySchedule = 1 | 7 | 14 | 30;

/** Frequency cap configuration for Reach objective */
export interface FrequencyCap {
  /** Max impressions per user. Maps to API frequency. Typically 1-20, default ~3. */
  frequency: number;
  /** Time period in days. Maps to API frequency_schedule. */
  schedule: FrequencySchedule;
}

/** Maps to API placement_type */
export type PlacementType = "PLACEMENT_TYPE_AUTOMATIC" | "PLACEMENT_TYPE_NORMAL";

/** Maps to API gender */
export type Gender = "GENDER_MALE" | "GENDER_FEMALE" | "GENDER_UNLIMITED";

/** Budget type: how the budget is consumed over the campaign lifetime */
export type PaymentMethod = "prepaid" | "pay_as_you_go";

/** Maps to API brand_safety_type on ad group */
export type BrandSafetyType =
  | "NO_BRAND_SAFETY"     // No filtering (default)
  | "EXPANDED_INVENTORY"  // Exclude explicitly inappropriate content
  | "STANDARD_INVENTORY"  // Appropriate for most brands (recommended)
  | "LIMITED_INVENTORY";  // Most restrictive, no mature themes

/** Content interaction controls at ad group level */
export interface ContentControls {
  /** Maps to API comment_disabled. Disables comments on ads. */
  commentDisabled: boolean;
  /** Maps to API share_disabled. Disables sharing of ads. */
  shareDisabled: boolean;
  /** Maps to API video_download_disabled. Disables video download. */
  videoDownloadDisabled: boolean;
}

/* ---- Objective Config ---- */

export interface ObjectiveConfig {
  /** TikTok API objective_type */
  apiObjective: string;
  /** Human-readable label */
  label: string;
  /** Description shown to the merchant */
  description: string;
  /** Allowed optimization goals */
  allowedGoals: OptimizationGoal[];
  /** Default optimization goal */
  defaultGoal: OptimizationGoal;
  /** Pixel requirement */
  pixelRequirement: "required" | "optional" | "none";
  /** Whether catalog can be used */
  catalogAvailable: boolean;
  /** Allowed ad formats */
  allowedAdFormats: TikTokAdFormat[];
  /** Default CTA */
  defaultCTA: TikTokCTA;
}

export const OBJECTIVE_CONFIGS: Record<string, ObjectiveConfig> = {
  PRODUCT_SALES: {
    apiObjective: "PRODUCT_SALES",
    label: "Sales",
    description: "Drive purchases on your website",
    allowedGoals: ["CONVERSION", "VALUE", "CLICK"],
    defaultGoal: "CONVERSION",
    pixelRequirement: "required",
    catalogAvailable: true,
    allowedAdFormats: ["SINGLE_VIDEO", "SINGLE_IMAGE", "CAROUSEL", "SPARK_AD"],
    defaultCTA: "SHOP_NOW",
  },
  REACH: {
    apiObjective: "REACH",
    label: "Reach",
    description: "Show your ad to the maximum number of people",
    allowedGoals: ["REACH"],
    defaultGoal: "REACH",
    pixelRequirement: "none",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_VIDEO", "SINGLE_IMAGE", "CAROUSEL", "SPARK_AD"],
    defaultCTA: "LEARN_MORE",
  },
  TRAFFIC: {
    apiObjective: "TRAFFIC",
    label: "Traffic",
    description: "Send more people to your website or landing page",
    allowedGoals: ["CLICK", "LANDING_PAGE_VIEW"],
    defaultGoal: "CLICK",
    pixelRequirement: "optional",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_VIDEO", "SINGLE_IMAGE", "CAROUSEL", "SPARK_AD"],
    defaultCTA: "LEARN_MORE",
  },
  VIDEO_VIEWS: {
    apiObjective: "VIDEO_VIEWS",
    label: "Video Views",
    description: "Get more people to watch your video content",
    allowedGoals: ["VIDEO_VIEW", "FOCUSED_VIEW"],
    defaultGoal: "VIDEO_VIEW",
    pixelRequirement: "none",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_VIDEO", "SPARK_AD"],
    defaultCTA: "LEARN_MORE",
  },
  LEAD_GENERATION: {
    apiObjective: "LEAD_GENERATION",
    label: "Lead Generation",
    description: "Collect leads with TikTok Instant Forms or your website",
    allowedGoals: ["LEAD_GENERATION"],
    defaultGoal: "LEAD_GENERATION",
    pixelRequirement: "none",
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_VIDEO", "SINGLE_IMAGE", "CAROUSEL", "SPARK_AD"],
    defaultCTA: "SIGN_UP",
  },
  APP_PROMOTION: {
    apiObjective: "APP_PROMOTION",
    label: "App Promotion",
    description: "Drive app installs and grow your mobile user base",
    allowedGoals: ["INSTALL", "IN_APP_EVENT", "CLICK", "VALUE"],
    defaultGoal: "INSTALL",
    pixelRequirement: "none",  // Uses TikTok SDK, not pixel
    catalogAvailable: false,
    allowedAdFormats: ["SINGLE_VIDEO", "SINGLE_IMAGE", "CAROUSEL", "SPARK_AD"],
    defaultCTA: "INSTALL_NOW",
  },
};

/* ---- Lead Generation: Optimization Location ---- */

/** Maps to API optimization_location for Lead Generation campaigns */
export type LeadOptimizationLocation = "INSTANT_FORM" | "WEBSITE";

/** Instant Form question type */
export type InstantFormQuestionType = "SHORT_ANSWER" | "MULTIPLE_CHOICE" | "APPOINTMENT" | "IMAGE_SELECT";

/** Personal info field types that TikTok can auto-fill */
export type PersonalInfoField =
  | "PHONE_NUMBER"
  | "EMAIL"
  | "NAME"
  | "FIRST_NAME"
  | "LAST_NAME"
  | "CITY"
  | "COUNTRY"
  | "POSTAL_CODE";

/** Instant Form intent type */
export type InstantFormType = "MORE_VOLUME" | "HIGHER_INTENT";

/** A custom question in the Instant Form */
export interface InstantFormQuestion {
  id: string;
  type: InstantFormQuestionType;
  questionText: string;
  /** Only for MULTIPLE_CHOICE: up to 10 options */
  options: string[];
  required: boolean;
}

/** Form creation status — tracks the POST /page/lead_gen/create/ flow */
export type InstantFormCreateStatus = "unsaved" | "saving" | "saved" | "error";

/** Instant Form configuration */
export interface InstantFormConfig {
  /** Form name for reference */
  formName: string;
  /** Form template */
  formTemplate: "SIMPLE_SIGNUP" | "RICH_CONTENT" | "LEAD_QUALIFICATION" | "BLANK";
  /** Form type: More Volume (default) or Higher Intent */
  formType: InstantFormType;
  /** Banner image URL */
  bannerImageUrl: string;
  /** Introduction / headline */
  headline: string;
  /** Description / purpose statement */
  description: string;
  /** Custom questions */
  questions: InstantFormQuestion[];
  /** Personal information fields to collect */
  personalInfoFields: PersonalInfoField[];
  /** Company name (required for privacy section) */
  companyName: string;
  /** Privacy policy URL (required) */
  privacyPolicyUrl: string;
  /** Thank you page headline */
  thankYouHeadline: string;
  /** Thank you page description */
  thankYouDescription: string;
  /** Thank you page CTA button text */
  thankYouButtonText: string;
  /** Thank you page CTA URL (optional -- redirect after form) */
  thankYouUrl: string;
  /** Phase 4: page_id returned by POST /page/lead_gen/create/.
   *  The ad group references the form by this id (the form is NOT sent
   *  inline on the ad group). Empty until the merchant saves the form. */
  pageId: string;
  /** Phase 4: server-side creation status for the form */
  createStatus: InstantFormCreateStatus;
  /** Phase 4: last error message if createStatus === "error" */
  createError: string;
}

/* ---- App Promotion: App Settings ---- */

/** Internal mode distinguishing New Installs vs Retargeting audiences.
 *  Phase 5 note: this is NOT a TikTok API enum. The API's promotion_type
 *  field for App Promotion takes the platform value (APP_ANDROID / APP_IOS).
 *  Retargeting is expressed via an audience-targeting rule (custom audience
 *  of app users), not via a different promotion_type. */
export type AppPromotionType = "APP_INSTALL" | "APP_RETARGETING";

/** Maps to API app_type AND promotion_type for APP_PROMOTION objective.
 *  Phase 5 fix: API values are APP_IOS / APP_ANDROID (previously IOS / ANDROID). */
export type AppPlatform = "APP_IOS" | "APP_ANDROID";

/** App configuration for APP_PROMOTION campaigns */
export interface AppSettings {
  /** Maps to API app_id -- registered in TikTok Events Manager */
  appId: string;
  /** Display name of the app (used in sidebar summary, not an API field) */
  appName: string;
  /** Maps to API app_type (APP_IOS | APP_ANDROID).
   *  Phase 5 fix: values switched from IOS/ANDROID. */
  appPlatform: AppPlatform;
  /** App Store or Google Play URL.
   *  Phase 5 note: NOT sent on the ad group — the store URL is carried by
   *  the app_id registered in TikTok Events Manager. Kept here for display
   *  and pre-launch validation only. */
  appDownloadUrl: string;
  /** Internal mode: New Installs vs Retargeting. Drives audience requirements. */
  appPromotionType: AppPromotionType;
  /** Phase 5: in-app event id from TikTok Events Manager, required for AEO
   *  (optimization_goal = IN_APP_EVENT) and App VBO (optimization_goal = VALUE).
   *  Maps to API app_event_id. */
  appEventId: string;
  /** Display label for the selected event (UI only, not an API field). */
  appEventName: string;
  /** Phase 5: deep event category, e.g. "PURCHASE", "REGISTRATION", "LEVEL_UP".
   *  Maps to API deep_external_action. Required for AEO + App VBO. */
  deepExternalAction: string;
}

/* ---- Step: Objective ---- */

export type PixelMode = "existing" | "salla_managed" | "none";

/** Pixel sharing status — tracks the BC partner sharing flow for merchant-owned pixels */
export type PixelLinkStatus =
  | "not_started"     // User hasn't begun the sharing flow
  | "pending"         // Sharing request sent, waiting for merchant to share from their BC
  | "shared"          // Pixel successfully shared and linked
  | "error";          // Sharing failed

/** Maps to API shopping_ads_type at the ad-group level */
export type ShoppingAdsType =
  | "VIDEO_SHOPPING_ADS"       // Video Shopping Ads (with catalog)
  | "CATALOG_LISTING_ADS"  // Catalog Listing Ads (dynamic product cards)
  | "PRODUCT_SHOPPING_ADS"; // Product Shopping Ads

/** How products are selected from the catalog */
export type ProductSelectionMode = "ALL" | "PRODUCT_SET" | "SPECIFIC";

/* ---- Smart+ (upgraded) module toggles ---------------------------- */
/**
 * Upgraded Smart+ has 4 independently-toggleable automation modules
 * per TikTok's Jan 2026 launch. Each can be "Auto" (TikTok decides) or
 * "Custom" (merchant decides).
 *
 * Only valid for SALES / LEAD_GENERATION / APP_PROMOTION objectives.
 * Traffic / Reach / Video Views still use the classic create endpoint
 * (POST /open_api/v1.3/campaign/create/).
 *
 * When enabled, the campaign payload swaps to:
 *   POST /open_api/v1.3/smart_plus/campaign/create/
 */
export type SmartPlusModuleMode = "AUTO" | "CUSTOM";
export interface SmartPlusSettings {
  /** Master toggle. Default ON for Sales / Lead Gen / App Promo. */
  enabled: boolean;
  /** Audience targeting automation. AUTO = location + language only. */
  smartTargeting: SmartPlusModuleMode;
  /** Budget automation. AUTO = campaign-level budget, TikTok distributes. */
  smartBudget: SmartPlusModuleMode;
  /** Placement automation. AUTO = TikTok picks placements. */
  smartPlacement: SmartPlusModuleMode;
  /** Creative automation. AUTO = dynamic_format + smart rotation. */
  smartCreative: SmartPlusModuleMode;
}

export interface ObjectiveSettings {
  campaignName: string;
  objective: TikTokObjective;
  /** Website or Catalog-based product sales */
  promotionType: PromotionType;
  /** Upgraded Smart+ module toggles. Only meaningful for Sales / Lead Gen / App Promo. */
  smartPlus: SmartPlusSettings;
  /** Campaign Budget Optimization. Maps to API budget_optimize_on.
   *  When enabled, campaign budget is distributed across all ad groups automatically. */
  budgetOptimizeOn: boolean;
  /** TikTok Pixel setup */
  pixelMode: PixelMode;
  pixelId: string;
  pixelName: string;
  /** Tracks the BC partner pixel sharing flow (used when pixelMode === "existing") */
  pixelLinkStatus: PixelLinkStatus;
  /** ---- Catalog fields (used when promotionType === "CATALOG") ---- */
  /** Whether to use a product catalog. Maps to presence of catalog_id on ad group. */
  catalogEnabled: boolean;
  /** Maps to API catalog_id. Salla auto-syncs catalogs so this is pre-filled. */
  catalogId: string;
  /** Maps to API shopping_ads_type on ad group. */
  shoppingAdsType: ShoppingAdsType;
  /** How to select products: all, product set, or specific SKUs */
  productSelectionMode: ProductSelectionMode;
  /** Maps to API product_set_id. Used when productSelectionMode === "PRODUCT_SET". */
  productSetId: string;
  /** Specific product/SKU IDs. Used when productSelectionMode === "SPECIFIC" (max 20). */
  specificProductIds: string[];
  /** Whether to use dynamic format (AI-generated creatives from catalog). Maps to dynamic_format on creative. */
  dynamicFormat: boolean;

  /* ---- Lead Generation fields ---- */
  /** Where to optimize for leads: Instant Form (in-app) or Website */
  leadOptimizationLocation: LeadOptimizationLocation;
  /** Instant Form configuration (only when leadOptimizationLocation === "INSTANT_FORM") */
  instantForm: InstantFormConfig;

  /* ---- App Promotion fields ---- */
  /** App settings (only when objective === "APP_PROMOTION") */
  appSettings: AppSettings;
}

/* ---- Step: Audience ---- */

export interface AudienceSettings {
  /** TikTok location_ids (country codes; city-level when API mapping exists) */
  locationIds: string[];
  /** Selected city ids from shared location list (same UX as other platforms; map to location_ids when sending to API) */
  cities: string[];
  /** Age min/max (matches Snap pattern for consistency) */
  ageMin: number;
  ageMax: number;
  /** API gender field */
  gender: Gender;
  /** Language codes */
  languages: string[];
  /** Interest category IDs. Maps to API interest_category_ids. */
  interests: string[];
  /** Interest keyword IDs for granular interest targeting. Maps to API interest_keyword_ids.
   *  More specific than categories -- targets users interested in specific topics/products. */
  interestKeywordIds: string[];
  /** Purchase intent keyword IDs. Maps to API purchase_intention_keyword_ids.
   *  Targets users actively searching/engaging with specific product categories. Critical for e-commerce. */
  purchaseIntentKeywordIds: string[];
  /** Device operating systems */
  operatingSystems: string[];
  /** Custom audience IDs to include */
  customAudienceIds: string[];
  /** Custom audience IDs to exclude */
  excludedAudienceIds: string[];
  /** Enable automatic targeting expansion. Maps to API smart_interest_behavior_enabled. */
  autoTargetingEnabled: boolean;
  /** Exclude recent purchasers via Salla segment */
  excludeRecentPurchasers: boolean;
  excludeRecentPurchasersDays: number;
  /** Salla lookalike audience category */
  sallaAudienceCategory: string;
}

/* ---- Step: Budget ---- */

export interface BudgetSettings {
  /** Daily or Lifetime budget. Maps to API budget_mode. */
  budgetMode: BudgetMode;
  /** Daily budget in SAR (when budgetMode is BUDGET_MODE_DAY) */
  amount: number;
  /** Total/lifetime budget in SAR (when budgetMode is BUDGET_MODE_TOTAL).
   *  The entire amount is spent over the campaign duration. */
  lifetimeAmount: number;
  /** Optimization goal */
  optimizationGoal: OptimizationGoal;
  /** Specific conversion event (when goal is CONVERSION or VALUE) */
  optimizationEvent: OptimizationEvent;
  /** Bid strategy */
  bidType: BidType;
  /** Cost Cap vs Bid Cap -- only applies when bidType is BID_TYPE_CUSTOM.
   *  Cost Cap: average cost around target. Bid Cap: hard max per auction. */
  bidStrategy: BidStrategy;
  /** Manual bid amount (only when bidType is BID_TYPE_CUSTOM).
   *  Maps to conversion_bid_price for CONVERSION, bid_price for CLICK */
  bidAmount: number;
  /** Billing event -- auto-derived from optimizationGoal (OCPM for CONVERSION/VALUE, CPC for CLICK) */
  billingEvent: BillingEvent;
  /** Deep bid type -- required when optimizationGoal is VALUE (Web/App VBO) */
  deepBidType: DeepBidType;
  /** Minimum ROAS target -- required when deepBidType is VO_MIN_ROAS */
  roasBid: number;
  /** Click-through attribution window in days */
  clickAttributionWindow: ClickAttributionWindow;
  /** View-through attribution window in days */
  viewAttributionWindow: ViewAttributionWindow;
  /** Delivery pacing */
  pacing: Pacing;
  /** Schedule */
  startDate: string;
  endDate: string;
  endDateOptional: boolean;
  schedule: "all_day" | "custom";
  /** Skip the learning phase for faster delivery */
  skipLearningPhase: boolean;
  /** Budget type: how the budget is consumed */
  paymentMethod: PaymentMethod;
  /** Salla performance boost upsell */
  performanceBoost: boolean;
  /** Frequency cap (Reach objective only). Controls max impressions per user. */
  frequencyCap?: FrequencyCap;
  /** Enable ads in TikTok search results. Maps to API search_result_enabled.
   *  Available for PRODUCT_SALES and TRAFFIC objectives. */
  searchResultEnabled: boolean;
  /** Salla auto-increase configuration */
  autoIncrease: {
    enabled: boolean;
    pct: number;
    intervalDays: number;
    maxDailyBudget: number;
  };
}

/* ---- Step: Creative ---- */

/** TikTok ad format */
export type TikTokAdFormat =
  | "SINGLE_VIDEO"
  | "SINGLE_IMAGE"
  | "CAROUSEL"
  | "SPARK_AD";

/** TikTok media type */
export type TikTokMediaType = "IMAGE" | "VIDEO";

/** CTA values used across objectives (PRODUCT_SALES, REACH, etc.) */
export type TikTokCTA =
  | "SHOP_NOW"
  | "BUY_NOW"
  | "LEARN_MORE"
  | "SIGN_UP"
  | "CONTACT_US"
  | "APPLY_NOW"
  | "BOOK_NOW"
  | "GET_QUOTE"
  | "ORDER_NOW"
  | "SUBSCRIBE"
  | "DOWNLOAD"
  | "GET_OFFER"
  | "VIEW_NOW"
  | "GET_SHOWTIMES"
  | "LISTEN_NOW"
  | "INSTALL_NOW";

/**
 * Creative asset (image or video).
 * Images: 1080x1920 (9:16), 1200x628 (1.91:1), 640x640 (1:1). PNG/JPG, max 5MB.
 * Videos: 9:16, 16:9, 1:1. MP4/MOV, 540x960+ min, up to 10min, max 500MB.
 */
export interface CreativeAsset {
  id: string;
  type: TikTokMediaType;
  url: string;
  file?: File;
  /** TikTok video_id or image_id (returned after upload to Media API) */
  mediaId?: string;
  thumbnailUrl?: string;
}

/** Carousel card (for CAROUSEL format, 2-35 cards). Maps to API carousel_image_index. */
export interface CarouselCard {
  id: string;
  imageUrl: string;
  file?: File;
  /** Headline shown on the card */
  headline?: string;
}

/** A single ad in the campaign */
export interface TikTokAd {
  id: string;
  name: string;
  /** Ad format. Maps to API ad_format. */
  adFormat: TikTokAdFormat;
  /** Main creative assets (video or image). Maps to video_id / image_ids after upload. */
  assets: CreativeAsset[];
  /** Carousel cards (only for CAROUSEL format, 2-35 standard, 2-20 VSA). Maps to image_ids + carousel_image_index. */
  carouselCards: CarouselCard[];
  /** Ad text / caption (max 100 chars). Maps to API ad_text. The first
   *  caption is required; additional variants live in adTextVariations
   *  and are sent as `ad_texts` (Smart+ multi-text A/B test, up to 5). */
  adText: string;
  /** Additional caption variations for Smart+ multi-text rotation.
   *  TikTok's upgraded Smart+ allows up to 5 ad text variants total
   *  (including adText). Empty array = single-caption ad. */
  adTextVariations: string[];
  /** When true, ads only show as in-feed ads — they do not appear on the
   *  creator's TikTok profile. Maps to API show_only_as_ads. Default true
   *  for Smart+ Sales (most merchants don't want public profile posts). */
  onlyShowAsAds: boolean;
  /** Display name / brand name (max 20 chars). Maps to API display_name. */
  displayName: string;
  /** CTA button. Maps to API call_to_action. */
  callToAction: TikTokCTA;
  /** Landing page URL. Maps to API landing_page_url. Required for non-Spark ads. */
  landingPageUrl: string;

  /* --- Spark Ads --- */
  /**
   * Spark Ad: promote an existing organic TikTok post.
   * Identity type should be TT_USER or AUTH_CODE.
   * Caption cannot be edited. Private posts become public during promotion.
   * CTA and landing_page_url are optional overrides.
   */
  sparkAdEnabled: boolean;
  /** TikTok post auth code (used to get tiktok_item_id). Maps to API tiktok_item_id. */
  sparkAdAuthCode: string;
  /** Allow duet on Spark Ad post. Maps to API item_duet_status. ENABLE | DISABLE */
  sparkDuetStatus?: "ENABLE" | "DISABLE";
  /** Allow stitch on Spark Ad post. Maps to API item_stitch_status. ENABLE | DISABLE */
  sparkStitchStatus?: "ENABLE" | "DISABLE";

  /* --- Music --- */
  /** Music file for carousel ads (REQUIRED) or optional for video/image ads. */
  musicFile?: File;
  /** Blob URL for music preview. */
  musicUrl?: string;
  /** CML music_id from TikTok's Commercial Music Library. Maps to API music_id. */
  musicId?: string;
  /** Display name for the selected track (for UI only — not sent to API). */
  musicName?: string;
  /** Whether promotional music is disabled. Maps to API promotional_music_disabled. Default true. */
  promotionalMusicDisabled: boolean;

  /* --- Deep Links --- */
  /** Deep link URL for app. Maps to API deeplink. */
  deeplink?: string;
  /** Deep link type. Maps to API deeplink_type. */
  deeplinkType?: "NORMAL" | "DEFERRED";

  /* --- Catalog / Shopping --- */
  /** Product set ID (at ad level for catalog ads). Maps to API product_set_id. */
  productSetId?: string;
  /** Dynamic format (at ad level). Maps to API dynamic_format. DYNAMIC_CREATIVE | SINGLE_VIDEO | CATALOG_VIDEO | CAROUSEL. */
  dynamicFormat?: string;
  /** Use instant product page. Maps to API instant_product_page_used. */
  instantProductPageUsed?: boolean;
  /** Shopping ads deeplink type. Maps to API shopping_ads_deeplink_type. */
  shoppingAdsDeeplinkType?: "NONE" | "PRODUCT_LINK";
  /** Video package ID for catalog video template. Maps to API shopping_ads_video_package_id. */
  shoppingAdsVideoPackageId?: string;

  /* --- Advanced --- */
  /** AIGC disclosure. Maps to API aigc_disclosure_type. NOT_DECLARED | DECLARED. */
  aigcDisclosureType?: "NOT_DECLARED" | "DECLARED";
}

/** Identity type for ads. Maps to API identity_type.
 *
 *  BC_AUTH_TT (primary): Merchant's TikTok account authorized via Salla's Business Center QR code.
 *    Salla owns the BC, generates a QR → merchant scans in TikTok app → account linked for ad delivery.
 *    Enables Spark Ads from the merchant's own organic posts. Requires identity_authorized_bc_id.
 *
 *  AUTH_CODE (secondary): Creator generates a per-video Spark code (7/30/60/365 days).
 *    Used for promoting third-party creator/influencer content as Spark Ads.
 *
 *  CUSTOMIZED_USER (deprecated): Synthetic identity with custom name + avatar. No real TikTok account.
 *    Being deprecated by TikTok (early 2026). Kept as fallback only.
 *
 *  TT_USER: Not used in Salla — requires merchant to have direct access to the TikTok ad account.
 */
export type IdentityType = "BC_AUTH_TT" | "AUTH_CODE" | "CUSTOMIZED_USER" | "TT_USER";

/** Connection status for the BC_AUTH_TT QR code linking flow */
export type TikTokAccountLinkStatus = "not_started" | "qr_generated" | "scanned" | "confirmed" | "expired" | "error";

/** Identity settings shared across all ads in the campaign */
export interface IdentitySettings {
  /** Maps to API identity_type */
  identityType: IdentityType;
  /** Maps to API identity_id.
   *  BC_AUTH_TT: the linked TikTok account's identity ID (returned after QR scan confirmation).
   *  AUTH_CODE: the creator's authorization code.
   *  CUSTOMIZED_USER: the advertiser_id. */
  identityId: string;
  /** Display name for CUSTOMIZED_USER identity. Maps to API display_name at identity level.
   *  For BC_AUTH_TT, this is auto-filled from the linked TikTok profile. */
  displayName: string;
  /** Brand avatar image. Maps to API avatar_icon_web_uri (not profile_image_url). */
  avatarFile?: File;
  avatarPreviewUrl: string;
  /** Salla's Business Center ID. Required when identityType is BC_AUTH_TT.
   *  Maps to API identity_authorized_bc_id. Auto-filled by Salla backend. */
  businessCenterId: string;
  /** The linked TikTok username (e.g. @storename). Displayed in UI after linking.
   *  Populated from the BC account linking response. */
  tiktokUsername: string;
  /** Current status of the QR code linking flow */
  linkStatus: TikTokAccountLinkStatus;
}

export type TikTokPlacement = "PLACEMENT_TIKTOK" | "PLACEMENT_PANGLE" | "PLACEMENT_GLOBAL_APP_BUNDLE";

/** Phase 6: which placements each objective can target. Based on the
 *  availability notes in TikTok's placement docs.
 *   - PRODUCT_SALES / REACH / VIDEO_VIEWS / LEAD_GENERATION → TikTok only.
 *     Pangle/GlobalAppBundle don't support these optimization goals.
 *   - TRAFFIC → TikTok + Pangle.
 *   - APP_PROMOTION → TikTok + Pangle + Global App Bundle.
 */
export function getAllowedPlacements(objective: TikTokObjective): TikTokPlacement[] {
  switch (objective) {
    case "TRAFFIC":
      return ["PLACEMENT_TIKTOK", "PLACEMENT_PANGLE"];
    case "APP_PROMOTION":
      return ["PLACEMENT_TIKTOK", "PLACEMENT_PANGLE", "PLACEMENT_GLOBAL_APP_BUNDLE"];
    case "PRODUCT_SALES":
    case "REACH":
    case "VIDEO_VIEWS":
    case "LEAD_GENERATION":
    default:
      return ["PLACEMENT_TIKTOK"];
  }
}

export interface CreativeSettings {
  /** All ads in this campaign */
  ads: TikTokAd[];
  /** Placement type (shared across all ads). Maps to API placement_type. */
  placementType: PlacementType;
  /** Selected placements when placementType is PLACEMENT_TYPE_NORMAL. Maps to API placement array. */
  placements: TikTokPlacement[];
  /** Identity settings shared across all ads */
  identity: IdentitySettings;
  /** Brand safety inventory filter. Maps to API brand_safety_type on ad group. */
  brandSafetyType: BrandSafetyType;
  /** Content interaction controls. Maps to API comment_disabled, share_disabled, video_download_disabled. */
  contentControls: ContentControls;
}

/* ---- Full Campaign ---- */

export interface TikTokCampaignData {
  objective: ObjectiveSettings;
  audience: AudienceSettings;
  budget: BudgetSettings;
  creative: CreativeSettings;
}

export const defaultTikTokCampaign: TikTokCampaignData = {
  objective: {
    campaignName: "",
    objective: "PRODUCT_SALES",
    promotionType: "WEBSITE",
    // Smart+ ON by default — applies only to Sales/Lead Gen/App Promo.
    // Step-objective.tsx flips `enabled: false` automatically if a merchant
    // picks Traffic / Reach / Video Views (Smart+ isn't in the upgraded
    // experience for those yet).
    smartPlus: {
      enabled: true,
      smartTargeting: "AUTO",
      smartBudget: "AUTO",
      smartPlacement: "AUTO",
      smartCreative: "AUTO",
    },
    budgetOptimizeOn: false,
    pixelMode: "none",
    pixelId: "",
    pixelName: "",
    pixelLinkStatus: "not_started",
    catalogEnabled: false,
    catalogId: "",
    shoppingAdsType: "VIDEO_SHOPPING_ADS",
    productSelectionMode: "ALL",
    productSetId: "",
    specificProductIds: [],
    dynamicFormat: false,
    leadOptimizationLocation: "INSTANT_FORM",
    appSettings: {
      appId: "",
      appName: "",
      appPlatform: "APP_ANDROID",
      appDownloadUrl: "",
      appPromotionType: "APP_INSTALL",
      appEventId: "",
      appEventName: "",
      deepExternalAction: "",
    },
    instantForm: {
      formName: "",
      formTemplate: "SIMPLE_SIGNUP",
      formType: "MORE_VOLUME",
      bannerImageUrl: "",
      headline: "",
      description: "",
      questions: [],
      personalInfoFields: ["NAME", "EMAIL", "PHONE_NUMBER"],
      companyName: "",
      privacyPolicyUrl: "",
      thankYouHeadline: "Thank you for your interest!",
      thankYouDescription: "We will get back to you shortly.",
      thankYouButtonText: "Visit Website",
      thankYouUrl: "",
      pageId: "",
      createStatus: "unsaved",
      createError: "",
    },
  },
  audience: {
    locationIds: ["SA"],
    cities: [],
    ageMin: 18,
    ageMax: 55,
    gender: "GENDER_UNLIMITED",
    languages: ["ar"],
    interests: [],
    interestKeywordIds: [],
    purchaseIntentKeywordIds: [],
    operatingSystems: ["IOS", "ANDROID"],
    customAudienceIds: [],
    excludedAudienceIds: [],
    autoTargetingEnabled: true,
    excludeRecentPurchasers: false,
    excludeRecentPurchasersDays: 30,
    sallaAudienceCategory: "",
  },
  budget: {
    budgetMode: "BUDGET_MODE_DAY",
    amount: 200,
    lifetimeAmount: 0,
    optimizationGoal: "CONVERSION",
    optimizationEvent: "COMPLETE_PAYMENT",
    bidType: "BID_TYPE_NO_BID",
    bidStrategy: "COST_CAP",
    bidAmount: 0,
    billingEvent: "OCPM",
    deepBidType: "DEFAULT",
    roasBid: 1.0,
    clickAttributionWindow: "7",
    viewAttributionWindow: "1",
    pacing: "PACING_MODE_SMOOTH",
    startDate: "",
    endDate: "",
    endDateOptional: false,
    schedule: "all_day",
    skipLearningPhase: false,
    paymentMethod: "prepaid",
    performanceBoost: true,
    searchResultEnabled: false,
    autoIncrease: {
      enabled: false,
      pct: 20,
      intervalDays: 7,
      maxDailyBudget: 600,
    },
  },
  creative: {
    ads: [],
    placementType: "PLACEMENT_TYPE_AUTOMATIC",
    // Phase 6 fix: default to TikTok only. Pangle / Global App Bundle are
    // enabled only for objectives that support them (see getAllowedPlacements).
    // Previous default shipped Pangle + Global App Bundle for every manual-
    // placement campaign, which failed for REACH / VIDEO_VIEWS / LEAD_GEN.
    placements: ["PLACEMENT_TIKTOK"],
    identity: {
      identityType: "BC_AUTH_TT",
      identityId: "",
      displayName: "",
      avatarPreviewUrl: "",
      businessCenterId: "",
      tiktokUsername: "",
      linkStatus: "not_started",
    },
    brandSafetyType: "NO_BRAND_SAFETY",
    contentControls: {
      commentDisabled: false,
      shareDisabled: false,
      videoDownloadDisabled: false,
    },
  },
};
