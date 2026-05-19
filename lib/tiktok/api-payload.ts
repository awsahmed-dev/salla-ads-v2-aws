/* ================================================================
   TikTok Marketing API v1.3 — Payload Builder (Pure Function)
   ----------------------------------------------------------------
   Extracted from step-review.tsx to:
     1. Keep the payload logic pure and testable
     2. Provide a single source of truth for every objective's payload
     3. Guard against placeholder leaks at submit time

   Phase 0 of the audit-fix plan: BEHAVIOR-PRESERVING refactor.
   Known bugs (see audit report) are intentionally left in place here
   and will be addressed one-by-one in Phases 1-6 with snapshot tests
   catching the diff.
   ================================================================ */

import { minMaxToAgeBands } from "@/lib/demographics";
import type { TikTokCampaignData } from "./campaign-types";

/* ---- Salla Mock Constants (used when merchant lacks a real id) ---- */
export const SALLA_MOCK_PIXEL_ID = "CMOCK1234567890";
export const SALLA_MOCK_CATALOG_ID = "CMOCK_CATALOG_001";

/**
 * Salla's TikTok Marketing API partner identifier. Emitted as
 * `open_api_partner` on every Smart+ campaign body so TikTok-side
 * analytics attribute the campaign to the Salla integration. Real
 * value is provisioned by TikTok during onboarding; this placeholder
 * resolves at submit-time.
 */
export const SALLA_PARTNER_ID = "SALLA_E_COMMERCE";

/**
 * Generate a request_id (deduplication token). TikTok requires a
 * unique token per submit attempt on every body: campaign, ad-group,
 * and ad. Format is a short UUID-like string; TikTok docs accept any
 * unique string up to 64 chars.
 *
 * In preview mode we use a stable seed so the JSON-view panel doesn't
 * thrash on every re-render. In submit mode we generate a fresh one
 * per call to ensure each retry has a unique token.
 */
export function generateRequestId(seed?: string): string {
  if (seed) return `salla_${seed}`;
  // crypto.randomUUID() is universally available in modern runtimes;
  // fall back to a timestamp+random combo if it's missing.
  const cryptoUuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `salla_${cryptoUuid}`;
}

/* ---- Age band mapping (Salla demographics -> TikTok API enum) ---- */
const TIKTOK_AGE_BAND_MAP: Record<string, string> = {
  "18_24": "AGE_18_24",
  "25_34": "AGE_25_34",
  "35_44": "AGE_35_44",
  "45_54": "AGE_45_54",
  "55_64": "AGE_55_100",
  "65_PLUS": "AGE_55_100",
};

export function toTikTokAgeGroups(ageMin: number, ageMax: number): string[] {
  const bands = minMaxToAgeBands(ageMin, ageMax);
  const groups = new Set<string>();
  for (const b of bands) {
    const mapped = TIKTOK_AGE_BAND_MAP[b];
    if (mapped) groups.add(mapped);
  }
  return Array.from(groups);
}

export function toApiDateTime(dateStr: string, end?: boolean): string {
  if (!dateStr) return "";
  if (dateStr.includes(" ")) return dateStr;
  return end ? `${dateStr} 23:59:59` : `${dateStr} 00:00:00`;
}

/** Maps internal optimization_goal enum to TikTok Marketing API v1.3 values.
 *  Key difference: API uses "CONVERT" not "CONVERSION". */
export const GOAL_TO_API: Record<string, string> = {
  CONVERSION: "CONVERT",
  VALUE: "VALUE",
  CLICK: "CLICK",
  LANDING_PAGE_VIEW: "LANDING_PAGE_VIEW",
  REACH: "REACH",
  // Phase 3 fix: "SHOW" was never a valid TikTok optimization_goal enum.
  // Impressions are controlled via frequency + frequency_schedule alone.
  VIDEO_VIEW: "VIDEO_VIEW",
  FOCUSED_VIEW: "FOCUSED_VIEW",
  // Phase 4 fix: Lead Gen uses CONVERT at the API level with
  // optimization_event=FORM (instant form) or FORM/SUBMIT_FORM (website).
  // "LEAD_GENERATION" was never a documented optimization_goal enum.
  LEAD_GENERATION: "CONVERT",
  INSTALL: "INSTALL",
  IN_APP_EVENT: "IN_APP_EVENT",
};

/** Maps internal optimization_event enum to TikTok API v1.3 PascalCase format. */
export const EVENT_TO_API: Record<string, string> = {
  COMPLETE_PAYMENT: "CompletePayment",
  INITIATE_CHECKOUT: "InitiateCheckout",
  ADD_TO_CART: "AddToCart",
  VIEW_CONTENT: "ViewContent",
  ADD_BILLING: "AddPaymentInfo",
  SUBMIT_FORM: "SubmitForm",
};

/* ------------------------------------------------------------------ */
/*  Payload types                                                     */
/* ------------------------------------------------------------------ */

export type TikTokApiPayload = {
  /** Endpoint hint for the submit layer. When "smart_plus" the campaign
   *  POST goes to /open_api/v1.3/smart_plus/campaign/create/ instead of the
   *  classic /open_api/v1.3/campaign/create/. Stripped before sending. */
  _endpoint?: "classic" | "smart_plus";
  campaign: Record<string, unknown>;
  adgroup: Record<string, unknown>;
  instant_form?: Record<string, unknown>;
  ads: Array<Record<string, unknown>>;
};

export interface BuildPayloadOptions {
  /** "preview" keeps <PLACEHOLDER> strings for the JSON-view panel.
   *  "submit" throws PlaceholderLeakError if any remain. */
  mode: "preview" | "submit";
  advertiserId?: string;
  campaignId?: string;
  adgroupId?: string;
  resolvedPixelId?: string;
  resolvedCatalogId?: string;
}

export class PlaceholderLeakError extends Error {
  path: string;
  constructor(path: string) {
    super(`Placeholder value leaked into submit payload at: ${path}`);
    this.name = "PlaceholderLeakError";
    this.path = path;
  }
}

/* ------------------------------------------------------------------ */
/*  Main builder                                                      */
/* ------------------------------------------------------------------ */

export function buildTikTokApiPayload(
  campaign: TikTokCampaignData,
  opts: BuildPayloadOptions = { mode: "preview" }
): TikTokApiPayload {
  const { objective, audience, budget, creative } = campaign;

  const isReach = objective.objective === "REACH";
  const isTraffic = objective.objective === "TRAFFIC";
  const isVideoViews = objective.objective === "VIDEO_VIEWS";
  const isLeadGen = objective.objective === "LEAD_GENERATION";
  const isAppPromo = objective.objective === "APP_PROMOTION";
  const isSales = !isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo;
  const isCatalogListing = objective.catalogEnabled && objective.shoppingAdsType === "CATALOG_LISTING_ADS";

  // Upgraded Smart+ — only valid for Sales / Lead Gen / App Promo per
  // TikTok docs. The submit layer reads `_endpoint: "smart_plus"` to swap
  // /campaign/create/ for /smart_plus/campaign/create/.
  const sp = objective.smartPlus;
  // Search Ads (Sales-only) — at the API level this is triggered at the
  // ad-group level via search_result_enabled + search_keywords[].
  // CRITICAL: Smart+ does NOT include Search inventory. When Search Ads
  // is enabled, the campaign must route through the classic
  // /campaign/create/ endpoint regardless of the Smart+ master flag.
  const searchAdsOn = isSales && objective.searchAdsEnabled === true;
  const smartPlusEnabled = sp.enabled && (isSales || isLeadGen || isAppPromo) && !searchAdsOn;

  const advertiserId = opts.advertiserId || "<ADVERTISER_ID>";
  const campaignId = opts.campaignId || "<CAMPAIGN_ID>";
  const adgroupId = opts.adgroupId || "<ADGROUP_ID>";

  const resolvedPixelId = opts.resolvedPixelId ?? (
    objective.pixelMode === "salla_managed"
      ? SALLA_MOCK_PIXEL_ID
      : objective.pixelId || ""
  );
  const resolvedCatalogId = opts.resolvedCatalogId ?? (objective.catalogId || SALLA_MOCK_CATALOG_ID);

  const hasNonMockInterests =
    audience.interests.length > 0 && !audience.interests.every((id) => id.startsWith("TT_"));

  // Generate stable request_ids. In preview mode the seed locks the IDs
  // so the JSON panel doesn't shimmer on every keystroke; in submit mode
  // we want fresh UUIDs so retries don't collide with TikTok's de-dup.
  const reqIdSeed = opts.mode === "preview" ? `preview_${objective.campaignName || "draft"}` : undefined;
  const campaignRequestId = generateRequestId(reqIdSeed && `c_${reqIdSeed}`);
  const adgroupRequestId = generateRequestId(reqIdSeed && `ag_${reqIdSeed}`);

  const payload: TikTokApiPayload = {
    // Search Ads forces classic endpoint regardless of Smart+ master.
    // Smart+ Web docs don't include Search Result Page inventory.
    _endpoint: smartPlusEnabled ? "smart_plus" : "classic",
    campaign: smartPlusEnabled ? {
      // ── SmartPlusCampaignCreateBody (23-field spec) ─────────────────
      advertiser_id: advertiserId,
      campaign_name: objective.campaignName,
      objective_type: objective.objective,
      request_id: campaignRequestId,                  // REQUIRED
      operation_status: "ENABLE",
      campaign_type: "REGULAR_CAMPAIGN",
      open_api_partner: SALLA_PARTNER_ID,
      ...(budget.amount > 0 && { budget: budget.budgetMode === "BUDGET_MODE_TOTAL" ? budget.lifetimeAmount : budget.amount }),
      ...(budget.amount > 0 && { budget_mode: budget.budgetMode }),
      ...(objective.budgetOptimizeOn && { budget_optimize_on: true }),
      // Smart+ uses `sales_destination` (WEBSITE / APP / TIKTOK_SHOP_STORE)
      // instead of the classic `promotion_type`. For Sales, WEBSITE covers
      // both Salla store and Salla-catalog cases — catalog routing is
      // signaled separately via catalog_enabled + catalog_type.
      ...(isSales && { sales_destination: "WEBSITE" }),
      // Catalog routing: campaign body gets catalog_enabled + catalog_type
      // only. The actual catalog_id lives on the ad-group body.
      ...(isSales && objective.catalogEnabled && {
        catalog_enabled: true,
        catalog_type: "ECOMMERCE",
      }),
      // App Promo specifics (mirror what we set at ad-group level).
      ...(isAppPromo && {
        app_id: objective.appSettings.appId || "<APP_ID>",
        app_promotion_type: objective.appSettings.appPromotionType,
      }),
    } : {
      // ── Classic CampaignCreateBody (Sales / Search Ads / Reach / etc.) ─
      advertiser_id: advertiserId,
      campaign_name: objective.campaignName,
      objective_type: objective.objective,
      request_id: campaignRequestId,                  // REQUIRED for all bodies
      operation_status: "ENABLE",
      // Classic Sales still uses promotion_type + campaign-level catalog_id.
      ...(isSales && { promotion_type: objective.catalogEnabled ? "CATALOG" : "WEBSITE" }),
      ...(isSales && objective.catalogEnabled && { catalog_id: resolvedCatalogId }),
    },
    adgroup: {
      advertiser_id: advertiserId,
      campaign_id: campaignId,
      adgroup_name: `${objective.campaignName} - Ad Group`,
      request_id: adgroupRequestId,                  // REQUIRED per spec
      ...(isSales && { promotion_type: objective.catalogEnabled ? "CATALOG" : "WEBSITE" }),
      // PRODUCT_SALES only supports PLACEMENT_TIKTOK (Pangle/GlobalApp not available for sales).
      placement_type: isSales ? "PLACEMENT_TYPE_NORMAL" : creative.placementType,
      ...(isSales && { placements: ["PLACEMENT_TIKTOK"] }),
      ...(!isSales && creative.placementType === "PLACEMENT_TYPE_NORMAL" && { placements: creative.placements }),
      budget_mode: budget.budgetMode,
      budget: budget.budgetMode === "BUDGET_MODE_TOTAL" ? budget.lifetimeAmount : budget.amount,
      optimization_goal: GOAL_TO_API[budget.optimizationGoal] || budget.optimizationGoal,
      // Phase 2 fix: optimization_event is only valid for CONVERT/VALUE goals.
      // Previously sent for every Sales goal, which broke Sales+CLICK campaigns.
      ...(isSales
        && (budget.optimizationGoal === "CONVERSION" || budget.optimizationGoal === "VALUE")
        && { optimization_event: EVENT_TO_API[budget.optimizationEvent] || budget.optimizationEvent }),
      // Phase 5 fix: App Promotion payload reshape.
      //  - app_type values were IOS/ANDROID → now APP_IOS/APP_ANDROID.
      //  - promotion_type for App Promotion derives from the PLATFORM
      //    (APP_IOS / APP_ANDROID), not from APP_INSTALL/APP_RETARGETING.
      //    Retargeting is expressed via audience targeting (custom audience
      //    of app users), not via a different promotion_type value.
      //  - app_download_url removed — the store URL comes from the app_id
      //    registered in TikTok Events Manager.
      ...(isAppPromo && {
        app_id: objective.appSettings.appId || "<APP_ID>",
        app_type: objective.appSettings.appPlatform,
        promotion_type: objective.appSettings.appPlatform,
      }),
      // Phase 5 fix: App Event Optimization (IN_APP_EVENT goal) requires
      // app_event_id + deep_external_action. Previously neither was emitted,
      // so AEO campaigns rejected on launch.
      ...(isAppPromo && budget.optimizationGoal === "IN_APP_EVENT" && {
        app_event_id: objective.appSettings.appEventId || "<APP_EVENT_ID>",
        deep_external_action: objective.appSettings.deepExternalAction || "<DEEP_EVENT_CATEGORY>",
      }),
      billing_event: budget.billingEvent,
      bid_type: budget.bidType,
      ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "CONVERSION" && { conversion_bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "VIDEO_VIEW" || budget.optimizationGoal === "FOCUSED_VIEW") && { bid_price: budget.bidAmount }),
      // Phase 3 fix: Traffic + CLICK + custom bid had no branch — campaigns
      // shipped with no bid field at all. Use bid_price (CPC bidding).
      ...(budget.bidType === "BID_TYPE_CUSTOM" && isTraffic && budget.optimizationGoal === "CLICK" && { bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && isTraffic && budget.optimizationGoal === "LANDING_PAGE_VIEW" && { conversion_bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "LEAD_GENERATION" && { conversion_bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "INSTALL" || budget.optimizationGoal === "IN_APP_EVENT") && { conversion_bid_price: budget.bidAmount }),
      // Phase 4 fix: optimization_location was not a real API field — removed.
      // Instant vs Website is conveyed via page_id (Instant Form) or
      // pixel_id + optimization_event (Website form).
      // Lead Gen optimization_event is the canonical "FORM" enum in both
      // cases (docs V14 to confirm the exact token per Ad Group Create).
      ...(isLeadGen && { optimization_event: "FORM" }),
      // Phase 4 fix: Instant Form is created via POST /page/lead_gen/create/
      // and referenced here by page_id. Inline instant_form object removed.
      ...(isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM" && {
        page_id: objective.instantForm.pageId || "<LEAD_FORM_PAGE_ID>",
      }),
      // Phase 2 fix: VBO (Value Optimization) requires deep_external_action —
      // the deep event whose value is optimized. Previously only deep_bid_type
      // and roas_bid were emitted, so Sales VBO campaigns rejected.
      // Phase 5 fix: App VBO also needs deep_external_action, sourced from
      // AppSettings.deepExternalAction (the selected in-app event category).
      ...(budget.optimizationGoal === "VALUE" && {
        deep_bid_type: budget.deepBidType,
        roas_bid: Number(budget.roasBid) || 1,
        ...(isSales && { deep_external_action: EVENT_TO_API[budget.optimizationEvent] || budget.optimizationEvent }),
        ...(isAppPromo && { deep_external_action: objective.appSettings.deepExternalAction || "<DEEP_EVENT_CATEGORY>" }),
      }),
      // Phase 5 fix: App Promotion uses the same click/view attribution
      // windows as Sales, plus an engaged_view_attribution_window for
      // engaged-view install attribution.
      ...((isSales || isAppPromo) && {
        click_attribution_window: Number(budget.clickAttributionWindow),
        view_attribution_window: Number(budget.viewAttributionWindow),
      }),
      ...(isAppPromo && { engaged_view_attribution_window: 7 }),
      // Phase 3 fix: engaged_view_attribution_window is an APP_PROMOTION-only
      // field. Previously hardcoded for VIDEO_VIEWS, which the API rejects.
      // App Promotion attribution windows will be wired up in Phase 5.
      ...(isReach && budget.frequencyCap && {
        frequency: budget.frequencyCap.frequency,
        frequency_schedule: budget.frequencyCap.schedule,
      }),
      pacing: budget.pacing,
      // Phase 1 fix: API expects boolean, not 1/0.
      skip_learning_phase: budget.skipLearningPhase,
      // Phase 1 fix: identity_type/identity_id/identity_authorized_bc_id
      // belong on the creative only (see ads[].creatives[] below), not on the
      // ad group. Removed from ad-group level to avoid duplicate/rejected fields.
      schedule_start_time: toApiDateTime(budget.startDate),
      ...(budget.endDate && !budget.endDateOptional && { schedule_end_time: toApiDateTime(budget.endDate, true) }),
      // Dayparting — when CUSTOM, emit schedule_type=SCHEDULE_CUSTOMIZE +
      // the 168-char dayparting binary mask. ALL_DAY relies on TikTok's
      // default schedule (start/end inclusive, no hour restriction).
      ...(budget.scheduleType === "CUSTOM" && budget.dayparting && {
        schedule_type: "SCHEDULE_CUSTOMIZE",
        dayparting: budget.dayparting,
      }),
      // Phase 3 fix: pixel_id gate now also excludes TRAFFIC with CLICK goal.
      // Pixel is only relevant for TRAFFIC when optimizing for Landing Page
      // View; click-optimization Traffic campaigns don't use a pixel.
      ...(!isReach && !isVideoViews && !isAppPromo
        && !(isTraffic && budget.optimizationGoal !== "LANDING_PAGE_VIEW")
        && !(isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM")
        && {
        pixel_id: resolvedPixelId || "<PIXEL_ID>",
      }),
      // Phase 2 fix: catalog block reshape.
      //  - product_specific_ids was not a real field → use sku_ids (TikTok's
      //    documented per-SKU targeting field for catalog ads).
      //  - Catalog Listing Ads (CLA) require product_set_id ALWAYS (even in
      //    "ALL products" mode). When mode=ALL, fall back to a placeholder that
      //    the submit-path resolver fills with the merchant's default set.
      //  - dynamic_format moves to the creative level (see ads[] below).
      ...(objective.catalogEnabled && {
        shopping_ads_type: objective.shoppingAdsType,
        catalog_id: resolvedCatalogId,
        ...((objective.productSelectionMode === "PRODUCT_SET" && objective.productSetId)
          && { product_set_id: objective.productSetId }),
        ...(isCatalogListing && objective.productSelectionMode !== "PRODUCT_SET"
          && { product_set_id: objective.productSetId || "<DEFAULT_PRODUCT_SET_ID>" }),
        ...(objective.productSelectionMode === "SPECIFIC" && objective.specificProductIds.length > 0 && {
          sku_ids: objective.specificProductIds,
        }),
      }),
      location_ids: audience.locationIds,
      // Age groups + interest fields — suppressed in BOTH Smart+ Sales
      // (TikTok auto-targets these) AND Search Ads mode (keywords replace
      // demographics). Available in classic non-Smart+ Sales and other
      // objectives.
      ...(!(smartPlusEnabled && isSales) && !searchAdsOn
        && { age_groups: toTikTokAgeGroups(audience.ageMin, audience.ageMax) }),
      gender: audience.gender,
      languages: audience.languages,
      // Interest-based targeting — suppressed in Smart+ Sales (not in the
      // Smart+ Web API scope) and in Search Ads mode (keywords replace).
      ...(!searchAdsOn && !(smartPlusEnabled && isSales) && hasNonMockInterests
        && { interest_category_ids: audience.interests }),
      ...(!searchAdsOn && !(smartPlusEnabled && isSales) && audience.purchaseIntentKeywordIds?.length > 0
        ? { purchase_intention_keyword_ids: audience.purchaseIntentKeywordIds }
        : !searchAdsOn && !(smartPlusEnabled && isSales) && audience.interestKeywordIds?.length > 0
          ? { interest_keyword_ids: audience.interestKeywordIds }
          : {}),
      // OS targeting — suppressed in Smart+ Sales (not in the Smart+ Web
      // API scope per TikTok docs). Available in classic / non-Sales.
      ...(!(smartPlusEnabled && isSales) && audience.operatingSystems.length > 0
        && { operating_systems: audience.operatingSystems }),
      // Search Ads — search_result_enabled + search_keywords[] on the ad
      // group. Without these two, the campaign delivers in-feed instead.
      ...((searchAdsOn || budget.searchResultEnabled) && { search_result_enabled: true }),
      ...(searchAdsOn && objective.searchKeywords?.length > 0 && {
        search_keywords: objective.searchKeywords.map((k) => ({
          keyword: k.keyword,
          match_type: k.matchType,
          is_negative: k.isExclusion,
          ...(k.bid !== undefined && { keyword_bid: k.bid, keyword_bid_type: "CUSTOM" }),
        })),
      }),
      ...(creative.brandSafetyType && creative.brandSafetyType !== "NO_BRAND_SAFETY" && {
        brand_safety_type: creative.brandSafetyType,
      }),
      ...(creative.contentControls?.commentDisabled && { comment_disabled: true }),
      ...(creative.contentControls?.shareDisabled && { share_disabled: true }),
      ...(creative.contentControls?.videoDownloadDisabled && { video_download_disabled: true }),
    },
    // Phase 4 fix: the inline instant_form {...} object was never a real API
    // shape. Instant Forms must be created separately via POST
    // /page/lead_gen/create/ (see app/api/tiktok/lead-form/route.ts — TODO)
    // which returns a page_id. That page_id is then referenced on the ad
    // group (see adgroup.page_id above).
    // CLA creative payload (Catalog Listing Ads).
    // TikTok auto-generates the *visual* (video/carousel composed from catalog
    // items), but the *caption* (ad_text), display_name, and call_to_action
    // are merchant-provided text fields. landing_page_url is NOT sent — every
    // product card pulls its URL from the catalog feed's `link` column.
    ads: isCatalogListing
      ? (() => {
          const claAd = creative.ads[0]; // single auto-ad created upstream
          if (!claAd) return [];
          const resolvedIdentityType = creative.identity?.identityType ?? "BC_AUTH_TT";
          return [{
            advertiser_id: advertiserId,
            adgroup_id: adgroupId,
            request_id: generateRequestId(reqIdSeed && `ad_cla_${reqIdSeed}`),
            creatives: [{
              ad_name: claAd.name,
              // CATALOG_LISTING_ADS is the ad_format marker for CLA creatives.
              ad_format: "CATALOG_LISTING_ADS",
              identity_type: resolvedIdentityType,
              identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
              ...(resolvedIdentityType === "BC_AUTH_TT" && {
                identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
              }),
              // Required merchant-provided text.
              ad_text: (claAd.adText || "").slice(0, 100),
              display_name: (claAd.displayName || creative.identity?.displayName || "").slice(0, 20),
              call_to_action: claAd.callToAction,
              // No landing_page_url — destinations come from catalog feed.
            }],
          }];
        })()
      : creative.ads.map((ad) => {
        /* Phase 1 fix: resolve ad_format + identity per-ad.
         * Spark Ads:
         *   - ad_format is SINGLE_VIDEO (CUSTOMIZED_USER is an identity_type, not an ad_format).
         *   - identity_type flips to AUTH_CODE (creator auth-code flow) or TT_USER
         *     (owned post promoted via BC), overriding campaign-level identity.
         * Non-catalog carousels use CAROUSEL; CAROUSEL_ADS is reserved for catalog/VSA. */
        const isSpark = ad.sparkAdEnabled;
        const sparkIdentityType: "AUTH_CODE" | "TT_USER" = ad.sparkAdAuthCode ? "AUTH_CODE" : "TT_USER";
        const resolvedIdentityType = isSpark
          ? sparkIdentityType
          : (creative.identity?.identityType ?? "BC_AUTH_TT");
        const adFormat = isSpark
          ? "SINGLE_VIDEO"
          : ad.adFormat === "CAROUSEL"
            ? (objective.catalogEnabled ? "CAROUSEL_ADS" : "CAROUSEL")
            : ad.adFormat;

        return {
          advertiser_id: advertiserId,
          adgroup_id: adgroupId,
          request_id: generateRequestId(reqIdSeed && `ad_${ad.id}_${reqIdSeed}`),
          creatives: [{
            ad_name: ad.name,
            ad_format: adFormat,
            identity_type: resolvedIdentityType,
            identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
            // BC link is required only for BC_AUTH_TT identity — Spark AUTH_CODE/TT_USER
            // carry their own authorization path (auth_code / linked BC post respectively).
            ...(resolvedIdentityType === "BC_AUTH_TT" && {
              identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
            }),
            ...(isSpark && ad.sparkAdAuthCode && { auth_code: ad.sparkAdAuthCode }),
            ...(creative.identity?.avatarPreviewUrl && { avatar_icon_web_uri: "<UPLOADED_AVATAR_URI>" }),
            ...(isSpark
              ? { tiktok_item_id: `<RESOLVED_ITEM_ID:${ad.sparkAdAuthCode || "pending"}>` }
              : {
                  ad_text: (ad.adText || "").slice(0, 100),
                  // Smart+ multi-caption A/B: collect non-empty variations
                  // into ad_texts. TikTok rotates through them per impression
                  // and picks the highest-performing one.
                  ...(ad.adTextVariations && ad.adTextVariations.filter((v) => v.trim()).length > 0 && {
                    ad_texts: [
                      (ad.adText || "").slice(0, 100),
                      ...ad.adTextVariations.filter((v) => v.trim()).map((v) => v.slice(0, 100)),
                    ],
                  }),
                  display_name: (ad.displayName || creative.identity?.displayName || "").slice(0, 20),
                  call_to_action: ad.callToAction,
                  // Phase 5 fix: App Promotion creatives derive the destination
                  // from app_id (set on the ad group), not landing_page_url.
                  ...(ad.landingPageUrl && !isAppPromo && { landing_page_url: ad.landingPageUrl }),
                  // Only-show-as-ads (default true). Maps to API show_only_as_ads.
                  ...(ad.onlyShowAsAds !== false && { show_only_as_ads: true }),
                }),
            ...(ad.adFormat === "SINGLE_VIDEO" && !isSpark && ad.assets.length > 0 && { video_id: ad.assets[0].mediaId || "<VIDEO_ID>" }),
            ...(ad.adFormat === "SINGLE_IMAGE" && ad.assets.length > 0 && { image_ids: [ad.assets[0].mediaId || "<IMAGE_ID>"] }),
            ...(ad.adFormat === "CAROUSEL" && ad.carouselCards.length > 0 && {
              image_ids: ad.carouselCards.map((_, i) => `<IMAGE_ID_${i + 1}>`),
            }),
            ...((ad.musicId || ad.musicFile) && {
              music_id: ad.musicId || "<UPLOADED_MUSIC_ID>",
            }),
            promotional_music_disabled:
              ad.adFormat === "CAROUSEL"
                ? false
                : ad.promotionalMusicDisabled === true,
            ...(isSpark && ad.sparkDuetStatus && { item_duet_status: ad.sparkDuetStatus }),
            ...(isSpark && ad.sparkStitchStatus && { item_stitch_status: ad.sparkStitchStatus }),
            ...(ad.deeplink && { deeplink: ad.deeplink, deeplink_type: ad.deeplinkType || "NORMAL" }),
            ...(ad.aigcDisclosureType && ad.aigcDisclosureType !== "NOT_DECLARED" && { aigc_disclosure_type: ad.aigcDisclosureType }),
            // Phase 2 fix: dynamic_format is a creative-level field, not adgroup.
            // Emitted for Video Shopping Ads when the dynamic-creative toggle is on.
            ...(objective.catalogEnabled && objective.dynamicFormat && !isCatalogListing
              && { dynamic_format: "DYNAMIC_CREATIVE" }),
            ...(ad.instantProductPageUsed && { instant_product_page_used: true }),
          }],
        };
      }),
  };

  if (opts.mode === "submit") {
    assertNoPlaceholders(payload);
  }

  return payload;
}

/* ------------------------------------------------------------------ */
/*  Placeholder leak detection                                        */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_PATTERN = /^<[A-Z_][A-Z0-9_]*(:.*)?>$/;

function assertNoPlaceholders(value: unknown, path = ""): void {
  if (typeof value === "string") {
    if (PLACEHOLDER_PATTERN.test(value)) {
      throw new PlaceholderLeakError(path || "<root>");
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoPlaceholders(item, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      assertNoPlaceholders(v, path ? `${path}.${k}` : k);
    }
  }
}
