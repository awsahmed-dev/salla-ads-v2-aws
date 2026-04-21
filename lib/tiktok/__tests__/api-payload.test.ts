/* ================================================================
   TikTok Payload Builder — Golden Snapshot Tests
   ----------------------------------------------------------------
   These tests lock the CURRENT behavior of buildTikTokApiPayload
   across all 6 objectives so Phase 1-6 enum fixes can be reviewed
   as focused diffs.

   After each planned audit-fix lands, update ONLY the affected
   fields in the inline-expected payload so reviewers can see
   exactly what changed.

   This is a regression harness, not a "is the payload correct per
   TikTok API v1.3" test. See docs/tiktok-sandbox-dry-run.md for
   real validation.
   ================================================================ */

import { describe, expect, it } from "vitest";
import { buildTikTokApiPayload, PlaceholderLeakError } from "../api-payload";
import { defaultTikTokCampaign, type TikTokCampaignData } from "../campaign-types";

/* ------------------------------------------------------------------ */
/*  Helper: clone + mutate the default campaign                       */
/* ------------------------------------------------------------------ */
function withCampaign(mut: (c: TikTokCampaignData) => void): TikTokCampaignData {
  // structuredClone keeps nested objects independent
  const clone = structuredClone(defaultTikTokCampaign);
  clone.objective.campaignName = "Test Campaign";
  clone.budget.startDate = "2026-01-01";
  clone.budget.endDate = "2026-01-15";
  mut(clone);
  return clone;
}

/* ------------------------------------------------------------------ */
/*  PRODUCT_SALES                                                     */
/* ------------------------------------------------------------------ */

describe("PRODUCT_SALES", () => {
  it("website + conversion goal emits pixel + optimization_event", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "PRODUCT_SALES";
      c.objective.promotionType = "WEBSITE";
      c.objective.pixelMode = "salla_managed";
      c.budget.optimizationGoal = "CONVERSION";
      c.budget.optimizationEvent = "COMPLETE_PAYMENT";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.objective_type).toBe("PRODUCT_SALES");
    expect(payload.campaign.promotion_type).toBe("WEBSITE");
    expect(payload.adgroup.optimization_goal).toBe("CONVERT"); // mapped
    expect(payload.adgroup.optimization_event).toBe("CompletePayment");
    expect(payload.adgroup.pixel_id).toBe("CMOCK1234567890");
    expect(payload.adgroup.placement_type).toBe("PLACEMENT_TYPE_NORMAL");
    expect(payload.adgroup.placements).toEqual(["PLACEMENT_TIKTOK"]);
    expect(payload.adgroup.billing_event).toBe("OCPM");
  });

  it("value goal emits deep_bid_type + roas_bid", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "PRODUCT_SALES";
      c.objective.pixelMode = "salla_managed";
      c.budget.optimizationGoal = "VALUE";
      c.budget.deepBidType = "VO_MIN_ROAS";
      c.budget.roasBid = 2.5;
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.adgroup.optimization_goal).toBe("VALUE");
    expect(payload.adgroup.deep_bid_type).toBe("VO_MIN_ROAS");
    expect(payload.adgroup.roas_bid).toBe(2.5);
  });

  it("catalog enabled emits shopping_ads_type + catalog_id", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "PRODUCT_SALES";
      c.objective.catalogEnabled = true;
      c.objective.shoppingAdsType = "VIDEO_SHOPPING";
      c.objective.catalogId = "CAT_123";
      c.objective.productSelectionMode = "PRODUCT_SET";
      c.objective.productSetId = "SET_456";
      c.objective.pixelMode = "salla_managed";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.promotion_type).toBe("CATALOG");
    // NOTE (Phase 2): expect "VIDEO_SHOPPING_ADS" and campaign-level catalog_id after fix
    expect(payload.adgroup.shopping_ads_type).toBe("VIDEO_SHOPPING");
    expect(payload.adgroup.catalog_id).toBe("CAT_123");
    expect(payload.adgroup.product_set_id).toBe("SET_456");
  });

  it("sales attribution windows are emitted", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "PRODUCT_SALES";
      c.objective.pixelMode = "salla_managed";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.adgroup.click_attribution_window).toBe(7);
    expect(payload.adgroup.view_attribution_window).toBe(1);
  });
});

/* ------------------------------------------------------------------ */
/*  REACH                                                             */
/* ------------------------------------------------------------------ */

describe("REACH", () => {
  it("emits REACH goal with no pixel / optimization_event / deep_bid_type", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "REACH";
      c.budget.optimizationGoal = "REACH";
      c.budget.billingEvent = "CPM";
      c.budget.frequencyCap = { frequency: 3, schedule: 7 };
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.objective_type).toBe("REACH");
    expect(payload.adgroup.optimization_goal).toBe("REACH");
    expect(payload.adgroup.billing_event).toBe("CPM");
    expect(payload.adgroup.frequency).toBe(3);
    expect(payload.adgroup.frequency_schedule).toBe(7);
    expect(payload.adgroup.pixel_id).toBeUndefined();
    expect(payload.adgroup.optimization_event).toBeUndefined();
    expect(payload.adgroup.deep_bid_type).toBeUndefined();
    expect(payload.adgroup.click_attribution_window).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  TRAFFIC                                                           */
/* ------------------------------------------------------------------ */

describe("TRAFFIC", () => {
  it("click goal without pixelMode none skips pixel but is missing bid_price for custom (pre-fix)", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "TRAFFIC";
      c.objective.pixelMode = "none";
      c.budget.optimizationGoal = "CLICK";
      c.budget.billingEvent = "CPC";
      c.budget.bidType = "BID_TYPE_CUSTOM";
      c.budget.bidAmount = 5;
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.objective_type).toBe("TRAFFIC");
    expect(payload.adgroup.optimization_goal).toBe("CLICK");
    expect(payload.adgroup.billing_event).toBe("CPC");
    expect(payload.adgroup.pixel_id).toBeUndefined();
    // NOTE (Phase 3): after fix, bid_price should be emitted here
    expect(payload.adgroup.bid_price).toBeUndefined();
    expect(payload.adgroup.conversion_bid_price).toBeUndefined();
  });

  it("landing_page_view emits pixel and LPV goal", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "TRAFFIC";
      c.objective.pixelMode = "salla_managed";
      c.budget.optimizationGoal = "LANDING_PAGE_VIEW";
      c.budget.billingEvent = "OCPM";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.adgroup.optimization_goal).toBe("LANDING_PAGE_VIEW");
    expect(payload.adgroup.pixel_id).toBe("CMOCK1234567890");
  });
});

/* ------------------------------------------------------------------ */
/*  VIDEO_VIEWS                                                       */
/* ------------------------------------------------------------------ */

describe("VIDEO_VIEWS", () => {
  it("emits VIDEO_VIEW goal with no pixel and (currently) spurious engaged_view_attribution_window", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "VIDEO_VIEWS";
      c.budget.optimizationGoal = "VIDEO_VIEW";
      c.budget.billingEvent = "CPV";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.objective_type).toBe("VIDEO_VIEWS");
    expect(payload.adgroup.optimization_goal).toBe("VIDEO_VIEW");
    expect(payload.adgroup.billing_event).toBe("CPV");
    expect(payload.adgroup.pixel_id).toBeUndefined();
    expect(payload.adgroup.optimization_event).toBeUndefined();
    // NOTE (Phase 3): after fix, engaged_view_attribution_window should be absent
    expect(payload.adgroup.engaged_view_attribution_window).toBe(7);
  });
});

/* ------------------------------------------------------------------ */
/*  LEAD_GENERATION                                                   */
/* ------------------------------------------------------------------ */

describe("LEAD_GENERATION", () => {
  it("instant_form path emits inline form object at top level (pre-fix; Phase 4 will rework)", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "LEAD_GENERATION";
      c.objective.leadOptimizationLocation = "INSTANT_FORM";
      c.objective.instantForm.formName = "My Lead Form";
      c.objective.instantForm.companyName = "Salla Inc";
      c.objective.instantForm.privacyPolicyUrl = "https://salla.sa/privacy";
      c.budget.optimizationGoal = "LEAD_GENERATION";
      c.budget.billingEvent = "OCPM";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.objective_type).toBe("LEAD_GENERATION");
    expect(payload.adgroup.optimization_goal).toBe("LEAD_GENERATION"); // Phase 4: → CONVERT
    expect(payload.adgroup.optimization_location).toBe("INSTANT_FORM"); // Phase 4: remove
    expect(payload.adgroup.pixel_id).toBeUndefined();
    expect(payload.instant_form).toMatchObject({
      form_name: "My Lead Form",
      privacy: { company_name: "Salla Inc" },
    });
  });

  it("website lead path emits pixel + SubmitForm event (pre-fix)", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "LEAD_GENERATION";
      c.objective.leadOptimizationLocation = "WEBSITE";
      c.objective.pixelMode = "salla_managed";
      c.budget.optimizationGoal = "LEAD_GENERATION";
      c.budget.billingEvent = "OCPM";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.adgroup.optimization_event).toBe("SubmitForm"); // Phase 4: reverify enum
    expect(payload.adgroup.pixel_id).toBe("CMOCK1234567890");
    expect(payload.instant_form).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  APP_PROMOTION                                                     */
/* ------------------------------------------------------------------ */

describe("APP_PROMOTION", () => {
  it("install goal emits app_id/app_type/promotion_type (pre-fix enum values)", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "APP_PROMOTION";
      c.objective.appSettings.appId = "APP_123";
      c.objective.appSettings.appPlatform = "ANDROID";
      c.objective.appSettings.appPromotionType = "APP_INSTALL";
      c.objective.appSettings.appDownloadUrl = "https://play.google.com/app/id=xyz";
      c.budget.optimizationGoal = "INSTALL";
      c.budget.billingEvent = "OCPM";
    });
    const payload = buildTikTokApiPayload(campaign);
    expect(payload.campaign.objective_type).toBe("APP_PROMOTION");
    expect(payload.adgroup.optimization_goal).toBe("INSTALL");
    expect(payload.adgroup.app_id).toBe("APP_123");
    // NOTE (Phase 5): "ANDROID" → "APP_ANDROID", "APP_INSTALL" → use appPlatform as promotion_type
    expect(payload.adgroup.app_type).toBe("ANDROID");
    expect(payload.adgroup.promotion_type).toBe("APP_INSTALL");
    expect(payload.adgroup.pixel_id).toBeUndefined();
    // NOTE (Phase 5): attribution windows should be emitted for App Promo
    expect(payload.adgroup.click_attribution_window).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Cross-cutting                                                     */
/* ------------------------------------------------------------------ */

describe("Spark Ads (cross-cutting)", () => {
  it("pre-fix: sets ad_format=CUSTOMIZED_USER (Phase 1 will change to SINGLE_VIDEO)", () => {
    const campaign = withCampaign((c) => {
      c.creative.ads = [
        {
          id: "ad1",
          name: "Spark 1",
          adFormat: "SPARK_AD",
          assets: [],
          carouselCards: [],
          adText: "",
          displayName: "",
          callToAction: "SHOP_NOW",
          landingPageUrl: "",
          sparkAdEnabled: true,
          sparkAdAuthCode: "AUTH123",
          promotionalMusicDisabled: true,
        },
      ];
    });
    const payload = buildTikTokApiPayload(campaign);
    const creative = (payload.ads[0] as { creatives: Array<Record<string, unknown>> }).creatives[0];
    expect(creative.ad_format).toBe("CUSTOMIZED_USER"); // Phase 1: → SINGLE_VIDEO
    expect(creative.identity_type).toBe("BC_AUTH_TT"); // Phase 1: → AUTH_CODE for sparks
    expect(creative.tiktok_item_id).toMatch(/AUTH123/);
  });
});

describe("Placeholder leak detection", () => {
  it("preview mode keeps placeholders", () => {
    const campaign = withCampaign(() => {});
    const payload = buildTikTokApiPayload(campaign, { mode: "preview" });
    expect(payload.campaign.advertiser_id).toBe("<ADVERTISER_ID>");
  });

  it("submit mode throws PlaceholderLeakError on unresolved id", () => {
    const campaign = withCampaign(() => {});
    expect(() =>
      buildTikTokApiPayload(campaign, { mode: "submit" })
    ).toThrow(PlaceholderLeakError);
  });

  it("submit mode with all ids resolved does not throw", () => {
    const campaign = withCampaign((c) => {
      c.objective.objective = "REACH"; // skip pixel requirement
      c.budget.optimizationGoal = "REACH";
      c.budget.billingEvent = "CPM";
      c.creative.identity.identityId = "id-123";
      c.creative.identity.businessCenterId = "bc-123";
    });
    expect(() =>
      buildTikTokApiPayload(campaign, {
        mode: "submit",
        advertiserId: "adv-123",
        campaignId: "camp-123",
        adgroupId: "ag-123",
      })
    ).not.toThrow();
  });
});
