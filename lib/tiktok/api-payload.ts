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
  SHOW: "SHOW",
  VIDEO_VIEW: "VIDEO_VIEW",
  FOCUSED_VIEW: "FOCUSED_VIEW",
  LEAD_GENERATION: "LEAD_GENERATION",
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

  // Phase 2 fix: for catalog sales, catalog_id is required at the campaign level
  // (matching promotion_type=CATALOG). Also emitted on the ad group below.
  const campaignCatalogField =
    isSales && objective.catalogEnabled ? { catalog_id: resolvedCatalogId } : {};

  const payload: TikTokApiPayload = {
    campaign: {
      advertiser_id: advertiserId,
      campaign_name: objective.campaignName,
      objective_type: objective.objective,
      ...(isSales && { promotion_type: objective.catalogEnabled ? "CATALOG" : "WEBSITE" }),
      ...campaignCatalogField,
      operation_status: "ENABLE",
    },
    adgroup: {
      advertiser_id: advertiserId,
      campaign_id: campaignId,
      adgroup_name: `${objective.campaignName} - Ad Group`,
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
      ...(isAppPromo && {
        app_id: objective.appSettings.appId || "<APP_ID>",
        app_type: objective.appSettings.appPlatform,
        promotion_type: objective.appSettings.appPromotionType,
        app_download_url: objective.appSettings.appDownloadUrl || "<APP_DOWNLOAD_URL>",
      }),
      billing_event: budget.billingEvent,
      bid_type: budget.bidType,
      ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "CONVERSION" && { conversion_bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "VIDEO_VIEW" || budget.optimizationGoal === "FOCUSED_VIEW") && { bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal === "LEAD_GENERATION" && { conversion_bid_price: budget.bidAmount }),
      ...(budget.bidType === "BID_TYPE_CUSTOM" && (budget.optimizationGoal === "INSTALL" || budget.optimizationGoal === "IN_APP_EVENT") && { conversion_bid_price: budget.bidAmount }),
      ...(isLeadGen && { optimization_location: objective.leadOptimizationLocation }),
      ...(isLeadGen && objective.leadOptimizationLocation === "WEBSITE" && { optimization_event: "SubmitForm" }),
      // Phase 2 fix: VBO (Value Optimization) requires deep_external_action —
      // the deep event whose value is optimized. Previously only deep_bid_type
      // and roas_bid were emitted, so Sales VBO campaigns rejected.
      ...(budget.optimizationGoal === "VALUE" && {
        deep_bid_type: budget.deepBidType,
        roas_bid: Number(budget.roasBid) || 1,
        ...(isSales && { deep_external_action: EVENT_TO_API[budget.optimizationEvent] || budget.optimizationEvent }),
      }),
      ...(isSales && {
        click_attribution_window: Number(budget.clickAttributionWindow),
        view_attribution_window: Number(budget.viewAttributionWindow),
      }),
      ...(isVideoViews && { engaged_view_attribution_window: 7 }),
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
      ...(!isReach && !isVideoViews && !isAppPromo
        && !(isTraffic && objective.pixelMode === "none")
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
      age_groups: toTikTokAgeGroups(audience.ageMin, audience.ageMax),
      gender: audience.gender,
      languages: audience.languages,
      ...(hasNonMockInterests && { interest_category_ids: audience.interests }),
      ...(audience.purchaseIntentKeywordIds?.length > 0
        ? { purchase_intention_keyword_ids: audience.purchaseIntentKeywordIds }
        : audience.interestKeywordIds?.length > 0
          ? { interest_keyword_ids: audience.interestKeywordIds }
          : {}),
      ...(audience.operatingSystems.length > 0 && { operating_systems: audience.operatingSystems }),
      ...(budget.searchResultEnabled && { search_result_enabled: true }),
      ...(creative.brandSafetyType && creative.brandSafetyType !== "NO_BRAND_SAFETY" && {
        brand_safety_type: creative.brandSafetyType,
      }),
      ...(creative.contentControls?.commentDisabled && { comment_disabled: true }),
      ...(creative.contentControls?.shareDisabled && { share_disabled: true }),
      ...(creative.contentControls?.videoDownloadDisabled && { video_download_disabled: true }),
    },
    ...(isLeadGen && objective.leadOptimizationLocation === "INSTANT_FORM" && {
      instant_form: {
        form_name: objective.instantForm.formName || `${objective.campaignName} - Lead Form`,
        form_type: objective.instantForm.formType,
        form_template: objective.instantForm.formTemplate,
        ...(objective.instantForm.headline && { headline: objective.instantForm.headline }),
        ...(objective.instantForm.description && { description: objective.instantForm.description }),
        personal_info_fields: objective.instantForm.personalInfoFields,
        custom_questions: objective.instantForm.questions.map((q) => ({
          question_type: q.type,
          question_text: q.questionText,
          ...(q.options.length > 0 && { options: q.options }),
          required: q.required,
        })),
        privacy: {
          company_name: objective.instantForm.companyName,
          privacy_policy_url: objective.instantForm.privacyPolicyUrl,
        },
        thank_you_page: {
          headline: objective.instantForm.thankYouHeadline,
          description: objective.instantForm.thankYouDescription,
          button_text: objective.instantForm.thankYouButtonText,
          ...(objective.instantForm.thankYouUrl && { button_url: objective.instantForm.thankYouUrl }),
        },
      },
    }),
    ads: isCatalogListing
      ? []
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
                  display_name: (ad.displayName || creative.identity?.displayName || "").slice(0, 20),
                  call_to_action: ad.callToAction,
                  ...(ad.landingPageUrl && { landing_page_url: ad.landingPageUrl }),
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
