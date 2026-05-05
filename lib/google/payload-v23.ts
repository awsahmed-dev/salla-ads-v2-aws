import type { GoogleCampaignData, SearchKeyword } from "@/lib/google/campaign-types";
import { OBJECTIVE_CONFIGS } from "@/lib/google/campaign-types";

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
    case "SIGN_UP":
      return "SIGNUP";
    case "CONTACT":
      return "CONTACT";
    case "PAGE_VIEW":
    default:
      return "PAGE_VIEW";
  }
}

function toHeadlinePinEnum(pos: number | null): string | null {
  if (pos === null) return null;
  return `HEADLINE_${pos}`;
}

function toDescriptionPinEnum(pos: number | null): string | null {
  if (pos === null) return null;
  return `DESCRIPTION_${pos}`;
}

export function buildGoogleCampaignPayloadV23(campaign: GoogleCampaignData) {
  const { objective, audience, budget, creative } = campaign;
  const isPMax = objective.objective === "PERFORMANCE_MAX";
  const isRetailPMax = isPMax && objective.feedEnabled;
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
      advertising_channel_type: OBJECTIVE_CONFIGS[objective.objective]?.apiChannelType ?? objective.objective,
      status: "PAUSED",
      ...(isApp ? { advertising_channel_sub_type: objective.appSettings.advertisingChannelSubType } : {}),
      contains_eu_political_advertising: objective.containsEuPoliticalAdvertising,
      campaign_budget_mode: isDemandGen ? budget.demandGenBudgetMode : "DAILY",
      campaign_budget_amount_micros:
        isDemandGen && budget.demandGenBudgetMode === "TOTAL"
          ? toMicros(budget.demandGenTotalAmount)
          : toMicros(budget.amount),
      campaign_budget_period:
        isDemandGen && budget.demandGenBudgetMode === "TOTAL" ? "CUSTOM_PERIOD" : "DAILY",
      delivery_method: budget.deliveryMethod,
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
      ...(isShopping || isRetailPMax
        ? {
            shopping_setting: {
              merchant_id: objective.shoppingSettings?.merchantId || objective.merchantCenterId,
              ...(isShopping ? { campaign_priority: objective.shoppingSettings.campaignPriority } : {}),
              feed_label: objective.shoppingSettings?.feedLabel || objective.feedId || undefined,
              enable_local: objective.shoppingSettings?.enableLocal ?? false,
            },
          }
        : {}),
      ...(isSearch ? {
        network_settings: {
          target_google_search: true,
          target_search_network: creative.searchPartners,
          target_content_network: creative.targetContentNetwork ?? true,
          target_partner_search_network: false,
        }
      } : {}),
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
            search_partners: creative.searchPartners,
            audience_targeting_mode: audience.audienceTargetingMode,
          }
        : {}),
    },
  };

  if (isPMax && creative.assetGroups.length > 0) {
    payload.asset_groups = creative.assetGroups.map((ag) => {
      const useCampaignBrandAssets = budget.brandGuidelinesEnabled;
      return {
        name: ag.name?.trim() || `${objective.campaignName.trim()} - Asset Group`,
        final_url: ag.finalUrl,
        ...(ag.finalMobileUrl ? { final_mobile_url: ag.finalMobileUrl } : {}),
        call_to_action: ag.callToAction,
        headlines: ag.headlines.map((h) => h.text).filter(Boolean),
        long_headlines: ag.longHeadlines.map((h) => h.text).filter(Boolean),
        descriptions: ag.descriptions.map((d) => d.text).filter(Boolean),
        images: ag.images.map((i) => i.url).filter(Boolean),
        landscape_logos: ag.landscapeLogos?.map((l) => l.url).filter(Boolean) ?? [],
        videos: ag.videos.map((v) => v.url || v.youtubeUrl).filter(Boolean),
        search_themes: ag.searchThemes?.filter(Boolean) ?? [],
        audience_signals: ag.audienceSignals?.filter(Boolean) ?? [],
        ...(useCampaignBrandAssets ? {} : {
          business_name: ag.businessName,
          logos: ag.logos.map((l) => l.url).filter(Boolean),
        }),
        ...(isRetailPMax && creative.productGroupRoot
          ? { listing_group_filters: creative.productGroupRoot }
          : {}),
      };
    });
    if (budget.brandGuidelinesEnabled) {
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
        type: "SEARCH_STANDARD",
        keywords: serializeSearchKeywords(ag.keywords),
        negative_keywords: ag.negativeKeywords.map((kw) => kw.text),
        responsive_search_ads: ag.ads.map((ad) => ({
          name: ad.name,
          final_url: ad.finalUrl,
          path1: ad.displayPath1,
          path2: ad.displayPath2,
          headlines: ad.headlines.map((h) => ({ text: h.text, pinned_position: toHeadlinePinEnum(h.pinnedPosition) })),
          descriptions: ad.descriptions.map((d) => ({ text: d.text, pinned_position: toDescriptionPinEnum(d.pinnedPosition) })),
        })),
      })),
      extensions: {
        sitelinks: creative.sitelinkExtensions,
        callouts: creative.calloutExtensions,
        structured_snippets: creative.structuredSnippetExtensions,
        price_assets: (creative.priceExtensions ?? []).map((pe) => ({
          type: pe.type,
          price_qualifier: pe.priceQualifier,
          language_code: pe.languageCode,
          offerings: pe.offerings.map((o) => ({
            header: o.header,
            description: o.description,
            price: { amount_micros: o.priceMicros, currency_code: "SAR" },
            unit: o.unit,
            final_url: o.finalUrl,
          })),
        })),
        promotion_assets: (creative.promotionExtensions ?? []).map((promo) => ({
          promotion_target: promo.promotionTarget,
          discount_modifier: promo.discountModifier,
          ...(promo.discountType === "PERCENT_OFF" ? { percent_off: promo.percentOff } : {}),
          ...(promo.discountType === "MONETARY" ? { money_amount_off: { amount_micros: promo.moneyAmountMicros, currency_code: "SAR" } } : {}),
          occasion: promo.occasion,
          final_url: promo.finalUrl,
          start_date: promo.startDate,
          end_date: promo.endDate,
        })),
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
          ...(ad.adType === "VIDEO_RESPONSIVE" ? {
            long_headlines: ad.longHeadlines.map((h) => h.text).filter(Boolean),
            breadcrumb1: ad.breadcrumb1 || undefined,
            breadcrumb2: ad.breadcrumb2 || undefined,
            companion_banner_url: ad.companionBannerUrl || undefined,
          } : {}),
          descriptions: ad.descriptions.map((d) => d.text).filter(Boolean),
          // Images grouped by aspect ratio (API requires separate fields)
          marketing_images: ad.images.filter((i) => i.aspectRatio === "LANDSCAPE").map((i) => i.url).filter(Boolean),
          square_marketing_images: ad.images.filter((i) => i.aspectRatio === "SQUARE").map((i) => i.url).filter(Boolean),
          portrait_marketing_images: ad.images.filter((i) => i.aspectRatio === "PORTRAIT").map((i) => i.url).filter(Boolean),
          tall_portrait_marketing_images: ad.images.filter((i) => i.aspectRatio === "TALL_PORTRAIT").map((i) => i.url).filter(Boolean),
          // Logos as URLs
          logo_images: ad.logos.map((l) => l.url).filter(Boolean),
          // Videos as YouTube URLs
          videos: ad.videos.map((v) => v.youtubeUrl).filter(Boolean),
          // Carousel fields (only when CAROUSEL format)
          ...(ad.adType === "CAROUSEL" ? {
            carousel_headline: ad.carouselHeadline || undefined,
            carousel_description: ad.carouselDescription || undefined,
            carousel_cards: ad.carouselCards.filter((c) => c.headline || c.imageUrl || c.finalUrl).map((c) => ({
              headline: c.headline,
              image_url: c.imageUrl,
              final_url: c.finalUrl,
              call_to_action: c.callToAction,
            })),
            logo_image: ad.logos[0]?.url || undefined,
          } : {}),
          ad_asset_automation: ad.adAssetAutomation,
        })),
      })),
    };
  }

  if (isDisplay) {
    payload.display = {
      ad_groups: creative.displayAdGroups.map((ag) => ({
        name: ag.name,
        type: "DISPLAY_STANDARD",
        // Content targeting criteria
        criteria: [
          ...ag.contentKeywords.filter(Boolean).map((kw) => ({ keyword: { text: kw, match_type: "BROAD" }, negative: false })),
          ...ag.topics.filter(Boolean).map((t) => ({ topic: { topic_constant: t }, negative: false })),
          ...ag.placements.filter(Boolean).map((p) => ({ placement: { url: p }, negative: false })),
          ...ag.excludedPlacements.filter(Boolean).map((p) => ({ placement: { url: p }, negative: true })),
        ],
        // Responsive Display Ads
        responsive_display_ads: ag.ads.map((ad) => ({
          headlines: ad.headlines.filter((h) => h.text?.trim()).map((h) => ({ text: h.text })),
          long_headline: { text: ad.longHeadline },
          descriptions: ad.descriptions.filter((d) => d.text?.trim()).map((d) => ({ text: d.text })),
          marketing_images: ad.images.filter((i) => i.url?.trim()).map((i) => i.url),
          square_marketing_images: ad.squareImages.filter((i) => i.url?.trim()).map((i) => i.url),
          logo_images: ad.logos.filter((l) => l.url?.trim()).map((l) => l.url),
          square_logo_images: ad.squareLogos.filter((l) => l.url?.trim()).map((l) => l.url),
          youtube_videos: ad.youtubeVideos.filter(Boolean),
          final_url: ad.finalUrl,
          business_name: ad.businessName,
          call_to_action_text: ad.callToAction,
          main_color: ad.mainColor || undefined,
          accent_color: ad.accentColor || undefined,
          allow_flexible_color: ad.allowFlexibleColor,
          price_prefix: ad.pricePrefix || undefined,
          promo_text: ad.promoText || undefined,
          format_setting: ad.formatSetting,
        })),
      })),
    };
  }

  if (isApp) {
    payload.app = {
      ads: creative.appAds,
    };
  }

  if (isShopping) {
    const shoppingAdGroupName = objective.campaignName?.trim()
      ? `${objective.campaignName.trim()} - Products`
      : "Shopping Products";
    payload.shopping = {
      ad_group: {
        name: shoppingAdGroupName,
        type: "SHOPPING_PRODUCT_ADS",
        listing_group_filters: creative.productGroupRoot,
      },
      negative_keywords: (creative.negativeKeywords ?? []).map((kw) => ({
        keyword: { text: kw.text, match_type: kw.matchType },
        negative: true,
      })),
    };
  }

  return payload;
}
