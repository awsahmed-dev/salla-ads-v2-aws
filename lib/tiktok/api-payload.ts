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
import { getSalesScenario, InvalidScenarioError, type SalesScenario } from "./scenario";

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
   *  classic /open_api/v1.3/campaign/create/. Stripped before sending.
   *  "blocked" indicates Scenario D — the submit layer must refuse. */
  _endpoint?: "classic" | "smart_plus" | "blocked";
  /** Scenario code (A/B/C/D) for the Sales matrix. Always emitted so the
   *  review/JSON panel can label the active flow. Stripped before sending. */
  _scenario?: SalesScenario;
  /** Present only in Scenario D: a structured reason for why the payload
   *  cannot be submitted. The UI surfaces this to the merchant. */
  _error?: { code: "INVALID_SCENARIO_D"; reason: string };
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

  // ── Sales scenario matrix ───────────────────────────────────────────
  // The Catalog and Search-Ads toggles control which endpoint family we
  // hit. See `lib/tiktok/scenario.ts` for the full A/B/C/D table.
  //   A = Smart+ default (both toggles off)
  //   B = Smart+ Catalog (catalog on, search off)  — same endpoint, +catalog fields
  //   C = Classic Search Ads (catalog off, search on) — DROPS Smart+
  //   D = both on — BLOCKED. We emit an _error payload and refuse submit.
  const scenario = getSalesScenario(campaign);
  const sp = objective.smartPlus;
  const searchAdsOn = scenario.isClassicSearch;
  // Smart+ is active for Sales scenarios A/B, plus LeadGen and AppPromo.
  // Scenario C and D never use Smart+.
  const smartPlusEnabled = !scenario.isBlocked
    && sp.enabled
    && (isLeadGen || isAppPromo || (isSales && !scenario.isClassicSearch));

  // Scenario D — hard block. In submit mode we throw; in preview mode we
  // return a minimal payload tagged with `_error` so the review panel can
  // render the blocker UI without crashing.
  if (scenario.isBlocked) {
    if (opts.mode === "submit") {
      throw new InvalidScenarioError("D", scenario.blockReason ?? "Catalog + Search Ads combination is not supported by TikTok.");
    }
    return {
      _endpoint: "blocked",
      _scenario: "D",
      _error: {
        code: "INVALID_SCENARIO_D",
        reason: scenario.blockReason ?? "Catalog + Search Ads combination is not supported by TikTok.",
      },
      campaign: {},
      adgroup: {},
      ads: [],
    };
  }

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
    _scenario: scenario.code,
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
    adgroup: smartPlusEnabled ? buildSmartPlusAdgroup({
      advertiserId,
      campaignId,
      adgroupRequestId,
      objective,
      audience,
      budget,
      creative,
      isSales,
      isLeadGen,
      isAppPromo,
      isCatalogListing,
      resolvedPixelId,
      resolvedCatalogId,
    }) : {
      advertiser_id: advertiserId,
      campaign_id: campaignId,
      adgroup_name: `${objective.campaignName} - Ad Group`,
      request_id: adgroupRequestId,                  // REQUIRED per spec
      ...(isSales && { promotion_type: objective.catalogEnabled ? "CATALOG" : "WEBSITE" }),
      // Scenario-driven placement_type:
      //   C (Classic Search Ads) → PLACEMENT_SEARCH  — isolates delivery to
      //     the TikTok Search Result Page. No mixed feed/search delivery.
      //   non-Sales              → merchant-chosen placement_type
      //   default Sales (A path falling back to classic, very rare) →
      //     PLACEMENT_TYPE_NORMAL with PLACEMENT_TIKTOK
      placement_type: scenario.isClassicSearch
        ? "PLACEMENT_SEARCH"
        : isSales
          ? "PLACEMENT_TYPE_NORMAL"
          : creative.placementType,
      // Scenario C does not emit `placements[]` — search delivery is
      // implicit in PLACEMENT_SEARCH. Smart+ Web defaults to TikTok-only.
      ...(!scenario.isClassicSearch && isSales && { placements: ["PLACEMENT_TIKTOK"] }),
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
      // Scenario B (Smart+ Catalog) injects the catalog array. Always
      // emits product_source so TikTok knows the visuals come from the
      // merchant's feed, not from uploaded videos.
      ...(objective.catalogEnabled && {
        shopping_ads_type: objective.shoppingAdsType,
        catalog_id: resolvedCatalogId,
        product_source: "CATALOG",
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
      // ── Scenario C: classic Search Ads keywords ───────────────────
      // Per TikTok docs the search ad-group body splits keyword targeting
      // into two arrays:
      //   keywords[]          — positive targeting list (BROAD/PHRASE/EXACT)
      //   negative_keywords[] — exclusion list (always treated as EXACT
      //                         negatives at delivery time)
      // The merchant enters everything through one UI table (with an
      // is-negative flag per row); we split at the payload boundary.
      ...(scenario.isClassicSearch && (() => {
        const all = objective.searchKeywords ?? [];
        const positives = all.filter((k) => !k.isExclusion);
        const negatives = all.filter((k) => k.isExclusion);
        return {
          ...(positives.length > 0 && {
            keywords: positives.map((k) => ({
              keyword: k.keyword,
              match_type: k.matchType,
              ...(k.bid !== undefined && { keyword_bid: k.bid, keyword_bid_type: "CUSTOM" }),
            })),
          }),
          ...(negatives.length > 0 && {
            negative_keywords: negatives.map((k) => ({
              keyword: k.keyword,
              // Negatives default to EXACT match unless merchant overrode.
              match_type: k.matchType || "EXACT",
            })),
          }),
        };
      })()),
      // Legacy `search_result_enabled` opt-in for the in-feed-with-search
      // hybrid (only meaningful when NOT in Scenario C). Kept for backwards
      // compat with non-Sales objectives that still use the boolean toggle.
      ...(!scenario.isClassicSearch && budget.searchResultEnabled && { search_result_enabled: true }),
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
    ads: smartPlusEnabled
      ? buildSmartPlusAds({
          advertiserId,
          adgroupId,
          creative,
          objective,
          isAppPromo,
          isCatalogListing,
          reqIdSeed,
        })
      : isCatalogListing
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
/*  Smart+ Ad-group builder                                           */
/* ------------------------------------------------------------------ */
/* TikTok Smart+ adgroup body (SmartPlusAdgroupCreateBody):
 * - All targeting fields move into a nested `targeting_spec` object.
 * - Required: adgroup_name, advertiser_id, billing_event, campaign_id,
 *   optimization_goal, promotion_type, request_id, schedule_start_time,
 *   schedule_type, targeting_spec.
 * - Smart+ Web does NOT expose: interest_*, purchase_intention_keyword_ids,
 *   operating_systems, age_groups (TikTok auto-targets these). We still
 *   forward audience signal IDs when the merchant supplied non-mock values,
 *   so the underlying targeting_spec stays expressive for LeadGen/AppPromo. */

interface SmartPlusAdgroupArgs {
  advertiserId: string;
  campaignId: string;
  adgroupRequestId: string;
  objective: TikTokCampaignData["objective"];
  audience: TikTokCampaignData["audience"];
  budget: TikTokCampaignData["budget"];
  creative: TikTokCampaignData["creative"];
  isSales: boolean;
  isLeadGen: boolean;
  isAppPromo: boolean;
  isCatalogListing: boolean;
  resolvedPixelId: string;
  resolvedCatalogId: string;
}

function buildSmartPlusAdgroup(args: SmartPlusAdgroupArgs): Record<string, unknown> {
  const {
    advertiserId, campaignId, adgroupRequestId,
    objective, audience, budget, creative,
    isSales, isLeadGen, isAppPromo, isCatalogListing,
    resolvedPixelId, resolvedCatalogId,
  } = args;

  const hasNonMockInterests =
    audience.interests.length > 0 && !audience.interests.every((id) => id.startsWith("TT_"));

  // Smart+ keeps top-level targeting minimal — only ID fields TikTok cannot
  // infer automatically (geos, languages, gender, custom audiences, salla
  // lookalikes). Age/interest/OS are dropped for Sales, kept for LeadGen/AppPromo.
  const targeting_spec: Record<string, unknown> = {
    location_ids: audience.locationIds,
    ...(audience.gender && audience.gender !== "GENDER_UNLIMITED" && { gender: audience.gender }),
    ...(audience.languages?.length > 0 && { languages: audience.languages }),
    // LeadGen + AppPromo benefit from age/interest/OS; Smart+ Sales does not.
    ...(!isSales && { age_groups: toTikTokAgeGroups(audience.ageMin, audience.ageMax) }),
    ...(!isSales && hasNonMockInterests && { interest_category_ids: audience.interests }),
    ...(!isSales && audience.interestKeywordIds?.length > 0
      && { interest_keyword_ids: audience.interestKeywordIds }),
    ...(!isSales && audience.purchaseIntentKeywordIds?.length > 0
      && { purchase_intention_keyword_ids: audience.purchaseIntentKeywordIds }),
    ...(!isSales && audience.operatingSystems?.length > 0
      && { operating_systems: audience.operatingSystems }),
    // Salla-side audience signals (lookalike, custom, exclusions).
    ...(audience.customAudienceIds?.length > 0 && { audience_ids: audience.customAudienceIds }),
    ...(audience.excludedAudienceIds?.length > 0 && { excluded_audience_ids: audience.excludedAudienceIds }),
    // Smart+ "discover beyond" toggles — keep enabled by default so TikTok's
    // automation can broaden delivery once it has signal.
    smart_audience_enabled: true,
    smart_interest_behavior_enabled: true,
  };

  return {
    advertiser_id: advertiserId,
    campaign_id: campaignId,
    adgroup_name: `${objective.campaignName} - Ad Group`,
    request_id: adgroupRequestId,
    promotion_type: isAppPromo
      ? objective.appSettings.appPlatform
      : isLeadGen
      ? "LEAD_GENERATION"
      : objective.catalogEnabled ? "CATALOG" : "WEBSITE",
    placement_type: "PLACEMENT_TYPE_NORMAL",
    placements: ["PLACEMENT_TIKTOK"],
    budget_mode: budget.budgetMode,
    budget: budget.budgetMode === "BUDGET_MODE_TOTAL" ? budget.lifetimeAmount : budget.amount,
    optimization_goal: GOAL_TO_API[budget.optimizationGoal] || budget.optimizationGoal,
    ...(isSales
      && (budget.optimizationGoal === "CONVERSION" || budget.optimizationGoal === "VALUE")
      && { optimization_event: EVENT_TO_API[budget.optimizationEvent] || budget.optimizationEvent }),
    ...(isAppPromo && {
      app_id: objective.appSettings.appId || "<APP_ID>",
      app_type: objective.appSettings.appPlatform,
    }),
    ...(isAppPromo && budget.optimizationGoal === "IN_APP_EVENT" && {
      app_event_id: objective.appSettings.appEventId || "<APP_EVENT_ID>",
      deep_external_action: objective.appSettings.deepExternalAction || "<DEEP_EVENT_CATEGORY>",
    }),
    billing_event: budget.billingEvent,
    bid_type: budget.bidType,
    ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "CONVERSION" && { conversion_bid_price: budget.bidAmount }),
    ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "LEAD_GENERATION" && { conversion_bid_price: budget.bidAmount }),
    ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "INSTALL" || budget.optimizationGoal === "IN_APP_EVENT") && { conversion_bid_price: budget.bidAmount }),
    ...(isLeadGen && { optimization_event: "FORM" }),
    ...(isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM" && {
      page_id: objective.instantForm.pageId || "<LEAD_FORM_PAGE_ID>",
    }),
    ...(budget.optimizationGoal === "VALUE" && {
      deep_bid_type: budget.deepBidType,
      roas_bid: Number(budget.roasBid) || 1,
      ...(isSales && { deep_external_action: EVENT_TO_API[budget.optimizationEvent] || budget.optimizationEvent }),
      ...(isAppPromo && { deep_external_action: objective.appSettings.deepExternalAction || "<DEEP_EVENT_CATEGORY>" }),
    }),
    ...((isSales || isAppPromo) && {
      click_attribution_window: Number(budget.clickAttributionWindow),
      view_attribution_window: Number(budget.viewAttributionWindow),
    }),
    ...(isAppPromo && { engaged_view_attribution_window: 7 }),
    pacing: budget.pacing,
    skip_learning_phase: budget.skipLearningPhase,
    schedule_start_time: toApiDateTime(budget.startDate),
    ...(budget.endDate && !budget.endDateOptional && { schedule_end_time: toApiDateTime(budget.endDate, true) }),
    schedule_type: budget.scheduleType === "CUSTOM" ? "SCHEDULE_CUSTOMIZE" : "SCHEDULE_FROM_NOW",
    ...(budget.scheduleType === "CUSTOM" && budget.dayparting && { dayparting: budget.dayparting }),
    ...(!isAppPromo && !(isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM") && {
      pixel_id: resolvedPixelId || "<PIXEL_ID>",
    }),
    // ── Scenario B (Smart+ Catalog) — dynamic-feed routing ─────────────
    // product_source="CATALOG" tells TikTok the visual comes from the
    // merchant's feed (carousel cards auto-rendered per product) — NOT
    // from uploaded videos. The creative-step UI mirrors this by hiding
    // the standard video uploader when catalog is on.
    ...(objective.catalogEnabled && {
      shopping_ads_type: objective.shoppingAdsType,
      catalog_id: resolvedCatalogId,
      product_source: "CATALOG",
      ...((objective.productSelectionMode === "PRODUCT_SET" && objective.productSetId)
        && { product_set_id: objective.productSetId }),
      ...(isCatalogListing && objective.productSelectionMode !== "PRODUCT_SET"
        && { product_set_id: objective.productSetId || "<DEFAULT_PRODUCT_SET_ID>" }),
      ...(objective.productSelectionMode === "SPECIFIC" && objective.specificProductIds.length > 0 && {
        sku_ids: objective.specificProductIds,
      }),
    }),
    targeting_spec,
    ...(creative.brandSafetyType && creative.brandSafetyType !== "NO_BRAND_SAFETY" && {
      brand_safety_type: creative.brandSafetyType,
    }),
    ...(creative.contentControls?.commentDisabled && { comment_disabled: true }),
    ...(creative.contentControls?.shareDisabled && { share_disabled: true }),
    ...(creative.contentControls?.videoDownloadDisabled && { video_download_disabled: true }),
  };
}

/* ------------------------------------------------------------------ */
/*  Smart+ Ad builder (multi-axis list shape)                         */
/* ------------------------------------------------------------------ */
/* SmartPlusAdCreateBody emits ONE ad per Smart+ ad group, but every
 * creative axis becomes a list:
 *   - creative_list[]            : multi-video / multi-image
 *   - ad_text_list[]             : multi-caption A/B
 *   - call_to_action_list[]      : multi-CTA A/B
 *   - landing_page_url_list[]    : multi-LP A/B
 *   - ad_configuration           : pixel/utm/catalog
 * TikTok auto-rotates across the lists and biases toward the highest-CVR
 * combination per impression. */

interface SmartPlusAdsArgs {
  advertiserId: string;
  adgroupId: string;
  creative: TikTokCampaignData["creative"];
  objective: TikTokCampaignData["objective"];
  isAppPromo: boolean;
  isCatalogListing: boolean;
  reqIdSeed?: string;
}

function buildSmartPlusAds(args: SmartPlusAdsArgs): Array<Record<string, unknown>> {
  const { advertiserId, adgroupId, creative, objective, isAppPromo, isCatalogListing, reqIdSeed } = args;

  // Smart+ collapses every ad into ONE request — the multi-axis lists carry
  // what the merchant entered as separate "ad rows" in the UI.
  const ads = creative.ads;
  if (ads.length === 0) return [];

  const adTexts = new Set<string>();
  const ctas = new Set<string>();
  const lps = new Set<string>();
  const deeplinks = new Set<string>();
  const creativeList: Array<Record<string, unknown>> = [];

  ads.forEach((ad, adIdx) => {
    const isSpark = ad.sparkAdEnabled;
    const sparkIdentityType: "AUTH_CODE" | "TT_USER" = ad.sparkAdAuthCode ? "AUTH_CODE" : "TT_USER";
    const resolvedIdentityType = isSpark
      ? sparkIdentityType
      : (creative.identity?.identityType ?? "BC_AUTH_TT");

    // ad_text_list: include primary + each variation.
    if (ad.adText) adTexts.add(ad.adText.slice(0, 100));
    (ad.adTextVariations || []).forEach((v) => {
      const trimmed = (v || "").trim();
      if (trimmed) adTexts.add(trimmed.slice(0, 100));
    });
    if (ad.callToAction) ctas.add(ad.callToAction);
    if (ad.landingPageUrl && !isAppPromo) lps.add(ad.landingPageUrl);
    if (ad.deeplink) deeplinks.add(ad.deeplink);

    // creative_list: one entry per uploaded asset on this ad, enabling
    // true multi-video uploads per Smart+ spec.
    const assets = ad.assets || [];
    const adFormat = isCatalogListing
      ? "CATALOG_LISTING_ADS"
      : isSpark
        ? "SINGLE_VIDEO"
        : ad.adFormat === "CAROUSEL"
          ? (objective.catalogEnabled ? "CAROUSEL_ADS" : "CAROUSEL")
          : ad.adFormat;

    if (isCatalogListing) {
      // Catalog Listing Ads — visual is auto-generated from catalog feed.
      creativeList.push({
        creative_info: {
          ad_name: ad.name,
          ad_format: adFormat,
          identity_type: resolvedIdentityType,
          identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
          ...(resolvedIdentityType === "BC_AUTH_TT" && {
            identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
          }),
          display_name: (ad.displayName || creative.identity?.displayName || "").slice(0, 20),
        },
      });
    } else if (isSpark) {
      // Smart+ multi-Spark — one creative_list[] entry per linked TikTok
      // post. Prefer the multi-code array; fall back to the single legacy
      // field for backwards-compat. Each entry carries its own
      // tiktok_item_id which TikTok resolves from the auth_code.
      const codes = (ad.sparkAuthCodes && ad.sparkAuthCodes.filter((c) => c.trim()).length > 0)
        ? ad.sparkAuthCodes.filter((c) => c.trim())
        : (ad.sparkAdAuthCode ? [ad.sparkAdAuthCode] : [""]);
      codes.forEach((code, sIdx) => {
        creativeList.push({
          creative_info: {
            ad_name: codes.length > 1 ? `${ad.name} - S${sIdx + 1}` : ad.name,
            ad_format: "SINGLE_VIDEO",
            identity_type: resolvedIdentityType,
            identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
            ...(resolvedIdentityType === "BC_AUTH_TT" && {
              identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
            }),
            ...(code && { auth_code: code }),
            tiktok_item_id: `<RESOLVED_ITEM_ID:${code || `pending_${adIdx}_${sIdx}`}>`,
            ...(ad.sparkDuetStatus && { item_duet_status: ad.sparkDuetStatus }),
            ...(ad.sparkStitchStatus && { item_stitch_status: ad.sparkStitchStatus }),
            ...(ad.aigcDisclosureType && ad.aigcDisclosureType !== "NOT_DECLARED"
              && { aigc_disclosure_type: ad.aigcDisclosureType }),
          },
        });
      });
    } else if (ad.adFormat === "SINGLE_VIDEO") {
      // Emit one creative entry per uploaded video asset — native Smart+
      // multi-video path per SmartPlusAdCreateBodyCreativeInfo.
      const videoAssets = assets.length > 0 ? assets : [{ mediaId: "", coverImageUrl: "" } as { mediaId: string; coverImageUrl?: string; fileName?: string }];
      videoAssets.forEach((asset, vIdx) => {
        creativeList.push({
          creative_info: {
            ad_name: assets.length > 1 ? `${ad.name} - V${vIdx + 1}` : ad.name,
            ad_format: "SINGLE_VIDEO",
            identity_type: resolvedIdentityType,
            identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
            ...(resolvedIdentityType === "BC_AUTH_TT" && {
              identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
            }),
            video_info: {
              video_id: (asset as { mediaId?: string }).mediaId || "<VIDEO_ID>",
              ...((asset as { fileName?: string }).fileName && { file_name: (asset as { fileName?: string }).fileName }),
            },
            ...((ad.musicId || ad.musicFile) && {
              music_info: { music_id: ad.musicId || "<UPLOADED_MUSIC_ID>" },
            }),
            ...(ad.aigcDisclosureType && ad.aigcDisclosureType !== "NOT_DECLARED"
              && { aigc_disclosure_type: ad.aigcDisclosureType }),
          },
        });
      });
    } else if (ad.adFormat === "SINGLE_IMAGE") {
      const imageAssets = assets.length > 0 ? assets : [{ mediaId: "" }];
      imageAssets.forEach((asset, iIdx) => {
        creativeList.push({
          creative_info: {
            ad_name: assets.length > 1 ? `${ad.name} - I${iIdx + 1}` : ad.name,
            ad_format: "SINGLE_IMAGE",
            identity_type: resolvedIdentityType,
            identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
            ...(resolvedIdentityType === "BC_AUTH_TT" && {
              identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
            }),
            image_info: [{ image_id: (asset as { mediaId?: string }).mediaId || "<IMAGE_ID>" }],
          },
        });
      });
    } else if (ad.adFormat === "CAROUSEL") {
      creativeList.push({
        creative_info: {
          ad_name: ad.name,
          ad_format: adFormat,
          identity_type: resolvedIdentityType,
          identity_id: creative.identity?.identityId || "<IDENTITY_ID>",
          ...(resolvedIdentityType === "BC_AUTH_TT" && {
            identity_authorized_bc_id: creative.identity?.businessCenterId || "<BC_ID>",
          }),
          image_info: (ad.carouselCards || []).map((_, i) => ({ image_id: `<IMAGE_ID_${i + 1}>` })),
        },
      });
    }
  });

  // ad_configuration — one shared object covering tracking + catalog routing.
  const firstAd = ads[0];
  const ad_configuration: Record<string, unknown> = {
    ...(objective.catalogEnabled && objective.productSelectionMode === "SPECIFIC" && objective.specificProductIds?.length > 0
      && { product_ids: objective.specificProductIds }),
    ...(objective.catalogEnabled && objective.productSetId
      && { product_set_id: objective.productSetId }),
    ...(objective.catalogEnabled && objective.dynamicFormat && !isCatalogListing
      && { catalog_creative_toggle: "DYNAMIC" }),
    ...(firstAd.onlyShowAsAds !== false && { dark_post_status: "ON" }),
  };

  return [{
    advertiser_id: advertiserId,
    adgroup_id: adgroupId,
    request_id: generateRequestId(reqIdSeed && `ad_sp_${reqIdSeed}`),
    creative_list: creativeList,
    ad_text_list: Array.from(adTexts).map((t) => ({ ad_text: t })),
    call_to_action_list: Array.from(ctas).map((c) => ({ call_to_action: c })),
    ...(lps.size > 0 && {
      landing_page_url_list: Array.from(lps).map((u) => ({ landing_page_url: u })),
    }),
    ...(deeplinks.size > 0 && {
      deeplink_list: Array.from(deeplinks).map((d) => ({ deeplink: d, deeplink_type: firstAd.deeplinkType || "NORMAL" })),
    }),
    ...(Object.keys(ad_configuration).length > 0 && { ad_configuration }),
  }];
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
