"use client";

import { useState, useMemo } from "react";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, type DV360VideoAd } from "@/lib/dv360/campaign-types";
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
  Eye,
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
  Code2,
  ArrowLeft,
  Play,
  MonitorPlay,
  Tv,
  Smartphone,
  Monitor,
  Tablet,
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
        <Icon className="size-4 text-red-600" />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
      </div>
      <button
        type="button"
        onClick={() => setStep(step)}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Pencil className="size-3" />
        Edit
      </button>
    </div>
  );
}

const BIDDING_LABELS: Record<string, string> = {
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPV: "Manual CPV",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPM: "Manual CPM",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM: "Target CPM",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPA: "Target CPA",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_ROAS: "Target ROAS",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_LIFT: "Maximize Lift",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS: "Maximize Conversions",
};

const FORMAT_LABELS: Record<string, string> = {
  SKIPPABLE_IN_STREAM: "Skippable In-Stream",
  NON_SKIPPABLE_IN_STREAM: "Non-Skippable (15s)",
  BUMPER: "Bumper (6s)",
  IN_FEED: "In-Feed",
  SHORTS: "YouTube Shorts",
};

const PACING_LABELS: Record<string, string> = {
  PACING_TYPE_EVEN: "Even (recommended)",
  PACING_TYPE_AHEAD: "Ahead",
  PACING_TYPE_ASAP: "ASAP",
};

const FREQ_LABELS: Record<string, string> = {
  TIME_UNIT_DAYS: "per day",
  TIME_UNIT_WEEKS: "per week",
  TIME_UNIT_MONTHS: "per month",
  TIME_UNIT_LIFETIME: "lifetime",
  TIME_UNIT_HOURS: "per hour",
  TIME_UNIT_MINUTES: "per minute",
};

const DEVICE_ICONS: Record<string, React.ElementType> = {
  DESKTOP: Monitor,
  MOBILE: Smartphone,
  TABLET: Tablet,
  CONNECTED_TV: Tv,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DV360StepReview() {
  const { campaign, setStep } = useDV360Campaign();
  const { objective, audience, budget, creative } = campaign;
  const config = DV360_OBJECTIVE_CONFIGS[objective.objective];

  const [showApiJson, setShowApiJson] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAwareness = objective.objective === "AWARENESS";
  const isConsideration = objective.objective === "CONSIDERATION";
  const isConversion = objective.objective === "CONVERSION";
  const isPerformance = objective.objective === "PERFORMANCE";

  /* ---- Duration ---- */
  const durationDays = useMemo(() => {
    if (!budget.startDate || !budget.endDate) return 30;
    const diff = new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime();
    return Math.max(1, Math.round(diff / 86400000));
  }, [budget.startDate, budget.endDate]);

  const totalBudget = budget.budgetAmount + (budget.performanceBoost ? 149 : 0);

  /* ---- Validation Checks ---- */
  const checks = useMemo(() => {
    const list: { id: string; label: string; ok: boolean; detail: string }[] = [];
    list.push({
      id: "name",
      label: "Campaign name set",
      ok: !!objective.campaignName.trim(),
      detail: objective.campaignName || "not set",
    });
    list.push({
      id: "geo",
      label: "Location targeting configured",
      ok: audience.geoTargets.length > 0,
      detail: `${audience.geoTargets.length} location(s)`,
    });
    list.push({
      id: "budget",
      label: "Budget configured",
      ok: budget.budgetAmount > 0,
      detail: `SAR ${budget.budgetAmount.toLocaleString()}`,
    });
    list.push({
      id: "dates",
      label: "Campaign dates set",
      ok: !!budget.startDate && !!budget.endDate,
      detail: budget.startDate && budget.endDate ? `${budget.startDate} - ${budget.endDate}` : "not set",
    });
    list.push({
      id: "video",
      label: "At least one video ad",
      ok: creative.videoAds.some((v: DV360VideoAd) => v.youtubeVideoUrl.trim()),
      detail: `${creative.videoAds.filter((v: DV360VideoAd) => v.youtubeVideoUrl.trim()).length} video(s)`,
    });
    if (config.conversionTrackingRequired) {
      list.push({
        id: "conversion",
        label: "Conversion tracking configured",
        ok: !!objective.floodlightActivityId.trim(),
        detail: objective.floodlightActivityId || "not set",
      });
    }
    list.push({
      id: "inventory",
      label: "Inventory source selected",
      ok: audience.inventorySources.length > 0,
      detail: audience.inventorySources.join(", "),
    });
    if (isAwareness) {
      list.push({
        id: "cpm_bid",
        label: "CPM bid or Maximize Lift set",
        ok: !!(budget.targetCpm && budget.targetCpm > 0) || budget.biddingStrategy.includes("MAXIMIZE_LIFT"),
        detail: budget.targetCpm ? `SAR ${budget.targetCpm.toFixed(2)}` : budget.biddingStrategy.includes("MAXIMIZE_LIFT") ? "Maximize Lift" : "not set",
      });
      list.push({
        id: "reach_format",
        label: "Reach-optimized ad format",
        ok: creative.videoAds.some((v: DV360VideoAd) => v.videoFormat === "SKIPPABLE_IN_STREAM" || v.videoFormat === "NON_SKIPPABLE_IN_STREAM" || v.videoFormat === "BUMPER"),
        detail: creative.videoAds.map((v: DV360VideoAd) => v.videoFormat).join(", "),
      });
    }
    if (isConsideration) {
      list.push({
        id: "cpv_bid",
        label: "CPV bid set (Consideration)",
        ok: !!(budget.targetCpv && budget.targetCpv > 0) || budget.biddingStrategy.includes("MAXIMIZE_LIFT") || budget.biddingStrategy.includes("TARGET_CPM"),
        detail: budget.targetCpv ? `SAR ${budget.targetCpv.toFixed(2)}` : budget.biddingStrategy.includes("TARGET_CPM") ? "Target CPM" : "not set",
      });
      list.push({
        id: "view_format",
        label: "View-optimized ad format",
        ok: creative.videoAds.some((v: DV360VideoAd) => v.videoFormat === "SKIPPABLE_IN_STREAM" || v.videoFormat === "IN_FEED" || v.videoFormat === "SHORTS"),
        detail: creative.videoAds.map((v: DV360VideoAd) => v.videoFormat).join(", "),
      });
    }
    if (isConversion) {
      list.push({
        id: "cpa_bid",
        label: "CPA bid or Maximize Conversions set",
        ok: !!(budget.targetCpa && budget.targetCpa > 0) || budget.biddingStrategy.includes("MAXIMIZE_CONVERSIONS"),
        detail: budget.targetCpa ? `SAR ${budget.targetCpa.toFixed(0)}` : budget.biddingStrategy.includes("MAXIMIZE_CONVERSIONS") ? "Maximize Conversions" : "not set",
      });
      list.push({
        id: "action_format",
        label: "Action-optimized ad format",
        ok: creative.videoAds.some((v: DV360VideoAd) => v.videoFormat === "SKIPPABLE_IN_STREAM" || v.videoFormat === "IN_FEED"),
        detail: creative.videoAds.map((v: DV360VideoAd) => v.videoFormat).join(", "),
      });
      list.push({
        id: "cta_set",
        label: "Call-to-action configured",
        ok: creative.videoAds.some((v: DV360VideoAd) => !!v.callToAction),
        detail: creative.videoAds.map((v: DV360VideoAd) => v.callToAction || "none").join(", "),
      });
      list.push({
        id: "landing_page",
        label: "Landing page URL set",
        ok: creative.videoAds.some((v: DV360VideoAd) => !!v.landingPageUrl.trim()),
        detail: creative.videoAds.some((v: DV360VideoAd) => !!v.landingPageUrl.trim()) ? "configured" : "not set",
      });
    }
    if (isPerformance) {
      list.push({
        id: "perf_bidding",
        label: "Performance bidding configured",
        ok: !!(budget.targetCpa && budget.targetCpa > 0) || !!(budget.targetRoas && budget.targetRoas > 0) || budget.biddingStrategy.includes("MAXIMIZE_CONVERSIONS"),
        detail: budget.targetRoas ? `ROAS ${budget.targetRoas}%` : budget.targetCpa ? `CPA SAR ${budget.targetCpa}` : budget.biddingStrategy.includes("MAXIMIZE_CONVERSIONS") ? "Maximize Conversions" : "not set",
      });
      list.push({
        id: "multi_format",
        label: "Multiple video formats (recommended)",
        ok: creative.videoAds.length >= 2,
        detail: `${creative.videoAds.length} asset(s) -- ${creative.videoAds.length >= 3 ? "optimal" : creative.videoAds.length >= 2 ? "good" : "add more for AI optimization"}`,
      });
      list.push({
        id: "perf_cta",
        label: "Call-to-action on all ads",
        ok: creative.videoAds.every((v: DV360VideoAd) => !!v.callToAction),
        detail: creative.videoAds.filter((v: DV360VideoAd) => !!v.callToAction).length + "/" + creative.videoAds.length + " ads with CTA",
      });
      list.push({
        id: "perf_landing",
        label: "Landing pages configured",
        ok: creative.videoAds.every((v: DV360VideoAd) => !!v.landingPageUrl.trim()),
        detail: creative.videoAds.filter((v: DV360VideoAd) => !!v.landingPageUrl.trim()).length + "/" + creative.videoAds.length + " with URL",
      });
    }
    return list;
  }, [objective, audience, budget, creative, config, isAwareness, isConsideration, isConversion, isPerformance]);

  const allOk = checks.every((c) => c.ok);

  /* ---- DV360 API JSON ---- */
  const apiJson = useMemo(() => ({
    campaign: {
      displayName: objective.campaignName || "<CAMPAIGN_NAME>",
      entityStatus: "ENTITY_STATUS_DRAFT",
      campaignGoal: {
        campaignGoalType: config.campaignGoalType,
        performanceGoal: {
          performanceGoalType: budget.performanceGoalType,
          ...(budget.performanceGoalAmount && {
            performanceGoalAmountMicros: Math.round(budget.performanceGoalAmount * 1000000).toString(),
          }),
        },
      },
      campaignFlight: {
        plannedDates: {
          startDate: budget.startDate ? { year: +budget.startDate.split("-")[0], month: +budget.startDate.split("-")[1], day: +budget.startDate.split("-")[2] } : undefined,
          endDate: budget.endDate ? { year: +budget.endDate.split("-")[0], month: +budget.endDate.split("-")[1], day: +budget.endDate.split("-")[2] } : undefined,
        },
        plannedSpendAmountMicros: (budget.budgetAmount * 1000000).toString(),
      },
      campaignBudgets: [{
        displayName: "Campaign Budget",
        budgetAmountMicros: (budget.budgetAmount * 1000000).toString(),
        dateRange: {
          startDate: budget.startDate ? { year: +budget.startDate.split("-")[0], month: +budget.startDate.split("-")[1], day: +budget.startDate.split("-")[2] } : undefined,
          endDate: budget.endDate ? { year: +budget.endDate.split("-")[0], month: +budget.endDate.split("-")[1], day: +budget.endDate.split("-")[2] } : undefined,
        },
      }],
      ...(budget.frequencyCap.enabled && {
        frequencyCap: {
          maxImpressions: budget.frequencyCap.maxImpressions,
          timeUnit: budget.frequencyCap.timeUnit,
        },
      }),
    },
    insertion_order: {
      displayName: `${objective.campaignName || "Campaign"} - IO`,
      entityStatus: "ENTITY_STATUS_DRAFT",
      pacing: {
        pacingPeriod: "PACING_PERIOD_FLIGHT",
        pacingType: budget.pacing,
      },
      budget: {
        budgetUnit: "BUDGET_UNIT_CURRENCY",
        automationType: "INSERTION_ORDER_AUTOMATION_TYPE_BUDGET",
        budgetSegments: [{
          budgetAmountMicros: (budget.budgetAmount * 1000000).toString(),
          dateRange: {
            startDate: budget.startDate ? { year: +budget.startDate.split("-")[0], month: +budget.startDate.split("-")[1], day: +budget.startDate.split("-")[2] } : undefined,
            endDate: budget.endDate ? { year: +budget.endDate.split("-")[0], month: +budget.endDate.split("-")[1], day: +budget.endDate.split("-")[2] } : undefined,
          },
        }],
      },
      performanceGoal: {
        performanceGoalType: budget.performanceGoalType,
        ...(budget.performanceGoalAmount && {
          performanceGoalAmountMicros: Math.round(budget.performanceGoalAmount * 1000000).toString(),
        }),
      },
    },
    line_items: creative.videoAds.map((ad: DV360VideoAd) => ({
      displayName: ad.name || `${FORMAT_LABELS[ad.videoFormat]} Ad`,
      entityStatus: "ENTITY_STATUS_DRAFT",
      lineItemType: config.lineItemType,
      flight: {
        flightDateType: "LINE_ITEM_FLIGHT_DATE_TYPE_INHERITED",
      },
      budget: {
        budgetAllocationType: "LINE_ITEM_BUDGET_ALLOCATION_TYPE_AUTOMATIC",
      },
      bidStrategy: {
        youtubeAndPartnersBidding: {
          type: budget.biddingStrategy,
          ...(budget.targetCpm && { value: (budget.targetCpm * 1000000).toString() }),
          ...(budget.targetCpv && { value: (budget.targetCpv * 1000000).toString() }),
          ...(budget.targetCpa && { value: (budget.targetCpa * 1000000).toString() }),
        },
      },
      youtubeAndPartnersSettings: {
        videoAdFormat: ad.videoFormat === "SKIPPABLE_IN_STREAM" ? "YOUTUBE_AND_PARTNERS_AD_FORMAT_IN_STREAM_SKIPPABLE"
          : ad.videoFormat === "NON_SKIPPABLE_IN_STREAM" ? "YOUTUBE_AND_PARTNERS_AD_FORMAT_IN_STREAM_NON_SKIPPABLE"
          : ad.videoFormat === "BUMPER" ? "YOUTUBE_AND_PARTNERS_AD_FORMAT_BUMPER"
          : ad.videoFormat === "IN_FEED" ? "YOUTUBE_AND_PARTNERS_AD_FORMAT_IN_FEED"
          : "YOUTUBE_AND_PARTNERS_AD_FORMAT_SHORTS",
        inventorySourceSettings: {
          includeYoutube: audience.inventorySources.includes("YOUTUBE"),
          includeGoogleTv: audience.inventorySources.includes("GOOGLE_TV"),
          includeVideoPartners: audience.inventorySources.includes("VIDEO_PARTNERS"),
        },
        contentCategory: audience.contentCategory,
        ...(isAwareness && audience.targetFrequency.enabled && {
          targetFrequency: {
            targetCount: audience.targetFrequency.maxImpressions,
            timeUnit: audience.targetFrequency.timeUnit,
          },
        }),
        ...(isConsideration && {
          viewFrequencyCap: budget.frequencyCap.enabled ? {
            maxViews: budget.frequencyCap.maxImpressions,
            timeUnit: budget.frequencyCap.timeUnit,
          } : undefined,
        }),
        ...(isConversion && {
          ...(objective.floodlightActivityId && {
            conversionCountingConfig: {
              floodlightActivityConfigs: [{
                floodlightActivityId: objective.floodlightActivityId,
                postClickLookbackWindowDays: 30,
                postViewLookbackWindowDays: 7,
              }],
            },
          }),
        }),
        ...(isPerformance && {
          ...(objective.floodlightActivityId && {
            conversionCountingConfig: {
              floodlightActivityConfigs: [{
                floodlightActivityId: objective.floodlightActivityId,
                postClickLookbackWindowDays: 30,
                postViewLookbackWindowDays: 14,
              }],
            },
          }),
          ...(budget.targetRoas && {
            targetReturnOnAdSpend: {
              targetRoas: budget.targetRoas / 100,
            },
          }),
          simplifiedResourceAllocation: true,
        }),
        ...(objective.youtubeChannelUrl && {
          relatedVideoIds: [],
        }),
      },
      ...(audience.optimizedTargeting && {
        targetingExpansion: {
          targetingExpansionLevel: "TARGETING_EXPANSION_LEVEL_BALANCED",
        },
      }),
    })),
    creatives: creative.videoAds.filter((ad: DV360VideoAd) => ad.youtubeVideoUrl).map((ad: DV360VideoAd) => ({
      displayName: ad.name || `Video Creative - ${FORMAT_LABELS[ad.videoFormat]}`,
      entityStatus: "ENTITY_STATUS_ACTIVE",
      creativeType: "CREATIVE_TYPE_VIDEO",
      assets: [{
        asset: { content: ad.youtubeVideoUrl },
        role: "ASSET_ROLE_MAIN",
      }],
      ...(ad.companionBannerUrl && {
        companionCreativeIds: [],
      }),
      exitEvents: [{
        type: "EXIT_EVENT_TYPE_DEFAULT",
        url: ad.landingPageUrl || "<LANDING_PAGE_URL>",
      }],
    })),
    targeting: {
      geoRegion: audience.geoTargets.map((g) => ({
        targetingType: "TARGETING_TYPE_GEO_REGION",
        geoRegionDetails: { displayName: g.name, geoRegionType: g.type.toUpperCase() },
      })),
      language: audience.languages.map((l) => ({
        targetingType: "TARGETING_TYPE_LANGUAGE",
        languageDetails: { displayName: l.name },
      })),
      ageRange: audience.ageRanges.map((a) => ({
        targetingType: "TARGETING_TYPE_AGE_RANGE",
        ageRangeDetails: { ageRange: `AGE_RANGE_${a}` },
      })),
      gender: audience.genders.map((g) => ({
        targetingType: "TARGETING_TYPE_GENDER",
        genderDetails: { gender: `GENDER_${g}` },
      })),
      deviceType: audience.deviceTypes.map((d) => ({
        targetingType: "TARGETING_TYPE_DEVICE_TYPE",
        deviceTypeDetails: { deviceType: `DEVICE_TYPE_${d}` },
      })),
      ...(audience.keywords.length > 0 && {
        keyword: audience.keywords.map((k) => ({
          targetingType: "TARGETING_TYPE_KEYWORD",
          keywordDetails: { keyword: k },
        })),
      }),
      ...(audience.excludeKeywords.length > 0 && {
        negativeKeyword: audience.excludeKeywords.map((k) => ({
          targetingType: "TARGETING_TYPE_NEGATIVE_KEYWORD_LIST",
          negativeKeywordListDetails: { keyword: k },
        })),
      }),
    },
  }), [objective, audience, budget, creative, config, isAwareness, isConsideration, isConversion, isPerformance]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(apiJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============ LEFT COLUMN ============ */}
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground">Review & Launch</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your YouTube campaign settings before launching on DV360.
            </p>
          </div>

          {/* Checklist */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-red-600" />
                <Label className="text-sm font-semibold text-foreground">Launch Checklist</Label>
              </div>
              <Badge className={cn("rounded-full text-xs", allOk ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
                {checks.filter((c) => c.ok).length}/{checks.length} ready
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
              <SectionHeader icon={Eye} title="Objective" step={0} setStep={setStep} />
              <ReviewRow label="Objective" value={config.label} />
              <ReviewRow label="Campaign Name" value={objective.campaignName || "Not set"} warn={!objective.campaignName} />
              <ReviewRow label="Campaign Goal" value={config.campaignGoalType.replace("CAMPAIGN_GOAL_TYPE_", "").replace(/_/g, " ")} />
              <ReviewRow label="Line Item Type" value={config.lineItemType.replace("LINE_ITEM_TYPE_YOUTUBE_AND_PARTNERS_", "").replace(/_/g, " ")} />
              {config.conversionTrackingRequired && (
                <ReviewRow label="Floodlight Activity" value={objective.floodlightActivityId || "Not set"} warn={!objective.floodlightActivityId} />
              )}
              {objective.youtubeChannelUrl && (
                <ReviewRow label="YouTube Channel" value={objective.youtubeChannelUrl} />
              )}
            </SectionCard>

            {/* ---- Audience ---- */}
            <SectionCard>
              <SectionHeader icon={Users} title="Audience & Targeting" step={1} setStep={setStep} />
              <ReviewRow label="Locations" value={audience.geoTargets.map((g) => g.name).join(", ") || "None"} warn={audience.geoTargets.length === 0} />
              <ReviewRow label="Languages" value={audience.languages.map((l) => l.name).join(", ") || "All"} />
              <ReviewRow label="Age Ranges" value={audience.ageRanges.length === 6 ? "All ages" : `${audience.ageRanges.length} selected`} />
              <ReviewRow label="Genders" value={audience.genders.length === 2 ? "All genders" : audience.genders.join(", ")} />
              <ReviewRow label="Devices" value={audience.deviceTypes.length === 4 ? "All devices" : audience.deviceTypes.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ")} />
              <ReviewRow label="Interests" value={audience.interests.length > 0 ? `${audience.interests.length} segment(s)` : "None"} />
              <ReviewRow label="Keywords" value={audience.keywords.length > 0 ? `${audience.keywords.length} keyword(s)` : "None"} />
              {isConsideration && audience.keywords.length > 0 && (
                <ReviewRow label="Custom Intent" value={`${audience.keywords.length} search terms (targets recent Google searchers)`} />
              )}
              {isConversion && audience.keywords.length > 0 && (
                <ReviewRow label="Custom Intent" value={`${audience.keywords.length} high-intent keywords (purchase-ready searchers)`} />
              )}
              {isPerformance && audience.keywords.length > 0 && (
                <ReviewRow label="Audience Signals" value={`${audience.keywords.length} keyword signals (AI expands from these)`} />
              )}
              {audience.excludeKeywords.length > 0 && (
                <ReviewRow label="Negative Keywords" value={`${audience.excludeKeywords.length} excluded`} />
              )}
              <ReviewRow label="Inventory" value={audience.inventorySources.join(", ")} warn={audience.inventorySources.length === 0} />
              <ReviewRow label="Content Safety" value={audience.contentCategory.replace("CONTENT_FILTER_TYPE_", "")} />
              <ReviewRow label="Optimized Targeting" value={audience.optimizedTargeting ? "Enabled" : "Disabled"} />
              {isAwareness && audience.targetFrequency.enabled && (
                <ReviewRow label="Target Frequency" value={`${audience.targetFrequency.maxImpressions} ${FREQ_LABELS[audience.targetFrequency.timeUnit] || ""}`} />
              )}
              {audience.dayAndTimeSchedule.length > 0 && (
                <ReviewRow label="Schedule" value={`${audience.dayAndTimeSchedule.length} time slot(s)`} />
              )}
            </SectionCard>

            {/* ---- Budget ---- */}
            <SectionCard>
              <SectionHeader icon={DollarSign} title="Budget & Bidding" step={2} setStep={setStep} />
              <ReviewRow label="Total Budget" value={`SAR ${budget.budgetAmount.toLocaleString()}`} />
              <ReviewRow label="Flight Dates" value={budget.startDate && budget.endDate ? `${budget.startDate} to ${budget.endDate}` : "Not set"} warn={!budget.startDate} />
              <ReviewRow label="Duration" value={`${durationDays} days`} />
              <ReviewRow label="Pacing" value={PACING_LABELS[budget.pacing] || budget.pacing} />
              <ReviewRow label="Bidding" value={BIDDING_LABELS[budget.biddingStrategy] || budget.biddingStrategy} />
              {budget.targetCpm && <ReviewRow label="Target CPM" value={`SAR ${budget.targetCpm}`} />}
              {budget.targetCpv && <ReviewRow label="Target CPV" value={`SAR ${budget.targetCpv.toFixed(2)}`} />}
              {isConsideration && budget.targetCpv && budget.targetCpv > 0 && (
                <ReviewRow label="Estimated Views" value={`~${Math.floor(budget.budgetAmount / budget.targetCpv).toLocaleString()} views`} />
              )}
              {isAwareness && budget.targetCpm && budget.targetCpm > 0 && (
                <ReviewRow label="Estimated Impressions" value={`~${Math.floor((budget.budgetAmount / budget.targetCpm) * 1000).toLocaleString()} impressions`} />
              )}
              {budget.targetCpa && <ReviewRow label="Target CPA" value={`SAR ${budget.targetCpa}`} />}
              {isConversion && budget.targetCpa && budget.targetCpa > 0 && (
                <ReviewRow label="Estimated Conversions" value={`~${Math.floor(budget.budgetAmount / budget.targetCpa).toLocaleString()} actions`} />
              )}
              {budget.targetRoas && <ReviewRow label="Target ROAS" value={`${budget.targetRoas}%`} />}
              {isPerformance && budget.targetRoas && budget.targetRoas > 0 && (
                <ReviewRow label="Estimated Revenue" value={`~SAR ${Math.round(budget.budgetAmount * budget.targetRoas / 100).toLocaleString()}`} />
              )}
              {isPerformance && budget.targetCpa && budget.targetCpa > 0 && (
                <ReviewRow label="Estimated Conversions" value={`~${Math.floor(budget.budgetAmount / budget.targetCpa).toLocaleString()} actions`} />
              )}
              {budget.frequencyCap.enabled && (
                <ReviewRow label="Frequency Cap" value={`${budget.frequencyCap.maxImpressions} impressions ${FREQ_LABELS[budget.frequencyCap.timeUnit] || ""}`} />
              )}
            </SectionCard>

            {/* ---- Video Ads ---- */}
            <SectionCard>
              <SectionHeader icon={Play} title="Video Ads" step={3} setStep={setStep} />
              <ReviewRow label="Total Ads" value={`${creative.videoAds.length}`} />
              {creative.videoAds.map((ad: DV360VideoAd, i: number) => (
                <div key={ad.id} className="mt-2 rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="size-4 text-red-600" />
                    <span className="text-xs font-semibold text-foreground">{ad.name || `Video Ad ${i + 1}`}</span>
                    <Badge variant="secondary" className="ml-auto rounded-full text-[10px]">
                      {FORMAT_LABELS[ad.videoFormat] || ad.videoFormat}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    <span>URL: {ad.youtubeVideoUrl || "Not set"}</span>
                    {ad.callToAction && <span>CTA: {ad.callToAction}</span>}
                    {ad.landingPageUrl && <span>Landing: {ad.landingPageUrl}</span>}
                    {ad.displayUrl && <span>Display: {ad.displayUrl}</span>}
                  </div>
                </div>
              ))}
            </SectionCard>

            {/* ---- Cost Summary ---- */}
            <SectionCard className="border-red-200/50 bg-red-50/30 dark:border-red-900/30 dark:bg-red-950/10">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="size-4 text-red-600" />
                <Label className="text-sm font-semibold text-foreground">Cost Summary</Label>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign budget</span>
                  <span className="font-medium text-foreground">SAR {budget.budgetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Flight duration</span>
                  <span className="font-medium text-foreground">{durationDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily average</span>
                  <span className="font-medium text-foreground">SAR {Math.round(budget.budgetAmount / durationDays).toLocaleString()}</span>
                </div>
                {isAwareness && budget.targetCpm && budget.targetCpm > 0 && (
                  <div className="flex justify-between rounded-md bg-red-100/50 px-2 py-1 dark:bg-red-900/20">
                    <span className="font-medium text-red-700 dark:text-red-400">Estimated impressions</span>
                    <span className="font-bold text-red-700 dark:text-red-400">~{Math.floor((budget.budgetAmount / budget.targetCpm) * 1000).toLocaleString()}</span>
                  </div>
                )}
                {isAwareness && budget.targetCpm && budget.targetCpm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per 1,000</span>
                    <span className="font-medium text-foreground">SAR {budget.targetCpm.toFixed(2)}</span>
                  </div>
                )}
                {isConsideration && budget.targetCpv && budget.targetCpv > 0 && (
                  <div className="flex justify-between rounded-md bg-blue-100/50 px-2 py-1 dark:bg-blue-900/20">
                    <span className="font-medium text-blue-700 dark:text-blue-400">Estimated views</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">~{Math.floor(budget.budgetAmount / budget.targetCpv).toLocaleString()}</span>
                  </div>
                )}
                {isConsideration && budget.targetCpv && budget.targetCpv > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per view</span>
                    <span className="font-medium text-foreground">SAR {budget.targetCpv.toFixed(2)}</span>
                  </div>
                )}
                {isConversion && budget.targetCpa && budget.targetCpa > 0 && (
                  <div className="flex justify-between rounded-md bg-emerald-100/50 px-2 py-1 dark:bg-emerald-900/20">
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">Estimated conversions</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">~{Math.floor(budget.budgetAmount / budget.targetCpa).toLocaleString()}</span>
                  </div>
                )}
                {isConversion && budget.targetCpa && budget.targetCpa > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per action</span>
                    <span className="font-medium text-foreground">SAR {budget.targetCpa.toFixed(0)}</span>
                  </div>
                )}
                {isPerformance && budget.targetRoas && budget.targetRoas > 0 && (
                  <div className="flex justify-between rounded-md bg-orange-100/50 px-2 py-1 dark:bg-orange-900/20">
                    <span className="font-medium text-orange-700 dark:text-orange-400">Est. revenue (ROAS)</span>
                    <span className="font-bold text-orange-700 dark:text-orange-400">~SAR {Math.round(budget.budgetAmount * budget.targetRoas / 100).toLocaleString()}</span>
                  </div>
                )}
                {isPerformance && budget.targetRoas && budget.targetRoas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target ROAS</span>
                    <span className="font-medium text-foreground">{budget.targetRoas}%</span>
                  </div>
                )}
                {isPerformance && budget.targetCpa && budget.targetCpa > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. conversions</span>
                    <span className="font-medium text-foreground">~{Math.floor(budget.budgetAmount / budget.targetCpa).toLocaleString()}</span>
                  </div>
                )}
                {budget.performanceBoost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salla Performance Boost</span>
                    <span className="font-medium text-red-600">SAR 149</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-border pt-2">
                  <span className="font-semibold text-foreground">Total estimated cost</span>
                  <span className="font-bold text-red-600">SAR {totalBudget.toLocaleString()}</span>
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

            {/* ---- API JSON ---- */}
            <SectionCard>
              <button
                type="button"
                onClick={() => setShowApiJson(!showApiJson)}
                className="flex w-full items-center gap-2 text-left"
              >
                <Code2 className="size-4 text-red-600" />
                <span className="flex-1 text-sm font-semibold text-foreground">
                  DV360 API Payload
                </span>
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {showApiJson ? "Hide" : "Show"}
                </Badge>
              </button>
              {showApiJson && (
                <div className="mt-3">
                  <div className="flex items-center justify-between pb-2">
                    <p className="text-[10px] text-muted-foreground">
                      DV360 REST API v4 payload -- Campaign + Insertion Order + Line Items + Creatives + Targeting
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px]" onClick={handleCopyJson}>
                      <Copy className="size-3" /> {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <pre className="max-h-96 overflow-auto rounded-lg bg-foreground p-4 text-[11px] leading-relaxed text-background">
                    {JSON.stringify(apiJson, null, 2)}
                  </pre>
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ============ RIGHT SIDEBAR ============ */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="flex flex-col gap-4">

            {/* Campaign Summary Card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                  <svg viewBox="0 0 24 24" className="size-4 text-red-600" fill="currentColor">
                    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.76 31.76 0 0 0 0 12a31.76 31.76 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.76 31.76 0 0 0 24 12a31.76 31.76 0 0 0-.5-5.81ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{objective.campaignName || "YouTube Campaign"}</p>
                  <p className="text-[10px] text-muted-foreground">DV360 -- {config.label}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Objective</span>
                  <span className="font-medium text-foreground">{config.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Video Ads</span>
                  <span className="font-medium text-foreground">{creative.videoAds.length} ad(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium text-foreground">SAR {budget.budgetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bidding</span>
                  <span className="font-medium text-foreground">{BIDDING_LABELS[budget.biddingStrategy] || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Locations</span>
                  <span className="font-medium text-foreground">{audience.geoTargets.length} target(s)</span>
                </div>
                {budget.performanceBoost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salla Boost</span>
                    <span className="font-medium text-red-600">Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Channels Card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold text-foreground">YouTube Channels</p>
              {(audience.inventorySources.includes("YOUTUBE") ? ["YouTube", "YouTube Shorts", "YouTube Music"] : [])
                .concat(audience.inventorySources.includes("GOOGLE_TV") ? ["Google TV"] : [])
                .concat(audience.inventorySources.includes("VIDEO_PARTNERS") ? ["Video Partners Network"] : [])
                .map((ch) => (
                  <div key={ch} className="flex items-center gap-2 py-1">
                    <div className="size-1.5 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">{ch}</span>
                  </div>
                ))
              }
              <p className="mt-3 text-[10px] text-muted-foreground">
                YouTube ads are served across YouTube In-Stream, Shorts, YouTube TV, and Google Video Partners to maximize your reach.
              </p>
            </div>

            {/* Devices Card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-xs font-semibold text-foreground">Target Devices</p>
              <div className="flex flex-wrap gap-2">
                {audience.deviceTypes.map((d) => {
                  const DevIcon = DEVICE_ICONS[d] || Monitor;
                  return (
                    <div key={d} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-2.5 py-1">
                      <DevIcon className="size-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-foreground">{d.charAt(0) + d.slice(1).toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Success Dialog ---- */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Campaign Submitted!
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <PartyPopper className="size-8 text-red-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your YouTube campaign <span className="font-semibold text-foreground">{`"${objective.campaignName || "Untitled"}"`}</span> has been submitted to DV360 for review.
            </p>
            <div className="flex w-full flex-col gap-2 pt-4">
              <Button className="w-full bg-red-600 text-white hover:bg-red-700" onClick={() => setShowSuccess(false)}>
                View Campaign
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setShowSuccess(false); setStep(0); }}>
                Create Another Campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <WizardStepFooter
        onPrevious={() => setStep(3)}
        onNext={() => setShowSuccess(true)}
        previousLabel="Previous"
        nextLabel="Launch Campaign"
        nextDisabled={!allOk}
        nextIcon={<Rocket className="size-4" />}
        accent="dv360"
      />
    </TooltipProvider>
  );
}
