/* ================================================================
   TikTok Sales — Scenario Matrix (single source of truth)
   ----------------------------------------------------------------
   The Catalog toggle and the Search-Ads toggle do NOT simply add
   fields to the request body — they swap which TikTok API endpoint
   (and therefore which body shape) we target:

   ┌────────┬──────────────────────────┬─────────┬───────────────────┐
   │ Code   │ Catalog | Search          │ Endpoint │ Body shape         │
   ├────────┼──────────────────────────┼─────────┼───────────────────┤
   │  A      │  OFF      |  OFF         │ Smart+   │ SmartPlusAd*       │
   │  B      │  ON       |  OFF         │ Smart+   │ SmartPlusAd* +     │
   │         │                          │          │ catalog_id /       │
   │         │                          │          │ product_source     │
   │  C      │  OFF      |  ON          │ CLASSIC  │ AdGroup + keywords │
   │         │                          │          │ + negative_keywords│
   │         │                          │          │ placement_type =   │
   │         │                          │          │ "PLACEMENT_SEARCH" │
   │  D      │  ON       |  ON          │ BLOCKED  │ — invalid config — │
   └────────┴──────────────────────────┴─────────┴───────────────────┘

   Why D is blocked: TikTok does NOT support dynamic product-catalog
   carousels inside keyword-isolated Search campaigns. The two
   delivery surfaces are mutually exclusive. We surface a hard block
   in the UI and refuse to submit at the payload layer.

   Why catalog forces creatives to "dynamic carousel only" (Scenario B):
   In Smart+ catalog mode TikTok auto-generates the visual from the
   feed (product cards rendered as a carousel). Standard manually-
   uploaded video assets are dropped — the merchant's feed IS the
   creative source. This is the "Catalog Listing Ads" / dynamic-feed
   model in TikTok docs.
   ================================================================ */

import type { TikTokCampaignData } from "./campaign-types";

export type SalesScenario = "A" | "B" | "C" | "D";

export interface ScenarioMeta {
  /** Scenario code (A/B/C/D). */
  code: SalesScenario;
  /** Human-readable label for surfacing in the UI. */
  label: string;
  /** Which TikTok endpoint family to hit. */
  endpoint: "smart_plus" | "classic" | "blocked";
  /** True when both toggles are ON — payload must NOT be submitted. */
  isBlocked: boolean;
  /** True when the Catalog toggle is ON (only meaningful in A/B). */
  catalogOn: boolean;
  /** True when the Search-Ads toggle is ON (only meaningful in A/C). */
  searchOn: boolean;
  /** Convenience — Scenario B is the only Smart+ flow that runs catalog. */
  isSmartPlusCatalog: boolean;
  /** Convenience — Scenario C is the only classic-search flow. */
  isClassicSearch: boolean;
  /** Concise reason string, used in the Scenario D blocker UI. */
  blockReason?: string;
}

/**
 * Derive the active scenario from the campaign state. Always returns
 * a non-null result; non-Sales objectives report Scenario "A" (the
 * default Smart+/classic split logic for those objectives is handled
 * independently — this helper is a Sales-specific matrix).
 */
export function getSalesScenario(campaign: TikTokCampaignData): ScenarioMeta {
  const isSales = campaign.objective.objective === "PRODUCT_SALES";
  if (!isSales) {
    return {
      code: "A",
      label: "Default",
      endpoint: "smart_plus",
      isBlocked: false,
      catalogOn: false,
      searchOn: false,
      isSmartPlusCatalog: false,
      isClassicSearch: false,
    };
  }

  const catalogOn = campaign.objective.catalogEnabled === true;
  const searchOn = campaign.objective.searchAdsEnabled === true;

  if (catalogOn && searchOn) {
    return {
      code: "D",
      label: "Catalog + Search Ads (forbidden)",
      endpoint: "blocked",
      isBlocked: true,
      catalogOn: true,
      searchOn: true,
      isSmartPlusCatalog: false,
      isClassicSearch: false,
      blockReason:
        "TikTok does not deliver dynamic product-catalog carousels inside keyword-isolated Search campaigns. Disable one of the two toggles to continue.",
    };
  }

  if (catalogOn) {
    return {
      code: "B",
      label: "Smart+ · Catalog Ads",
      endpoint: "smart_plus",
      isBlocked: false,
      catalogOn: true,
      searchOn: false,
      isSmartPlusCatalog: true,
      isClassicSearch: false,
    };
  }

  if (searchOn) {
    return {
      code: "C",
      label: "Classic · Search Ads",
      endpoint: "classic",
      isBlocked: false,
      catalogOn: false,
      searchOn: true,
      isSmartPlusCatalog: false,
      isClassicSearch: true,
    };
  }

  return {
    code: "A",
    label: "Smart+ · Default",
    endpoint: "smart_plus",
    isBlocked: false,
    catalogOn: false,
    searchOn: false,
    isSmartPlusCatalog: false,
    isClassicSearch: false,
  };
}

/** Thrown when buildTikTokApiPayload is called in submit mode while the
 *  campaign is in Scenario D. The UI must catch this and re-route the
 *  user to fix the toggle conflict. */
export class InvalidScenarioError extends Error {
  scenario: SalesScenario;
  constructor(scenario: SalesScenario, reason: string) {
    super(`Cannot build payload for scenario ${scenario}: ${reason}`);
    this.name = "InvalidScenarioError";
    this.scenario = scenario;
  }
}
