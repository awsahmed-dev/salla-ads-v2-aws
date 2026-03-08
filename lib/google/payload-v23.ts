import type { GoogleCampaignData, SearchKeyword } from "@/lib/google/campaign-types";

function toMicros(amountSar: number): number {
  return Math.round(Math.max(0, amountSar) * 1_000_000);
}

function toDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const safeTime = time?.trim() ? time : "00:00";
  return `${date.replaceAll("-", "")} ${safeTime}:00`;
}

function toDemandGenChannel(channelKey: string): string {
  return channelKey.replace(/([A-Z])/g, "_$1").toUpperCase();
}

function serializeSearchKeywords(keywords: SearchKeyword[]) {
  return keywords.map((kw) => ({
    keyword: { text: kw.text, match_type: kw.matchType },
    negative: false,
  }));
}

function toConversionActionCategory(goal: GoogleCampaignData["budget"]["conversionGoal"]): string {
  switch (goal) {
    case "PURCHASE":
    case "IN_APP_PURCHASE":
      return "PURCHASE";
    case "ADD_TO_CART":
      return "ADD_TO_CART";
    case "BEGIN_CHECKOUT":
      return "BEGIN_CHECKOUT";
    case "LEAD":
      return "SUBMIT_LEAD_FORM";
    case "APP_INSTALL":
      return "DOWNLOAD";
    case "PAGE_VIEW":
    default:
      return "PAGE_VIEW";
  }
}

export function buildGoogleCampaignPayloadV23(campaign: GoogleCampaignData) {
  const { objective, audience, budget, creative } = campaign;
  const isPMax = objective.objective === "PERFORMANCE_MAX";
  const isDemandGen = objective.objective === "DEMAND_GEN";
  const isSearch = objective.objective === "SEARCH";
  const isShopping = objective.objective === "SHOPPING";
  const isDisplay = objective.objective === "DISPLAY";
  const isApp = objective.objective === "APP";

  const firstAssetGroup = creative.assetGroups[0];
  const startDateTime = toDateTime(budget.startDate, budget.startTime);
  const endDateTime = budget.endDateOptional ? undefined : toDateTime(budget.endDate, budget.endTime);
  const effectiveBiddingStrategy =
    isPMax && budget.biddingStrategy === "TARGET_CPA"
      ? "MAXIMIZE_CONVERSIONS"
      : isPMax && budget.biddingStrategy === "TARGET_ROAS"
        ? "MAXIMIZE_CONVERSION_VALUE"
        : budget.biddingStrategy;
  const hasTargetCpa =
    (effectiveBiddingStrategy === "TARGET_CPA" || effectiveBiddingStrategy === "MAXIMIZE_CONVERSIONS") &&
    budget.targetCpa > 0;
  const hasTargetRoas =
    (effectiveBiddingStrategy === "TARGET_ROAS" || effectiveBiddingStrategy === "MAXIMIZE_CONVERSION_VALUE") &&
    budget.targetRoas > 0;

  const payload: Record<string, unknown> = {
    campaign: {
      name: objective.campaignName,
      advertising_channel_type: objective.objective,
      status: "ENABLED",
      contains_eu_political_advertising: objective.containsEuPoliticalAdvertising,
      campaign_budget_mode: isDemandGen ? budget.demandGenBudgetMode : "DAILY",
      campaign_budget_amount_micros:
        isDemandGen && budget.demandGenBudgetMode === "TOTAL"
          ? toMicros(budget.demandGenTotalAmount)
          : toMicros(budget.amount),
      campaign_budget_period:
        isDemandGen && budget.demandGenBudgetMode === "TOTAL" ? "CUSTOM" : "DAILY",
      bidding_strategy_type: effectiveBiddingStrategy,
      ...(hasTargetCpa && { target_cpa: { target_cpa_micros: toMicros(budget.targetCpa) } }),
      ...(budget.biddingStrategy === "TARGET_CPC" && { target_cpc: { target_cpc_micros: toMicros(budget.targetCpc) } }),
      ...(hasTargetRoas && { target_roas: { target_roas: budget.targetRoas / 100 } }),
      ...(isPMax
        ? {
            // Prototype mapping for campaign-level conversion objective intent in PMax.
            // Intended backend target: CampaignConversionGoal / CustomConversionGoal flows.
            conversion_goal_configuration: {
              level: "CAMPAIGN",
              selected_goal: budget.conversionGoal,
              conversion_action_category: toConversionActionCategory(budget.conversionGoal),
              biddable: true,
            },
          }
        : {}),
      ...(startDateTime && { start_date_time: startDateTime }),
      ...(endDateTime && { end_date_time: endDateTime }),
      ...(isPMax || isSearch
        ? {
            text_guidelines: {
              term_exclusions: budget.textGuidelines.termExclusions,
              messaging_restrictions: budget.textGuidelines.messagingRestrictions,
            },
            asset_automation_settings: budget.assetAutomationSettings.map((entry) => ({
              asset_automation_type: entry.type,
              asset_automation_status: entry.status,
            })),
          }
        : {}),
      ...(isSearch && budget.aiMaxSettings.enableAiMax
        ? {
            ai_max_setting: {
              enable_ai_max: true,
              brand_inclusions: budget.aiMaxSettings.brandInclusions,
              brand_exclusions: budget.aiMaxSettings.brandExclusions,
              url_inclusions: budget.aiMaxSettings.urlInclusions,
            },
          }
        : {}),
      ...(isPMax
        ? {
            url_expansion_opt_out: budget.urlExpansionOptOut,
            brand_guidelines_enabled: budget.brandGuidelinesEnabled,
          }
        : {}),
      ...(isShopping
        ? {
            shopping_setting: {
              merchant_id: objective.shoppingSettings.merchantId || objective.merchantCenterId,
              campaign_priority: objective.shoppingSettings.campaignPriority,
              feed_label: objective.shoppingSettings.feedLabel || undefined,
              enable_local: objective.shoppingSettings.enableLocal,
            },
          }
        : {}),
      ...(isApp
        ? {
            app_campaign_setting: {
              app_store: objective.appSettings.appStore,
              app_id: objective.appSettings.appId,
              bidding_strategy_goal_type: objective.appSettings.biddingStrategyGoalType,
            },
          }
        : {}),
    },
    targeting: {
      locations: audience.locationIds,
      cities: audience.cityIds,
      languages: audience.languages,
      age: { min: audience.ageMin, max: audience.ageMax },
      genders: audience.genders,
      devices: audience.devices,
      optimized_targeting: audience.optimizedTargeting,
      ...(isSearch
        ? {
            search_partners: audience.searchPartners,
            audience_targeting_mode: audience.audienceTargetingMode,
            ad_schedule_entries: audience.adScheduleEntries,
          }
        : {}),
    },
  };

  if (isPMax && firstAssetGroup) {
    const assetGroupName =
      firstAssetGroup.name?.trim() ||
      (objective.campaignName?.trim() ? `${objective.campaignName.trim()} - Asset Group` : "Asset Group 1");
    const useCampaignBrandAssets = budget.brandGuidelinesEnabled;
    const listingGroupRoot = objective.feedEnabled ? creative.productGroupRoot : null;
    payload.asset_group = {
      name: assetGroupName,
      final_url: firstAssetGroup.finalUrl,
      call_to_action: firstAssetGroup.callToAction,
      headlines: firstAssetGroup.headlines.map((h) => h.text).filter(Boolean),
      long_headlines: firstAssetGroup.longHeadlines.map((h) => h.text).filter(Boolean),
      descriptions: firstAssetGroup.descriptions.map((d) => d.text).filter(Boolean),
      images: firstAssetGroup.images.map((i) => i.url).filter(Boolean),
      videos: firstAssetGroup.videos.map((v) => v.url).filter(Boolean),
      ...(listingGroupRoot ? { listing_group_root: listingGroupRoot } : {}),
      ...(useCampaignBrandAssets
        ? {}
        : {
            business_name: firstAssetGroup.businessName,
            logos: firstAssetGroup.logos.map((l) => l.url).filter(Boolean),
          }),
    };

    if (useCampaignBrandAssets) {
      payload.campaign_assets = {
        business_name: firstAssetGroup.businessName,
        logos: firstAssetGroup.logos.map((l) => l.url).filter(Boolean),
      };
    }
  }

  if (isSearch) {
    payload.search = {
      ad_groups: creative.searchAdGroups.map((ag) => ({
        name: ag.name,
        keywords: serializeSearchKeywords(ag.keywords),
        negative_keywords: ag.negativeKeywords.map((kw) => kw.text),
        responsive_search_ads: ag.ads.map((ad) => ({
          name: ad.name,
          final_url: ad.finalUrl,
          path1: ad.displayPath1,
          path2: ad.displayPath2,
          headlines: ad.headlines.map((h) => ({ text: h.text, pinned_position: h.pinnedPosition })),
          descriptions: ad.descriptions.map((d) => ({ text: d.text, pinned_position: d.pinnedPosition })),
        })),
      })),
      extensions: {
        sitelinks: creative.sitelinkExtensions,
        callouts: creative.calloutExtensions,
        structured_snippets: creative.structuredSnippetExtensions,
      },
    };
  }

  if (isDemandGen) {
    payload.demand_gen = {
      ad_groups: creative.demandGenAdGroups.map((ag) => ({
        name: ag.name,
        channel_controls: Object.entries(ag.channelControls)
          .filter(([, enabled]) => enabled)
          .map(([key]) => toDemandGenChannel(key)),
        ads: ag.ads.map((ad) => ({
          name: ad.name,
          ad_type: ad.adType,
          business_name: ad.businessName,
          final_url: ad.finalUrl,
          call_to_action: ad.callToAction,
          headlines: ad.headlines.map((h) => h.text).filter(Boolean),
          long_headlines: ad.longHeadlines.map((h) => h.text).filter(Boolean),
          descriptions: ad.descriptions.map((d) => d.text).filter(Boolean),
          images: ad.images,
          logos: ad.logos,
          videos: ad.videos,
          companion_banner_url: ad.companionBannerUrl || undefined,
          carousel: {
            headline: ad.carouselHeadline,
            description: ad.carouselDescription,
            cards: ad.carouselCards,
          },
          ad_asset_automation: ad.adAssetAutomation,
        })),
      })),
    };
  }

  if (isDisplay) {
    payload.display = {
      ad_groups: creative.displayAdGroups,
    };
  }

  if (isApp) {
    payload.app = {
      ads: creative.appAds,
    };
  }

  if (isShopping) {
    payload.shopping = {
      product_group_root: creative.productGroupRoot,
      negative_keywords: creative.negativeKeywords,
    };
  }

  return payload;
}
