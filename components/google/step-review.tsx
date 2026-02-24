"use client";

import { useState, useMemo } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/google/campaign-types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertCircle,
  Rocket,
  Zap,
  Users,
  DollarSign,
  Layers,
  Wallet,
  Tag,
  PartyPopper,
  Pencil,
  Globe,
  Calendar,
  Target,
  CreditCard,
  Copy,
  Save,
  Code2,
  ArrowLeft,
  ShieldCheck,
  ShoppingCart,
  Store,
  FolderTree,
  Search,
  Type,
  FileText,
  ExternalLink,
  Smartphone,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function ReviewRow({ label, value, warn }: { label: string; value: React.ReactNode; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <span className={cn("text-sm", warn ? "text-amber-600" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-right text-sm font-medium", warn ? "text-amber-600" : "text-foreground")}>{value}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, step, setStep }: {
  icon: React.ElementType;
  title: string;
  step: number;
  setStep: (s: number) => void;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
      </div>
      <button
        type="button"
        onClick={() => setStep(step)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  );
}

/* Country code to name */
const COUNTRY_MAP: Record<string, string> = {
  SA: "Saudi Arabia", AE: "UAE", KW: "Kuwait", BH: "Bahrain",
  OM: "Oman", QA: "Qatar", EG: "Egypt", JO: "Jordan", IQ: "Iraq",
};

const BIDDING_LABELS: Record<string, string> = {
  MAXIMIZE_CONVERSIONS: "Maximize Conversions",
  MAXIMIZE_CONVERSION_VALUE: "Maximize Conversion Value",
  TARGET_CPA: "Target CPA",
  TARGET_ROAS: "Target ROAS",
  MANUAL_CPC: "Manual CPC",
};

const CONVERSION_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  ADD_TO_CART: "Add to Cart",
  BEGIN_CHECKOUT: "Begin Checkout",
  SIGN_UP: "Sign Up",
  PAGE_VIEW: "Page View",
  LEAD: "Lead",
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function GoogleStepReview() {
  const { campaign, setStep, reset } = useGoogleCampaign();
  const { objective, audience, budget, creative } = campaign;
  const objConfig = OBJECTIVE_CONFIGS[objective.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const isShopping = objective.objective === "SHOPPING";
  const isPMax = objective.objective === "PERFORMANCE_MAX";
  const isDemandGen = objective.objective === "DEMAND_GEN";
  const isSearch = objective.objective === "SEARCH";
  const isDisplay = objective.objective === "DISPLAY";
  const isApp = objective.objective === "APP";
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [showApiJson, setShowApiJson] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  /* ---- Computed ---- */
  const durationDays = useMemo(() => {
    if (budget.startDate && budget.endDate) {
      return Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000));
    }
    return 30;
  }, [budget.startDate, budget.endDate]);

  const totalBudget = budget.amount * durationDays + (budget.performanceBoost ? 149 : 0);
  const firstGroup = creative.assetGroups?.[0];
  const filledHeadlines = firstGroup?.headlines?.filter((h: { text?: string }) => (h.text ?? "").trim().length > 0).length ?? 0;
  const filledDescriptions = firstGroup?.descriptions?.filter((d: { text?: string }) => (d.text ?? "").trim().length > 0).length ?? 0;

  /* ---- Validation ---- */
  const checks = useMemo(() => {
    const list: { id: string; label: string; ok: boolean; detail?: string }[] = [];

    list.push({
      id: "name",
      label: "Campaign name set",
      ok: !!objective.campaignName.trim(),
      detail: objective.campaignName || "Missing",
    });

    list.push({
      id: "conversion",
      label: "Conversion tracking configured",
      ok: objective.conversionTrackingMode !== "none",
      detail: objective.conversionTrackingMode === "salla_managed" ? "Salla Managed" : objective.conversionTrackingId ? "Connected" : "Not set",
    });

    list.push({
      id: "location",
      label: "Target location selected",
      ok: audience.locationIds.length > 0,
      detail: audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "None",
    });

    list.push({
      id: "budget",
      label: "Budget set",
      ok: budget.amount >= 10,
      detail: `SAR ${budget.amount}/day`,
    });

    if (isSearch) {
      const searchGroup = creative.searchAdGroups?.[0];
      const searchAd = searchGroup?.ads?.[0];
      const searchHeadlines = searchAd?.headlines?.filter((h: { text: string }) => h.text.trim()).length ?? 0;
      const searchDescriptions = searchAd?.descriptions?.filter((d: { text: string }) => d.text.trim()).length ?? 0;
      list.push({
        id: "keywords",
        label: "Keywords added",
        ok: (searchGroup?.keywords?.length ?? 0) >= 1,
        detail: `${searchGroup?.keywords?.length ?? 0} keywords`,
      });
      list.push({
        id: "assets",
        label: "RSA has minimum assets",
        ok: searchHeadlines >= 3 && searchDescriptions >= 2,
        detail: `${searchHeadlines} headlines, ${searchDescriptions} descriptions`,
      });
    } else if (isApp) {
      const appAd = creative.appAds?.[0];
      const appHeadlines = appAd?.headlines?.filter((h: { text: string }) => h.text.trim()).length ?? 0;
      const appDescriptions = appAd?.descriptions?.filter((d: { text: string }) => d.text.trim()).length ?? 0;
      list.push({
        id: "app_settings",
        label: "App configured",
        ok: !!objective.appSettings?.appId?.trim(),
        detail: `${objective.appSettings?.appStore === "GOOGLE_APP_STORE" ? "Google Play" : "Apple"}: ${objective.appSettings?.appId || "not set"}`,
      });
      list.push({
        id: "assets",
        label: "App ad has minimum assets",
        ok: appHeadlines >= 1 && appDescriptions >= 1 && !!appAd?.mandatoryAdText?.trim(),
        detail: `${appHeadlines} headlines, ${appDescriptions} descriptions, mandatory text: ${appAd?.mandatoryAdText?.trim() ? "set" : "missing"}`,
      });
    } else if (isDisplay) {
      const displayGroup = creative.displayAdGroups?.[0];
      const displayAd = displayGroup?.ads?.[0];
      const dHeadlines = displayAd?.headlines?.filter((h: { text: string }) => h.text.trim()).length ?? 0;
      const dDescriptions = displayAd?.descriptions?.filter((d: { text: string }) => d.text.trim()).length ?? 0;
      list.push({
        id: "display_targeting",
        label: "Content targeting configured",
        ok: (displayGroup?.contentKeywords?.length ?? 0) > 0 || (displayGroup?.topics?.length ?? 0) > 0 || (displayGroup?.placements?.length ?? 0) > 0,
        detail: `${displayGroup?.contentKeywords?.length ?? 0} keywords, ${displayGroup?.topics?.length ?? 0} topics, ${displayGroup?.placements?.length ?? 0} placements`,
      });
      list.push({
        id: "assets",
        label: "Display ad has minimum assets",
        ok: dHeadlines >= 1 && dDescriptions >= 1 && !!displayAd?.longHeadline?.trim(),
        detail: `${dHeadlines} headlines, ${dDescriptions} descriptions, long headline: ${displayAd?.longHeadline?.trim() ? "set" : "missing"}`,
      });
    } else {
      list.push({
        id: "assets",
        label: "Asset group has minimum assets",
        ok: filledHeadlines >= 3 && filledDescriptions >= 2,
        detail: `${filledHeadlines} headlines, ${filledDescriptions} descriptions`,
      });
    }

    return list;
  }, [objective, audience, budget, creative, filledHeadlines, filledDescriptions, isSearch, isApp]);

  const allPassed = checks.every((c) => c.ok);
  const passedCount = checks.filter((c) => c.ok).length;

  /* ---- API JSON ---- */
  const apiJson = useMemo(() => ({
    campaign: {
      customer_id: "<CUSTOMER_ID>",
      name: objective.campaignName,
      advertising_channel_type: objective.objective,
      status: "ENABLED",
      bidding_strategy_type: budget.biddingStrategy,
      ...(budget.biddingStrategy === "TARGET_CPA" && { target_cpa: { target_cpa_micros: Math.round((budget.targetCpa ?? 0) * 1000000) } }),
      ...(budget.biddingStrategy === "TARGET_ROAS" && { target_roas: { target_roas: (budget.targetRoas ?? 1) } }),
      ...(isPMax && {
        url_expansion_opt_out: budget.urlExpansionOptOut,
        brand_guidelines_enabled: budget.brandGuidelinesEnabled,
      }),
      ...((isPMax || isSearch) && budget.assetAutomationSettings?.length > 0 && {
        asset_automation_settings: budget.assetAutomationSettings.map((e: { type: string; status: string }) => ({
          automation_type: e.type,
          automation_status: e.status,
        })),
      }),
      ...(isSearch && budget.aiMaxSettings?.enableAiMax && {
        ai_max_setting: {
          enable_ai_max: true,
          ...(budget.aiMaxSettings.brandExclusions?.length > 0 && {
            brand_restrictions: { brand_exclusions: budget.aiMaxSettings.brandExclusions },
          }),
          ...(budget.aiMaxSettings.brandInclusions?.length > 0 && {
            brand_suggestions: budget.aiMaxSettings.brandInclusions,
          }),
          ...(budget.aiMaxSettings.urlInclusions?.length > 0 && {
            url_inclusions: budget.aiMaxSettings.urlInclusions,
          }),
        },
      }),
      ...(isShopping && {
        shopping_setting: {
          merchant_id: objective.shoppingSettings?.merchantId || objective.merchantCenterId || "<MERCHANT_ID>",
          campaign_priority: objective.shoppingSettings?.campaignPriority ?? 0,
          feed_label: objective.shoppingSettings?.feedLabel || undefined,
          enable_local: objective.shoppingSettings?.enableLocal ?? false,
        },
      }),
      ...(isShopping && budget.biddingStrategy === "MANUAL_CPC" && {
        manual_cpc: {
          enhanced_cpc_enabled: budget.enhancedCpc,
        },
      }),
      ...(isDemandGen && {
        demand_gen_campaign_setting: {
          upgraded_targeting: audience.optimizedTargeting,
        },
      }),
      ...(isApp && {
        app_campaign_setting: {
          app_id: objective.appSettings?.appId || "<APP_ID>",
          app_store: objective.appSettings?.appStore || "GOOGLE_APP_STORE",
          bidding_strategy_goal_type: objective.appSettings?.biddingStrategyGoalType || "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST",
        },
        advertising_channel_sub_type: "APP_CAMPAIGN",
      }),
    },
    campaign_budget: {
      amount_micros: Math.round(budget.amount * 1000000),
      delivery_method: "STANDARD",
      period: "DAILY",
    },
    asset_group: {
      name: firstGroup?.name ?? "Asset Group 1",
      final_urls: [firstGroup?.finalUrl || "<FINAL_URL>"],
      headlines: firstGroup?.headlines?.filter((h: { text?: string }) => (h.text ?? "").trim()).map((h: { text?: string }) => ({ text: h.text })) ?? [],
      long_headlines: firstGroup?.longHeadlines?.filter((h: { text?: string }) => (h.text ?? "").trim()).map((h: { text?: string }) => ({ text: h.text })) ?? [],
      descriptions: firstGroup?.descriptions?.filter((d: { text?: string }) => (d.text ?? "").trim()).map((d: { text?: string }) => ({ text: d.text })) ?? [],
      images: firstGroup?.images?.map((i: { url?: string; assetFieldType?: string }) => ({
        url: i.url || "<IMAGE_URL>",
        field_type: i.assetFieldType ?? "MARKETING_IMAGE",
      })) ?? [],
      logos: firstGroup?.logos?.map((l: { url?: string }) => ({
        url: l.url || "<LOGO_URL>",
        field_type: "LOGO",
      })) ?? [],
      videos: firstGroup?.videos?.map((v: { url?: string }) => ({
        youtube_video_url: v.url || "<VIDEO_URL>",
        field_type: "YOUTUBE_VIDEO",
      })) ?? [],
      business_name: firstGroup?.businessName || "<BUSINESS_NAME>",
      call_to_action_selection: firstGroup?.callToAction ?? "AUTOMATED",
    },
    asset_group_signal: {
      audience_signal: {
        search_themes: audience.searchThemes?.map((t: string) => ({ text: t })) ?? [],
        custom_segments: {
          keywords: audience.customSegmentKeywords ?? [],
          urls: audience.customSegmentUrls ?? [],
        },
        ...(isDemandGen && audience.lookalikeSegments?.length > 0 && {
          similar_user_lists: audience.lookalikeSegments.map((s: string) => ({
            user_list: s,
            similarity_level: audience.lookalikeExpansion ?? "BALANCED",
          })),
        }),
        ...(isDemandGen && audience.customerMatchLists?.length > 0 && {
          customer_match_user_lists: audience.customerMatchLists.map((l: string) => ({
            user_list: l,
          })),
        }),
      },
    },
    ...(isSearch && {
      ad_groups: (creative.searchAdGroups ?? []).map((ag: { name: string; keywords: { text: string; matchType: string }[]; negativeKeywords: { text: string }[]; ads: { name: string; headlines: { text: string; pinnedPosition: number | null }[]; descriptions: { text: string; pinnedPosition: number | null }[]; finalUrl: string; displayPath1: string; displayPath2: string }[] }) => ({
        name: ag.name,
        type: "SEARCH_STANDARD",
        ad_group_criteria: ag.keywords.map((kw) => ({
          keyword: { text: kw.text, match_type: kw.matchType },
          negative: false,
        })),
        negative_ad_group_criteria: ag.negativeKeywords.map((kw) => ({
          keyword: { text: kw.text, match_type: "BROAD" },
          negative: true,
        })),
        ad_group_ads: ag.ads.map((ad) => ({
          ad: {
            name: ad.name,
            responsive_search_ad: {
              headlines: ad.headlines.filter((h) => h.text.trim()).map((h) => ({
                text: h.text,
                ...(h.pinnedPosition && { pinned_field: `HEADLINE_${h.pinnedPosition}` }),
              })),
              descriptions: ad.descriptions.filter((d) => d.text.trim()).map((d) => ({
                text: d.text,
                ...(d.pinnedPosition && { pinned_field: `DESCRIPTION_${d.pinnedPosition}` }),
              })),
              path1: ad.displayPath1 || undefined,
              path2: ad.displayPath2 || undefined,
            },
            final_urls: [ad.finalUrl || "<FINAL_URL>"],
          },
        })),
      })),
    }),
    ...(creative.calloutExtensions?.length > 0 && {
      campaign_assets_callouts: creative.calloutExtensions.map((co: { text: string }) => ({
        callout_asset: { callout_text: co.text },
      })),
    }),
    ...(creative.structuredSnippetExtensions?.length > 0 && {
      campaign_assets_structured_snippets: creative.structuredSnippetExtensions.map((sn: { header: string; values: string[] }) => ({
        structured_snippet_asset: { header: sn.header, values: sn.values.filter(Boolean) },
      })),
    }),
    ...(isDisplay && {
      display_ad_groups: (creative.displayAdGroups ?? []).map((ag: { name: string; contentKeywords: string[]; topics: string[]; placements: string[]; excludedPlacements: string[]; ads: { name: string; headlines: { text: string }[]; longHeadline: string; descriptions: { text: string }[]; finalUrl: string; businessName: string; callToAction: string; mainColor: string; accentColor: string; allowFlexibleColor: boolean; pricePrefix: string; promoText: string; formatSetting: string; youtubeVideos: string[] }[] }) => ({
        name: ag.name,
        type: "DISPLAY_STANDARD",
        ad_group_criteria: [
          ...ag.contentKeywords.map((kw) => ({ keyword: { text: kw }, type: "KEYWORD" })),
          ...ag.topics.map((t) => ({ topic: { path: t }, type: "TOPIC" })),
          ...ag.placements.map((p) => ({ placement: { url: p }, type: "PLACEMENT", negative: false })),
          ...ag.excludedPlacements.map((p) => ({ placement: { url: p }, type: "PLACEMENT", negative: true })),
        ],
        ad_group_ads: ag.ads.map((ad) => ({
          ad: {
            name: ad.name,
            responsive_display_ad: {
              headlines: ad.headlines.filter((h) => h.text.trim()).map((h) => ({ text: h.text })),
              long_headline: { text: ad.longHeadline },
              descriptions: ad.descriptions.filter((d) => d.text.trim()).map((d) => ({ text: d.text })),
              business_name: ad.businessName || "<BUSINESS_NAME>",
              call_to_action_text: ad.callToAction,
              main_color: ad.mainColor || undefined,
              accent_color: ad.accentColor || undefined,
              allow_flexible_color: ad.allowFlexibleColor,
              price_prefix: ad.pricePrefix || undefined,
              promo_text: ad.promoText || undefined,
              format_setting: ad.formatSetting,
              youtube_videos: ad.youtubeVideos.filter(Boolean).map((v) => ({ id: v })),
            },
            final_urls: [ad.finalUrl || "<FINAL_URL>"],
          },
        })),
      })),
    }),
    ...(isApp && {
      app_ad_group: {
        name: "App Ad Group 1",
        type: "SEARCH_DYNAMIC_ADS",
        cpc_bid_micros: budget.biddingStrategy === "TARGET_CPA" ? Math.round((budget.targetCpa ?? 0) * 1000000) : undefined,
        ad_group_ads: (creative.appAds ?? []).map((ad: { name: string; mandatoryAdText: string; headlines: { text: string }[]; descriptions: { text: string }[]; images: { url?: string }[]; youtubeVideos: string[] }) => ({
          ad: {
            name: ad.name,
            app_ad: {
              mandatory_ad_text: { text: ad.mandatoryAdText || "<AD_TEXT>" },
              headlines: ad.headlines.filter((h) => h.text.trim()).map((h) => ({ text: h.text })),
              descriptions: ad.descriptions.filter((d) => d.text.trim()).map((d) => ({ text: d.text })),
              images: ad.images.map((img) => ({ asset: img.url || "<IMAGE_ASSET>" })),
              youtube_videos: ad.youtubeVideos.filter(Boolean).map((v) => ({ asset: v })),
            },
          },
        })),
      },
    }),
    ...(isDemandGen && {
      ad_groups: (creative.demandGenAdGroups ?? []).map((ag: { name: string; channelControls: Record<string, boolean>; ads: { name: string; adType: string; headlines: { text: string }[]; longHeadlines: { text: string }[]; descriptions: { text: string }[]; businessName: string; finalUrl: string; callToAction: string }[] }) => ({
        name: ag.name,
        demand_gen_ad_group_settings: {
          channel_controls: {
            selected_channels: Object.entries(ag.channelControls).filter(([, v]) => v).map(([k]) => k.replace(/([A-Z])/g, "_$1").toUpperCase()),
          },
        },
        ad_group_ads: ag.ads.map((ad) => ({
          ad: {
            name: ad.name,
            [`demand_gen_${ad.adType === "MULTI_ASSET" ? "multi_asset" : ad.adType === "CAROUSEL" ? "carousel" : "video_responsive"}_ad`]: {
              headlines: ad.headlines.filter((h) => h.text.trim()).map((h) => ({ text: h.text })),
              long_headlines: ad.longHeadlines.filter((h) => h.text.trim()).map((h) => ({ text: h.text })),
              descriptions: ad.descriptions.filter((d) => d.text.trim()).map((d) => ({ text: d.text })),
              business_name: ad.businessName || "<BUSINESS_NAME>",
              call_to_action_selection: ad.callToAction,
            },
            final_urls: [ad.finalUrl || "<FINAL_URL>"],
            ...(ad.adAssetAutomation && {
              asset_automation_settings: Object.entries(ad.adAssetAutomation)
                .filter(([, status]) => status !== "OPTED_IN")
                .map(([type, status]) => ({ automation_type: type, automation_status: status })),
            }),
          },
        })),
      })),
    }),
    geo_targets: audience.locationIds.map((id: string) => ({
      geo_target_constant: id,
    })),
    language_targets: audience.languageIds?.map((id: string) => ({
      language_constant: id,
    })) ?? [],
    conversion_goal: {
      conversion_tracking_mode: objective.conversionTrackingMode,
      ...(objective.conversionTrackingId && { conversion_tracking_id: objective.conversionTrackingId }),
      primary_goal: budget.conversionGoal,
    },
    ...(objective.merchantCenterId && {
      merchant_center: {
        merchant_center_id: objective.merchantCenterId,
      },
    }),
    schedule: {
      start_date: budget.startDate,
      ...(budget.endDate && !budget.endDateOptional && { end_date: budget.endDate }),
    },
  }), [objective, audience, budget, creative, firstGroup, filledHeadlines, filledDescriptions]);

  const jsonString = JSON.stringify(apiJson, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
      setShowLaunchConfirm(false);
    }, 2500);
  };

  /* ---- Launched state ---- */
  if (launched) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-20 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Campaign Launched!</h2>
        <p className="text-sm text-muted-foreground">
          Your Google Ads Performance Max campaign <span className="font-semibold text-foreground">{objective.campaignName}</span> has been submitted for review.
          Google typically reviews ads within 1-2 business days.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => { reset(); setLaunched(false); }}>Create Another Campaign</Button>
          <Button className="gap-1.5" onClick={() => setShowApiJson(true)}>
            <Code2 className="size-3.5" /> View API Response
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">
              <div>
                <h2 className="text-base font-bold text-foreground">Review & Launch</h2>
                <p className="text-xs text-muted-foreground">
                  Review your {objConfig.label} campaign settings and launch when ready.
                </p>
              </div>
            </div>

            {/* Readiness checks */}
            <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Launch Readiness</Label>
                </div>
                <Badge variant={allPassed ? "default" : "secondary"} className="rounded-full text-[10px]">
                  {passedCount}/{checks.length} passed
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                {checks.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 rounded-lg bg-muted/20 px-3 py-2">
                    {c.ok
                      ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      : <AlertCircle className="size-4 shrink-0 text-amber-500" />
                    }
                    <span className="flex-1 text-sm text-foreground">{c.label}</span>
                    <span className="text-xs text-muted-foreground">{c.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Sections */}
            <div className="flex flex-col gap-4">

              {/* ---- Objective ---- */}
              <SectionCard>
                <SectionHeader icon={Zap} title="Objective" step={0} setStep={setStep} />
                <ReviewRow label="Campaign Type" value={objConfig.label} />
                <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
                <ReviewRow label="Conversion Tracking" value={
                  objective.conversionTrackingMode === "salla_managed"
                    ? "Salla Managed (Auto)"
                    : objective.conversionTrackingId
                      ? `ID: ${objective.conversionTrackingId}`
                      : "Not configured"
                } warn={objective.conversionTrackingMode === "none"} />
                {(objective.merchantCenterConnected || objective.merchantCenterId) && (
                  <ReviewRow label="Merchant Center" value={objective.merchantCenterId ? `ID: ${objective.merchantCenterId}` : "Connected"} />
                )}
                {isShopping && (
                  <>
                    <ReviewRow label="Campaign Priority" value={
                      objective.shoppingSettings?.campaignPriority === 2 ? "High" :
                      objective.shoppingSettings?.campaignPriority === 1 ? "Medium" : "Low"
                    } />
                    {objective.shoppingSettings?.feedLabel && (
                      <ReviewRow label="Feed Label" value={objective.shoppingSettings.feedLabel} />
                    )}
                    <ReviewRow label="Local Inventory" value={objective.shoppingSettings?.enableLocal ? "Enabled" : "Disabled"} />
                  </>
                )}
              </SectionCard>

              {/* ---- Audience ---- */}
              <SectionCard>
                <SectionHeader icon={Users} title={isSearch ? "Audience & Targeting" : "Audience Signals"} step={1} setStep={setStep} />
                <ReviewRow label="Locations" value={audience.locationIds.map((c: string) => COUNTRY_MAP[c] || c).join(", ") || "None"} warn={audience.locationIds.length === 0} />
                <ReviewRow label="Languages" value={
                  audience.languageIds?.length > 0
                    ? audience.languageIds.map((l: string) => l === "ar" ? "Arabic" : l === "en" ? "English" : l).join(", ")
                    : audience.languages?.length > 0
                      ? audience.languages.map((l: string) => l === "ar" ? "Arabic" : l === "en" ? "English" : l).join(", ")
                      : "All languages"
                } />

                {/* Search-specific audience fields */}
                {isSearch && (
                  <>
                    <ReviewRow label="Audience Mode" value={audience.audienceTargetingMode === "TARGETING" ? "Targeting (restricted)" : "Observation (recommended)"} />
                    <ReviewRow label="Audience Segments" value={
                      (audience.inMarketSegments?.length ?? 0) + (audience.affinitySegments?.length ?? 0) > 0
                        ? `${(audience.inMarketSegments?.length ?? 0) + (audience.affinitySegments?.length ?? 0)} segments`
                        : "None"
                    } />
                    <ReviewRow label="RLSA Lists" value={
                      audience.audienceSignals?.length > 0
                        ? `${audience.audienceSignals.length} list${audience.audienceSignals.length !== 1 ? "s" : ""}`
                        : "None"
                    } />
                    <ReviewRow label="Search Partners" value={audience.searchPartners !== false ? "Enabled" : "Disabled"} />
                    <ReviewRow label="Ad Schedule" value={
                      audience.adScheduleEntries?.length > 0
                        ? `${audience.adScheduleEntries.length} entr${audience.adScheduleEntries.length !== 1 ? "ies" : "y"}`
                        : "24/7 (all day)"
                    } />
                    {audience.householdIncome?.length > 0 && (
                      <ReviewRow label="Household Income" value={`${audience.householdIncome.length} tier${audience.householdIncome.length !== 1 ? "s" : ""}`} />
                    )}
                    {audience.parentalStatus?.length > 0 && (
                      <ReviewRow label="Parental Status" value={audience.parentalStatus.join(", ")} />
                    )}
                  </>
                )}

                {/* PMax / non-search fields */}
                {!isShopping && !isSearch && (
                  <>
                    <ReviewRow label="Search Themes" value={
                      audience.searchThemes?.length > 0
                        ? `${audience.searchThemes.length} theme${audience.searchThemes.length !== 1 ? "s" : ""}`
                        : "None"
                    } />
                    <ReviewRow label="Custom Segments" value={
                      ((audience.customSegmentKeywords?.length ?? 0) + (audience.customSegmentUrls?.length ?? 0)) > 0
                        ? `${audience.customSegmentKeywords?.length ?? 0} keywords, ${audience.customSegmentUrls?.length ?? 0} URLs`
                        : "None"
                    } />
                  </>
                )}
                {isShopping && (
                  <ReviewRow label="Negative Keywords" value={
                    audience.negativeKeywords?.length > 0
                      ? `${audience.negativeKeywords.length} keyword${audience.negativeKeywords.length !== 1 ? "s" : ""}`
                      : "None"
                  } />
                )}
                {!isSearch && (
                  <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
                )}
              </SectionCard>

              {/* ---- Budget & Bidding ---- */}
              <SectionCard>
                <SectionHeader icon={DollarSign} title="Budget & Bidding" step={2} setStep={setStep} />
                <ReviewRow label="Daily Budget" value={`SAR ${budget.amount}`} />
                <ReviewRow label="Bidding Strategy" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
                {budget.biddingStrategy === "TARGET_CPA" && (
                  <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />
                )}
                {budget.biddingStrategy === "TARGET_ROAS" && (
                  <ReviewRow label="Target ROAS" value={`${((budget.targetRoas ?? 1) * 100).toFixed(0)}%`} />
                )}
                <ReviewRow label="Conversion Goal" value={CONVERSION_LABELS[budget.conversionGoal] || budget.conversionGoal} />
                <ReviewRow label="Schedule" value={
                  budget.endDate && !budget.endDateOptional
                    ? `${budget.startDate ?? "Today"} to ${budget.endDate}`
                    : `${budget.startDate ?? "Today"} (No end date)`
                } />
                <ReviewRow label="URL Expansion" value={budget.urlExpansionOptOut ? "Disabled" : "Enabled"} />
                <ReviewRow label="Salla Performance Boost" value={budget.performanceBoost ? "SAR 149/mo" : "Off"} />
              </SectionCard>

              {/* ---- AI Features (PMax + Search + Demand Gen) ---- */}
              {(isPMax || isSearch || isDemandGen) && (
                <SectionCard className="border-primary/20 bg-primary/[0.02]">
                  <SectionHeader icon={Sparkles} title="AI Features" step={2} setStep={setStep} />

                  {/* Campaign-level asset automation (PMax + Search) */}
                  {(isPMax || isSearch) && (
                    <>
                      <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Campaign Asset Automation</p>
                      {(() => {
                        const automationEntries = budget.assetAutomationSettings ?? [];
                        const getStatus = (type: string) => {
                          const entry = automationEntries.find((e: { type: string }) => e.type === type);
                          return entry?.status ?? "OPTED_IN";
                        };
                        const types = isPMax
                          ? ["TEXT_ASSET_AUTOMATION", "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", "GENERATE_IMAGE_EXTRACTION", "GENERATE_IMAGE_ENHANCEMENT", "GENERATE_ENHANCED_YOUTUBE_VIDEOS"]
                          : ["TEXT_ASSET_AUTOMATION", "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", "GENERATE_IMAGE_ENHANCEMENT"];
                        const labels: Record<string, string> = {
                          TEXT_ASSET_AUTOMATION: "Text Generation",
                          FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION: "URL Text Generation",
                          GENERATE_IMAGE_EXTRACTION: "Image Extraction",
                          GENERATE_IMAGE_ENHANCEMENT: "Image Enhancement",
                          GENERATE_ENHANCED_YOUTUBE_VIDEOS: "Video Enhancement",
                        };
                        return (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {types.map((type) => {
                              const isOn = getStatus(type) === "OPTED_IN";
                              return (
                                <Badge key={type} variant="secondary" className={cn("rounded-full px-2 py-0.5 text-[9px]", isOn ? "border-primary/30 bg-primary/10 text-primary" : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400")}>
                                  {isOn ? "ON" : "OFF"}: {labels[type] ?? type}
                                </Badge>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* AI Max for Search */}
                  {isSearch && (
                    <>
                      <div className="mb-2 border-t border-border pt-2">
                        <ReviewRow label="AI Max for Search" value={budget.aiMaxSettings?.enableAiMax ? "Enabled" : "Disabled"} />
                        {budget.aiMaxSettings?.enableAiMax && (
                          <>
                            {budget.aiMaxSettings.brandInclusions?.length > 0 && (
                              <ReviewRow label="Brand Inclusions" value={budget.aiMaxSettings.brandInclusions.join(", ")} />
                            )}
                            {budget.aiMaxSettings.brandExclusions?.length > 0 && (
                              <ReviewRow label="Brand Exclusions" value={budget.aiMaxSettings.brandExclusions.join(", ")} />
                            )}
                            {budget.aiMaxSettings.urlInclusions?.length > 0 && (
                              <ReviewRow label="URL Restrictions" value={budget.aiMaxSettings.urlInclusions.join(", ")} />
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Demand Gen ad-level automation */}
                  {isDemandGen && (
                    <>
                      <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Ad Creative Automation</p>
                      {(() => {
                        const firstAd = creative.demandGenAdGroups?.[0]?.ads?.[0];
                        const auto = firstAd?.adAssetAutomation ?? {};
                        const items = [
                          { key: "GENERATE_DESIGN_VERSIONS_FOR_IMAGES", label: "Image Versions" },
                          { key: "GENERATE_SHORTER_YOUTUBE_VIDEOS", label: "Short Videos" },
                          { key: "GENERATE_VERTICAL_YOUTUBE_VIDEOS", label: "Vertical Videos" },
                          { key: "GENERATE_VIDEOS_FROM_OTHER_ASSETS", label: "Videos from Images" },
                        ];
                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {items.map(({ key, label }) => {
                              const isOn = (auto[key] ?? "OPTED_IN") === "OPTED_IN";
                              return (
                                <Badge key={key} variant="secondary" className={cn("rounded-full px-2 py-0.5 text-[9px]", isOn ? "border-primary/30 bg-primary/10 text-primary" : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400")}>
                                  {isOn ? "ON" : "OFF"}: {label}
                                </Badge>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </SectionCard>
              )}

              {/* ---- Creative / Assets ---- */}
              {isApp ? (
                <SectionCard>
                  <SectionHeader icon={Smartphone} title="App Ads" step={3} setStep={setStep} />
                  <ReviewRow label="App Store" value={objective.appSettings?.appStore === "GOOGLE_APP_STORE" ? "Google Play" : "Apple App Store"} />
                  <ReviewRow label="App ID" value={objective.appSettings?.appId || "Not set"} />
                  {objective.appSettings?.appName && <ReviewRow label="App Name" value={objective.appSettings.appName} />}
                  <ReviewRow label="Campaign Goal" value={
                    objective.appSettings?.biddingStrategyGoalType === "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST" ? "App Installs (Target CPI)" :
                    objective.appSettings?.biddingStrategyGoalType === "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_INSTALL_COST" ? "In-App Actions (Install Cost)" :
                    objective.appSettings?.biddingStrategyGoalType === "OPTIMIZE_IN_APP_CONVERSIONS_TARGET_CONVERSION_COST" ? "In-App Actions (Target CPA)" :
                    "ROAS"
                  } />
                  <ReviewRow label="App Ads" value={`${creative.appAds?.length ?? 0}`} />
                  {(creative.appAds ?? []).map((ad: { id: string; name: string; mandatoryAdText: string; headlines: { text: string }[]; descriptions: { text: string }[]; images: unknown[]; youtubeVideos: string[] }, ai: number) => (
                    <div key={ad.id} className="ml-2 mt-2 border-l-2 border-primary/20 pl-2">
                      <p className="text-[11px] font-medium text-foreground">{ad.name || `App Ad ${ai + 1}`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Mandatory text: {ad.mandatoryAdText?.trim() ? `"${ad.mandatoryAdText.slice(0, 40)}${ad.mandatoryAdText.length > 40 ? "..." : ""}"` : "missing"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ad.headlines?.filter((h: { text: string }) => h.text?.trim()).length ?? 0}/5 headlines, {ad.descriptions?.filter((d: { text: string }) => d.text?.trim()).length ?? 0}/5 descriptions
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ad.images?.length ?? 0} images, {ad.youtubeVideos?.filter(Boolean).length ?? 0} videos
                      </p>
                    </div>
                  ))}
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-1 text-xs font-semibold text-foreground">Targeting</p>
                    <ReviewRow label="Method" value="Automated (Google AI)" />
                    <ReviewRow label="Networks" value="Search, Play, YouTube, Discover, Display" />
                  </div>
                </SectionCard>
              ) : isDisplay ? (
                <SectionCard>
                  <SectionHeader icon={Layers} title="Display Ads" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Groups" value={`${creative.displayAdGroups?.length ?? 0}`} />
                  {(creative.displayAdGroups ?? []).map((ag: { id: string; name: string; contentKeywords: string[]; topics: string[]; placements: string[]; excludedPlacements: string[]; ads: { id: string; name: string; headlines: { text: string }[]; longHeadline: string; descriptions: { text: string }[]; finalUrl: string; businessName: string; images: unknown[]; squareImages: unknown[]; logos: unknown[]; squareLogos: unknown[] }[] }, gi: number) => (
                    <div key={ag.id} className={cn("mt-3 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
                      <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
                      <ReviewRow label="Content Keywords" value={`${ag.contentKeywords?.length ?? 0}`} />
                      <ReviewRow label="Topics" value={`${ag.topics?.length ?? 0}`} />
                      <ReviewRow label="Placements" value={`${ag.placements?.length ?? 0}`} />
                      {(ag.excludedPlacements?.length ?? 0) > 0 && (
                        <ReviewRow label="Excluded Placements" value={`${ag.excludedPlacements.length}`} />
                      )}
                      <ReviewRow label="RDA Ads" value={`${ag.ads?.length ?? 0}`} />
                      {(ag.ads ?? []).map((ad, ai: number) => {
                        const hCount = ad.headlines?.filter((h: { text: string }) => h.text?.trim()).length ?? 0;
                        const dCount = ad.descriptions?.filter((d: { text: string }) => d.text?.trim()).length ?? 0;
                        return (
                          <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                            <p className="text-[11px] font-medium text-foreground">{ad.name || `RDA ${ai + 1}`}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {hCount}/5 headlines, {dCount}/5 descriptions, long headline: {ad.longHeadline?.trim() ? "set" : "missing"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {ad.images?.length ?? 0} landscape, {ad.squareImages?.length ?? 0} square, {(ad.logos?.length ?? 0) + (ad.squareLogos?.length ?? 0)} logos
                              {ad.finalUrl ? ` | ${ad.finalUrl}` : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-1 text-xs font-semibold text-foreground">Audience</p>
                    <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
                    {audience.inMarketSegments?.length > 0 && (
                      <ReviewRow label="In-Market Segments" value={`${audience.inMarketSegments.length}`} />
                    )}
                    {audience.affinitySegments?.length > 0 && (
                      <ReviewRow label="Affinity Segments" value={`${audience.affinitySegments.length}`} />
                    )}
                    {audience.audienceSignals?.length > 0 && (
                      <ReviewRow label="Remarketing Lists" value={`${audience.audienceSignals.length}`} />
                    )}
                  </div>
                </SectionCard>
              ) : isSearch ? (
                <SectionCard>
                  <SectionHeader icon={Search} title="Search Ads" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Groups" value={`${creative.searchAdGroups?.length ?? 0}`} />
                  {(creative.searchAdGroups ?? []).map((ag: { id: string; name: string; keywords: { text: string; matchType: string }[]; negativeKeywords: { text: string }[]; ads: { id: string; name: string; headlines: { text: string }[]; descriptions: { text: string }[]; finalUrl: string; displayPath1: string; displayPath2: string }[] }, gi: number) => (
                    <div key={ag.id} className={cn("mt-3 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
                      <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
                      <ReviewRow label="Keywords" value={`${ag.keywords?.length ?? 0} (${["BROAD", "PHRASE", "EXACT"].map((mt) => {
                        const c = ag.keywords?.filter((k: { matchType: string }) => k.matchType === mt).length ?? 0;
                        return c > 0 ? `${c} ${mt.toLowerCase()}` : null;
                      }).filter(Boolean).join(", ") || "none"})`} />
                      <ReviewRow label="Negative Keywords" value={`${ag.negativeKeywords?.length ?? 0}`} />
                      <ReviewRow label="RSA Ads" value={`${ag.ads?.length ?? 0}`} />
                      {(ag.ads ?? []).map((ad, ai: number) => {
                        const hCount = ad.headlines?.filter((h: { text: string }) => h.text?.trim()).length ?? 0;
                        const dCount = ad.descriptions?.filter((d: { text: string }) => d.text?.trim()).length ?? 0;
                        return (
                          <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                            <p className="text-[11px] font-medium text-foreground">{ad.name || `RSA ${ai + 1}`}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {hCount}/15 headlines, {dCount}/4 descriptions
                              {ad.finalUrl ? ` | ${ad.finalUrl}` : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {/* Extensions summary */}
                  {(creative.sitelinkExtensions?.length > 0 || creative.calloutExtensions?.length > 0 || creative.structuredSnippetExtensions?.length > 0) && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="mb-1 text-xs font-semibold text-foreground">Ad Extensions</p>
                      {creative.sitelinkExtensions?.length > 0 && (
                        <ReviewRow label="Sitelinks" value={`${creative.sitelinkExtensions.length}`} />
                      )}
                      {creative.calloutExtensions?.length > 0 && (
                        <ReviewRow label="Callouts" value={creative.calloutExtensions.map((c: { text: string }) => c.text).filter(Boolean).join(", ") || `${creative.calloutExtensions.length}`} />
                      )}
                      {creative.structuredSnippetExtensions?.length > 0 && (
                        <ReviewRow label="Structured Snippets" value={`${creative.structuredSnippetExtensions.length}`} />
                      )}
                    </div>
                  )}
                </SectionCard>
              ) : isShopping ? (
                <SectionCard>
                  <SectionHeader icon={FolderTree} title="Product Groups" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Type" value="Shopping Product Ads (auto-generated)" />
                  <ReviewRow label="Product Source" value="Merchant Center Feed" />
                  <ReviewRow label="Active Products" value="1,198 approved" />
                  <ReviewRow label="Negative Keywords" value={
                    creative.negativeKeywords?.length > 0
                      ? `${creative.negativeKeywords.length} keyword${creative.negativeKeywords.length !== 1 ? "s" : ""}`
                      : audience.negativeKeywords?.length > 0
                        ? `${audience.negativeKeywords.length} keyword${audience.negativeKeywords.length !== 1 ? "s" : ""}`
                        : "None"
                  } />
                </SectionCard>
              ) : isDemandGen ? (
                <SectionCard>
                  <SectionHeader icon={Layers} title="Demand Gen Ad Groups" step={3} setStep={setStep} />
                  <ReviewRow label="Ad Groups" value={`${creative.demandGenAdGroups?.length ?? 0}`} />
                  <ReviewRow label="Total Ads" value={`${(creative.demandGenAdGroups ?? []).reduce((sum: number, g: { ads: unknown[] }) => sum + g.ads.length, 0)}`} />
                  {(creative.demandGenAdGroups ?? []).map((ag: { id: string; name: string; channelControls: Record<string, boolean>; ads: { id: string; name: string; adType: string; headlines: { text: string }[]; descriptions: { text: string }[] }[] }, gi: number) => (
                    <div key={ag.id} className={cn("mt-3 rounded-lg border border-border p-3", gi > 0 && "mt-2")}>
                      <p className="mb-1.5 text-xs font-semibold text-foreground">{ag.name || `Ad Group ${gi + 1}`}</p>
                      <ReviewRow label="Channels" value={
                        Object.entries(ag.channelControls ?? {})
                          .filter(([, v]) => v)
                          .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase()))
                          .join(", ") || "None"
                      } />
                      <ReviewRow label="Ads" value={`${ag.ads.length}`} />
                      {ag.ads.map((ad: { id: string; name: string; adType: string; headlines: { text: string }[]; descriptions: { text: string }[] }, ai: number) => (
                        <div key={ad.id} className="ml-2 mt-1 border-l-2 border-primary/20 pl-2">
                          <p className="text-[11px] font-medium text-foreground">{ad.name || `Ad ${ai + 1}`}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ad.adType === "MULTI_ASSET" ? "Multi-Asset" : ad.adType === "CAROUSEL" ? "Carousel" : "Video Responsive"}{" "}
                            | {ad.headlines?.filter((h: { text: string }) => h.text?.trim()).length ?? 0} headlines,{" "}
                            {ad.descriptions?.filter((d: { text: string }) => d.text?.trim()).length ?? 0} descriptions
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                  {audience.lookalikeSegments?.length > 0 && (
                    <ReviewRow label="Lookalike Segments" value={`${audience.lookalikeSegments.length} segment${audience.lookalikeSegments.length !== 1 ? "s" : ""} (${audience.lookalikeExpansion})`} />
                  )}
                  {audience.customerMatchLists?.length > 0 && (
                    <ReviewRow label="Customer Match" value={`${audience.customerMatchLists.length} list${audience.customerMatchLists.length !== 1 ? "s" : ""}`} />
                  )}
                </SectionCard>
              ) : (
                <SectionCard>
                  <SectionHeader icon={Layers} title="Asset Group" step={3} setStep={setStep} />
                  <ReviewRow label="Asset Groups" value={`${creative.assetGroups?.length ?? 0} group${(creative.assetGroups?.length ?? 0) !== 1 ? "s" : ""}`} />
                  {firstGroup && (
                    <>
                      <ReviewRow label="Group Name" value={firstGroup.name || "Unnamed"} />
                      <ReviewRow label="Final URL" value={firstGroup.finalUrl || "Not set"} warn={!firstGroup.finalUrl} />
                      <ReviewRow label="Headlines" value={`${filledHeadlines} filled`} warn={filledHeadlines < 3} />
                      <ReviewRow label="Long Headlines" value={`${firstGroup.longHeadlines?.filter((h: { text?: string }) => (h.text ?? "").trim()).length ?? 0} filled`} />
                      <ReviewRow label="Descriptions" value={`${filledDescriptions} filled`} warn={filledDescriptions < 2} />
                      <ReviewRow label="Images" value={`${firstGroup.images?.length ?? 0} uploaded`} />
                      <ReviewRow label="Logos" value={`${firstGroup.logos?.length ?? 0} uploaded`} />
                      <ReviewRow label="Videos" value={`${firstGroup.videos?.length ?? 0} linked`} />
                      <ReviewRow label="Business Name" value={firstGroup.businessName || "Not set"} />
                      <ReviewRow label="CTA" value={firstGroup.callToAction === "AUTOMATED" ? "Automated" : firstGroup.callToAction ?? "Not set"} />
                    </>
                  )}
                </SectionCard>
              )}

              {/* ---- Cost Summary ---- */}
              <SectionCard className="border-primary/30 bg-primary/[0.02]">
                <div className="mb-4 flex items-center gap-2">
                  <Wallet className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Cost Summary</Label>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily budget</span>
                    <span className="font-medium text-foreground">SAR {budget.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated duration</span>
                    <span className="font-medium text-foreground">{durationDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated ad spend</span>
                    <span className="font-medium text-foreground">SAR {(budget.amount * durationDays).toLocaleString()}</span>
                  </div>
                  {budget.performanceBoost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salla Performance Boost</span>
                      <span className="font-medium text-primary">SAR 149</span>
                    </div>
                  )}
                  {(isPMax || isSearch) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Automation</span>
                      <span className="font-medium text-foreground">
                        {(() => {
                          const entries = budget.assetAutomationSettings ?? [];
                          const offCount = entries.filter((e: { status: string }) => e.status === "OPTED_OUT").length;
                          return offCount > 0 ? `${offCount} disabled` : "All on";
                        })()}
                      </span>
                    </div>
                  )}
                  {isSearch && budget.aiMaxSettings?.enableAiMax && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Max</span>
                      <span className="font-medium text-amber-600">Enabled</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Total estimated cost</span>
                    <span className="font-bold text-primary">SAR {totalBudget.toLocaleString()}</span>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Promo code"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="h-9 pl-9 text-sm"
                      disabled={couponApplied}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!coupon.trim() || couponApplied}
                    onClick={() => setCouponApplied(true)}
                  >
                    {couponApplied ? "Applied" : "Apply"}
                  </Button>
                </div>
              </SectionCard>

              {/* ---- API JSON toggle ---- */}
              <SectionCard>
                <button
                  type="button"
                  onClick={() => setShowApiJson(!showApiJson)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <Code2 className="size-4 text-primary" />
                  <span className="flex-1 text-sm font-semibold text-foreground">
                    Google Ads API Payload
                  </span>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {showApiJson ? "Hide" : "Show"}
                  </Badge>
                </button>
                {showApiJson && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Payload structure for Google Ads API v18
                      </p>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopyJson}>
                        <Copy className="size-3" />
                        {jsonCopied ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                    <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/30 p-4 text-xs leading-relaxed text-foreground">
                      {jsonString}
                    </pre>
                  </div>
                )}
              </SectionCard>

              {/* ---- Terms & Launch ---- */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-border"
                  />
                  <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                    I agree to the <span className="font-medium text-primary">Google Ads Terms of Service</span>,{" "}
                    <span className="font-medium text-primary">Salla Advertising Agreement</span>, and confirm that I have authority to manage advertising for this account.
                    I understand that Google may review my ads and assets before serving them.
                  </label>
                </div>
              </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN                                                  */}
        {/* ============================================================ */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Campaign card */}
            <SectionCard className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <p className="text-xs font-bold text-foreground">{objective.campaignName || "Untitled"}</p>
              </div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">{objConfig.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily budget</span>
                  <span className="font-medium text-foreground">SAR {budget.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bidding</span>
                  <span className="font-medium text-foreground">{BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isApp ? "App Ads" : isDisplay ? "Display Ad Groups" : isSearch ? "Ad Groups" : isShopping ? "Product Groups" : isDemandGen ? "Ad Format" : "Asset Groups"}
                  </span>
                  <span className="font-medium text-foreground">
                    {isApp ? `${creative.appAds?.length ?? 0} ads` : isDisplay ? `${creative.displayAdGroups?.length ?? 0} groups` : isSearch ? `${creative.searchAdGroups?.length ?? 0} groups` : isShopping ? "Feed-based" : isDemandGen ? (
                      objective.demandGenAdType === "MULTI_ASSET" ? "Multi-Asset" :
                      objective.demandGenAdType === "CAROUSEL" ? "Carousel" : "Video Responsive"
                    ) : (creative.assetGroups?.length ?? 0)}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Google Channels */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">
                {isApp ? "App Channels" : isDisplay ? "Display Channels" : isSearch ? "Search Channels" : isShopping ? "Shopping Channels" : isDemandGen ? "Demand Gen Channels" : "PMax Channels"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(isApp
                  ? ["Google Search", "Google Play", "YouTube", "Discover", "Display Network"]
                  : isDisplay
                  ? ["Google Display Network", "YouTube", "Gmail", "Partner Sites"]
                  : isSearch
                  ? ["Google Search", "Search Partners"]
                  : isShopping
                  ? ["Google Shopping", "Search", "Partner Sites", ...(objective.shoppingSettings?.enableLocal ? ["Local"] : [])]
                  : isDemandGen
                    ? Object.entries(objective.demandGenChannels ?? {})
                        .filter(([, v]) => v)
                        .map(([k]) => k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()))
                    : ["Search", "Display", "YouTube", "Discover", "Gmail", "Maps"]
                ).map((ch) => (
                  <Badge key={ch} variant="secondary" className="rounded-full text-[10px]">{ch}</Badge>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {isApp
                  ? "App ads are automatically served across Google Search, Play Store, YouTube, Discover, and the Display Network to maximize installs and in-app actions."
                  : isDisplay
                  ? "Display ads appear across 3M+ websites and apps on the Google Display Network, YouTube, and Gmail."
                  : isSearch
                  ? "Search ads appear at the top and bottom of Google Search results when users search for your keywords."
                  : isShopping
                  ? "Shopping ads appear as product listings on Google Shopping, Search results, and partner sites."
                  : isDemandGen
                    ? "Demand Gen ads appear across YouTube, Discover, Gmail, and optionally Display to drive awareness and conversions."
                    : "Performance Max automatically serves ads across all Google channels to maximize results."
                }
              </p>
            </SectionCard>

            {/* Pre-launch check */}
            <SectionCard className="p-4">
              <p className="mb-3 text-xs font-bold text-foreground">Launch Checklist</p>
              <div className="flex flex-col gap-2 text-[11px]">
                {checks.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    {c.ok
                      ? <CheckCircle2 className="size-3 text-emerald-500" />
                      : <AlertCircle className="size-3 text-amber-500" />
                    }
                    <span className={cn(c.ok ? "text-muted-foreground" : "text-amber-600")}>{c.label}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Google tips */}
            <SectionCard className="p-4">
              <p className="text-xs font-semibold text-foreground">
                {isSearch ? "Search Tips" : isShopping ? "Shopping Tips" : isDemandGen ? "Demand Gen Tips" : "Google Ads Tips"}
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-xs leading-relaxed text-muted-foreground">
                {isSearch ? (
                  <>
                    <li>- Add 15 unique headlines for best ad combinations</li>
                    <li>- Use all 4 descriptions for maximum reach</li>
                    <li>- Include keywords in headlines for relevance</li>
                    <li>- Add sitelinks and callouts to improve CTR</li>
                  </>
                ) : isShopping ? (
                  <>
                    <li>- Shopping campaigns need 1-2 weeks to learn</li>
                    <li>- Optimize product titles and images in your store</li>
                    <li>- Use negative keywords to reduce wasted spend</li>
                  </>
                ) : isDemandGen ? (
                  <>
                    <li>- Demand Gen needs 2-3 weeks to fully optimize</li>
                    <li>- Use lifestyle images with products in context</li>
                    <li>- Video ads on Shorts get 2-3x more engagement</li>
                    <li>- Add lookalike audiences for best targeting</li>
                  </>
                ) : (
                  <>
                    <li>- PMax campaigns need 1-2 weeks to optimize</li>
                    <li>- Keep URL expansion ON for broader reach</li>
                    <li>- Add at least 15 headlines for best performance</li>
                  </>
                )}
                <li>- Google reviews ads within 1-2 business days</li>
              </ul>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* Launch Confirmation Dialog */}
      <Dialog open={showLaunchConfirm} onOpenChange={setShowLaunchConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Launch Campaign?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            You are about to launch <span className="font-semibold text-foreground">{objective.campaignName}</span> as a <span className="font-semibold text-foreground">{objConfig.label}</span> campaign with a daily budget of <span className="font-semibold text-foreground">SAR {budget.amount}</span>.
          </p>
          <p className="text-xs text-muted-foreground">
            Google will review your ads and assets. Delivery usually starts within 24-48 hours after approval.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowLaunchConfirm(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={handleLaunch} disabled={launching}>
              {launching ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="size-3.5" />
                  Confirm Launch
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <WizardStepFooter
        onPrevious={() => setStep(3)}
        onNext={() => setShowLaunchConfirm(true)}
        previousLabel="Previous"
        nextLabel="Launch Campaign"
        nextDisabled={!allPassed || !agreedToTerms || launching}
        nextLoading={launching}
        nextIcon={<Rocket className="size-4" />}
        secondaryAction={{
          label: savedAsDraft ? "Draft Saved" : "Save Draft",
          onClick: () => setSavedAsDraft(true),
          disabled: savedAsDraft,
        }}
      />
    </TooltipProvider>
  );
}
