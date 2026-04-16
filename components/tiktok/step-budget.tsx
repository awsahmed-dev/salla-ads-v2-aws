"use client";

import { useState } from "react";
import { useTikTokCampaign } from "@/lib/tiktok/campaign-context";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Info,
  Target,
  Zap,
  CreditCard,
  Eye,
  ShoppingCart,
  Clock,
  AlertCircle,
  Gauge,
  Wallet,
  MousePointerClick,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Settings2,
  ArrowLeft,
  SkipForward,
  Link,
  Play,
  ClipboardList,
  Download,
  Smartphone,
  Activity,
  Repeat,
} from "lucide-react";
import { FrequencyCapCard } from "@/components/shared/frequency-cap-card";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { OptimizationGoalCard } from "@/components/shared/optimization-goal-card";
import { fmt } from "@/components/shared/fmt";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { BidStrategyCard } from "@/components/shared/bid-strategy-card";
import { ConversionEventCard } from "@/components/shared/conversion-event-card";
import { AttributionWindowCard } from "@/components/shared/attribution-window-card";
import { DeliveryPacingCard } from "@/components/shared/delivery-pacing-card";
import type {
  OptimizationGoal,
  OptimizationEvent,
  BidType,
  PaymentMethod,
  ClickAttributionWindow,
  ViewAttributionWindow,
  BillingEvent,
  FrequencySchedule,
} from "@/lib/tiktok/campaign-types";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { OBJECTIVE_CONFIGS } from "@/lib/tiktok/campaign-types";

/* ================================================================== */
/*  Static config                                                     */
/* ================================================================== */

const ALL_OPTIMIZATION_GOALS: {
  value: OptimizationGoal;
  label: string;
  desc: string;
  bestFor: string;
  icon: React.ReactNode;
  billingLabel: string;
  recommended?: boolean;
}[] = [
  {
    value: "CONVERSION",
    label: "Conversions",
    desc: "Maximize the number of purchase events from your store.",
    bestFor: "Best for most e-commerce advertisers. Start here if you want more orders.",
    icon: <ShoppingCart className="size-4" />,
    billingLabel: "oCPM",
    recommended: true,
  },
  {
    value: "VALUE",
    label: "Value (ROAS)",
    desc: "Maximize total revenue, not just the number of orders.",
    bestFor: "Best when you have varied product prices and want to prioritize high-value purchases.",
    icon: <TrendingUp className="size-4" />,
    billingLabel: "oCPM",
  },
  {
    value: "CLICK",
    label: "Clicks",
    desc: "Drive maximum visitors to your product pages. Charged per click (CPC).",
    bestFor: "Best for new stores that need traffic, or when testing creatives before optimizing for purchases.",
    icon: <MousePointerClick className="size-4" />,
    billingLabel: "CPC",
  },
  {
    value: "LANDING_PAGE_VIEW",
    label: "Landing Page View",
    desc: "Optimize for higher-quality clicks where the landing page fully loads. Requires a TikTok Pixel.",
    bestFor: "Best when you want quality traffic that actually reaches your site, reducing wasted spend on accidental clicks.",
    icon: <Eye className="size-4" />,
    billingLabel: "oCPM",
  },
  {
    value: "REACH",
    label: "Reach",
    desc: "Maximize the number of unique people who see your ad.",
    bestFor: "Best for brand awareness, product launches, and reaching new audiences at scale.",
    icon: <Eye className="size-4" />,
    billingLabel: "CPM",
    recommended: true,
  },
  {
    value: "SHOW",
    label: "Impressions (Frequency)",
    desc: "Maximize total impressions. Users may see your ad multiple times to reinforce your message.",
    bestFor: "Best for retargeting, limited-time offers, or when repetition drives conversions.",
    icon: <Repeat className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "VIDEO_VIEW",
    label: "Video Views (2s)",
    desc: "Maximize the number of 2-second video views. Broad reach with video content.",
    bestFor: "Best for maximizing video view volume and brand awareness at scale.",
    icon: <Eye className="size-4" />,
    billingLabel: "CPV",
    recommended: true,
  },
  {
    value: "FOCUSED_VIEW",
    label: "Focused View (6s)",
    desc: "Maximize 6-second focused views. Higher engagement and intent from viewers.",
    bestFor: "Best for storytelling, product demos, and when you want viewers who truly engage with your content.",
    icon: <Play className="size-4" />,
    billingLabel: "CPV",
  },
  {
    value: "LEAD_GENERATION",
    label: "Lead Form Submissions",
    desc: "Maximize the number of instant form submissions. TikTok optimizes delivery to find users most likely to submit your form.",
    bestFor: "Best for collecting customer info, sign-ups, inquiries, and building your contact list.",
    icon: <ClipboardList className="size-4" />,
    billingLabel: "oCPM",
    recommended: true,
  },
  {
    value: "INSTALL",
    label: "App Install",
    desc: "Maximize app installations. TikTok delivers ads to users most likely to download your app.",
    bestFor: "Best for growing your app user base. Start here for new app campaigns.",
    icon: <Download className="size-4" />,
    billingLabel: "oCPM",
    recommended: true,
  },
  {
    value: "IN_APP_EVENT",
    label: "In-App Event (AEO)",
    desc: "Optimize for specific in-app events like purchases, registrations, or level completions.",
    bestFor: "Best when you have an established app with SDK events and want to optimize beyond installs.",
    icon: <Activity className="size-4" />,
    billingLabel: "oCPM",
  },
];

/** Events ordered by e-commerce funnel stage (bottom-of-funnel first).
 *  Only Sales-objective events per TikTok docs. */
const CONVERSION_EVENTS: {
  value: OptimizationEvent;
  label: string;
  desc: string;
  icon: React.ReactNode;
  funnelStage: string;
  recommended?: boolean;
}[] = [
  {
    value: "COMPLETE_PAYMENT",
    label: "Purchase",
    desc: "Optimizes for completed orders. This is the most common choice.",
    icon: <CreditCard className="size-3.5" />,
    funnelStage: "Bottom funnel",
    recommended: true,
  },
  {
    value: "INITIATE_CHECKOUT",
    label: "Initiate Checkout",
    desc: "Optimizes for users who start the checkout process.",
    icon: <Wallet className="size-3.5" />,
    funnelStage: "Mid funnel",
  },
  {
    value: "ADD_TO_CART",
    label: "Add to Cart",
    desc: "Optimizes for users who add products to their cart.",
    icon: <ShoppingCart className="size-3.5" />,
    funnelStage: "Mid funnel",
  },
  {
    value: "VIEW_CONTENT",
    label: "View Product",
    desc: "Optimizes for product page views. Good for awareness.",
    icon: <Eye className="size-3.5" />,
    funnelStage: "Top funnel",
  },
  {
    value: "ADD_BILLING",
    label: "Add Payment Info",
    desc: "Optimizes for users who enter payment details.",
    icon: <CreditCard className="size-3.5" />,
    funnelStage: "Bottom funnel",
  },
];

/** We use composite keys (COST_CAP / BID_CAP) for the card component, then map back to the API bid_type. */
const BID_STRATEGIES: {
  value: string;
  /** The actual API bid_type value */
  apiBidType: BidType;
  /** Cost Cap vs Bid Cap sub-strategy */
  bidStrategy: "COST_CAP" | "BID_CAP" | "NONE";
  label: string;
  apiLabel: string;
  desc: string;
  bestFor: string;
  icon: React.ReactNode;
  recommended?: boolean;
  supportedGoals: OptimizationGoal[];
}[] = [
  {
    value: "LOWEST_COST",
    apiBidType: "BID_TYPE_NO_BID",
    bidStrategy: "NONE",
    label: "Maximum Delivery",
    apiLabel: "Lowest Cost (auto-bid)",
    desc: "TikTok automatically bids to get the most results within your budget. No manual CPA needed.",
    bestFor: "Best for most Salla merchants, especially when starting a new campaign or testing new products.",
    icon: <Zap className="size-4" />,
    recommended: true,
    supportedGoals: ["CONVERSION", "VALUE", "CLICK", "LANDING_PAGE_VIEW", "REACH", "SHOW", "VIDEO_VIEW", "FOCUSED_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"],
  },
  {
    value: "COST_CAP",
    apiBidType: "BID_TYPE_CUSTOM",
    bidStrategy: "COST_CAP",
    label: "Cost Cap",
    apiLabel: "Cost Cap (target CPA / CPV / CPI)",
    desc: "Set a target cost per result. TikTok averages your cost around this amount but may exceed per-auction.",
    bestFor: "Best when you know your target CPA and want to scale while maintaining average profitability.",
    icon: <Target className="size-4" />,
    supportedGoals: ["CONVERSION", "VIDEO_VIEW", "FOCUSED_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"],
  },
  {
    value: "BID_CAP",
    apiBidType: "BID_TYPE_CUSTOM",
    bidStrategy: "BID_CAP",
    label: "Bid Cap",
    apiLabel: "Bid Cap (max bid per auction)",
    desc: "Set a hard maximum bid per auction. TikTok will never exceed your bid amount in any single auction.",
    bestFor: "Best for strict cost control. Use when profitability per-action matters more than volume.",
    icon: <Target className="size-4" />,
    supportedGoals: ["CONVERSION", "CLICK", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"],
  },
];

const CLICK_ATTRIBUTION_WINDOWS: { value: ClickAttributionWindow; label: string }[] = [
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "28", label: "28 days" },
];

const VIEW_ATTRIBUTION_WINDOWS: { value: ViewAttributionWindow; label: string }[] = [
  { value: "0", label: "Off" },
  { value: "1", label: "1 day" },
  { value: "7", label: "7 days" },
];

const BUDGET_TYPES: {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "pay_as_you_go",
    label: "Pay as You Go",
    desc: "Charged daily, stop anytime",
    icon: <CreditCard className="size-4" />,
  },
  {
    value: "prepaid",
    label: "Prepaid (Fixed)",
    desc: "Pay upfront, fixed budget",
    icon: <Wallet className="size-4" />,
  },
];


/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function TikTokStepBudget() {
  const { campaign, setStep, updateNested } = useTikTokCampaign();
  const budget = campaign.budget;
  const objectiveConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PRODUCT_SALES;
  const isReach = campaign.objective.objective === "REACH";
  const isTraffic = campaign.objective.objective === "TRAFFIC";
  const isVideoViews = campaign.objective.objective === "VIDEO_VIEWS";
  const isLeadGen = campaign.objective.objective === "LEAD_GENERATION";
  const isAppPromo = campaign.objective.objective === "APP_PROMOTION";
  const hasPixel = campaign.objective.pixelMode !== "none";


  /* Auto-increase from campaign context (fallback for old drafts) */
  const autoIncrease = budget.autoIncrease ?? {
    enabled: false,
    pct: 20,
    intervalDays: 7,
    maxDailyBudget: budget.amount * 3,
  };

  /* Local UI state */
  const [showAdvanced, setShowAdvanced] = useState(false);

  const endDateRequired = budget.paymentMethod === "prepaid";

  /* Duration calc */
  const durationDays =
    budget.startDate && budget.endDate
      ? Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000))
      : 14;

  const dailyAmount = budget.amount; // TikTok always uses daily budget

  /* Suggested budget range */
  const suggestedBidMap: Record<string, { min: number; max: number }> = {
    CONVERSION: { min: 15.0, max: 25.0 },
    VALUE: { min: 20.0, max: 35.0 },
    CLICK: { min: 0.8, max: 2.5 },
    LANDING_PAGE_VIEW: { min: 1.5, max: 4.0 },
    REACH: { min: 3.0, max: 12.0 },  // CPM range in SAR
    SHOW: { min: 3.0, max: 12.0 },   // CPM range in SAR (same as REACH)
    VIDEO_VIEW: { min: 0.02, max: 0.08 },  // CPV range in SAR (2-second views)
    FOCUSED_VIEW: { min: 0.04, max: 0.15 },  // CPV range in SAR (6-second focused views)
    LEAD_GENERATION: { min: 5.0, max: 20.0 },  // CPL range in SAR
    INSTALL: { min: 3.0, max: 15.0 },           // CPI range in SAR
    IN_APP_EVENT: { min: 10.0, max: 40.0 },     // Cost per in-app event in SAR
  };
  const suggestedBid = suggestedBidMap[budget.optimizationGoal] ?? { min: 1.0, max: 5.0 };

  const suggestedDailyMap: Record<string, number> = {
    CONVERSION: 200,
    VALUE: 300,
    CLICK: 75,
    LANDING_PAGE_VIEW: 100,
    REACH: 100,
    VIDEO_VIEW: 75,
    FOCUSED_VIEW: 100,
    LEAD_GENERATION: 150,
    INSTALL: 150,
    IN_APP_EVENT: 200,
  };
  const suggestedDaily = suggestedDailyMap[budget.optimizationGoal] ?? 100;

  /* Budget strength */
  const goalMultiplier = budget.optimizationGoal === "CONVERSION" ? 1
    : budget.optimizationGoal === "VALUE" ? 1.2
    : budget.optimizationGoal === "REACH" ? 0.5
    : budget.optimizationGoal === "LANDING_PAGE_VIEW" ? 0.4
    : budget.optimizationGoal === "VIDEO_VIEW" ? 0.3
    : budget.optimizationGoal === "FOCUSED_VIEW" ? 0.4
    : budget.optimizationGoal === "LEAD_GENERATION" ? 0.8
    : budget.optimizationGoal === "INSTALL" ? 0.75
    : budget.optimizationGoal === "IN_APP_EVENT" ? 1.0
    : 0.3;
  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: Math.round(50 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(150 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(300 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(500 * goalMultiplier), pct: 100, color: "bg-primary", textColor: "text-primary", label: "Strong" },
  ];
  const currentTier = [...strengthTiers].reverse().find((t) => dailyAmount >= t.min)!;

  /* Mock estimates */
  const totalBudget = autoIncrease.enabled && !budget.endDateOptional ? projectedTotalSpend : budget.amount * durationDays;
  const totalWithBoost = totalBudget + (budget.performanceBoost ? 149 : 0);

  const goalLabelMap: Record<string, string> = {
    CONVERSION: "purchases",
    VALUE: "revenue",
    CLICK: "clicks",
    LANDING_PAGE_VIEW: "landing page views",
    REACH: "impressions",
    VIDEO_VIEW: "video views",
    FOCUSED_VIEW: "focused views",
    LEAD_GENERATION: "leads",
    INSTALL: "installs",
    IN_APP_EVENT: "in-app events",
  };
  const goalLabel = goalLabelMap[budget.optimizationGoal] ?? "results";

  /* Event label for sidebar */
  const eventLabelMap: Record<string, string> = {
    COMPLETE_PAYMENT: "purchases",
    INITIATE_CHECKOUT: "checkouts",
    ADD_TO_CART: "add-to-carts",
    VIEW_CONTENT: "product views",
    ADD_BILLING: "payment info adds",
  };
  const eventLabel = eventLabelMap[budget.optimizationEvent] ?? goalLabel;

  /* Mock total budget for sidebar */
  const projectedTotalSpend = (() => {
    if (!autoIncrease.enabled || budget.endDateOptional) return dailyAmount * durationDays;
    let total = 0;
    let currentDaily = dailyAmount;
    for (let d = 1; d <= durationDays; d++) {
      total += Math.min(currentDaily, autoIncrease.maxDailyBudget);
      const stepIndex = Math.floor(d / autoIncrease.intervalDays);
      if (d % autoIncrease.intervalDays === 0 && d < durationDays) {
        currentDaily = Math.round(dailyAmount * Math.pow(1 + autoIncrease.pct / 100, stepIndex));
      }
    }
    return total;
  })();

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============= LEFT COLUMN ============= */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ======================================================= */}
          {/* SECTION 1: Optimization Goal                             */}
          {/* ======================================================= */}
          <OptimizationGoalCard
            goals={ALL_OPTIMIZATION_GOALS.filter((g) =>
              objectiveConfig.allowedGoals.includes(g.value)
            )}
            selectedGoal={budget.optimizationGoal}
            onGoalChange={(value) => {
              const billingEvent: BillingEvent =
                value === "CLICK" ? "CPC"
                : value === "REACH" || value === "SHOW" ? "CPM"
                : value === "VIDEO_VIEW" || value === "FOCUSED_VIEW" ? "CPV"
                : "OCPM";
              const deepBidType = value === "VALUE" ? ("VO_MIN_ROAS" as const) : ("DEFAULT" as const);
              updateNested("budget", {
                optimizationGoal: value as OptimizationGoal,
                billingEvent,
                deepBidType,
                bidType: "BID_TYPE_NO_BID" as BidType,
              });
            }}
            layout="grid"
            subtitle={
              isReach
                ? "Your campaign is optimized for Reach. TikTok will maximize the number of unique users who see your ad."
                : isTraffic
                  ? "How should TikTok drive traffic to your website? Choose the quality of visits you want."
                  : isVideoViews
                    ? "How should TikTok optimize your video views? Choose the depth of engagement you want from viewers."
                    : isLeadGen
                      ? "Your campaign is optimized for instant form submissions. TikTok will find users most likely to complete your lead form."
                      : "What outcome do you want from this campaign? TikTok will allocate your budget to maximize the chosen goal."
            }
            infoTipText={
              isReach
                ? "Reach campaigns optimize for maximum unique reach. TikTok delivers your ad to as many different people as possible, billed by CPM."
                : isTraffic
                  ? "Traffic campaigns optimize for website visits. Choose Clicks (CPC) for maximum visitors, or Landing Page View (oCPM) for higher-quality traffic where the page fully loads."
                  : isVideoViews
                    ? "Video Views campaigns optimize for video engagement. Choose Video View (2s) for maximum views, or Focused View (6s) for deeper engagement. Billed by CPV."
                    : isLeadGen
                      ? "Lead Generation campaigns optimize for instant form submissions. TikTok delivers your ad to users most likely to fill out and submit your form. Billed by oCPM."
                      : "Tell TikTok what result matters most. The delivery algorithm optimizes towards this goal using your Pixel data."
            }
            warnings={
              budget.optimizationGoal === "LANDING_PAGE_VIEW" && !hasPixel ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    Requires a TikTok Pixel &mdash; go back to Objective step and add a pixel, or switch to Clicks optimization.
                  </p>
                </div>
              ) : undefined
            }
          >
            {/* Reach: CPM explanation */}
            {isReach && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Reach campaigns use <span className="font-medium text-foreground">CPM (Cost per 1,000 impressions)</span> billing. You are charged for every 1,000 times your ad is shown. No pixel or conversion tracking is needed.
                </p>
              </div>
            )}

            {/* Traffic: optimization explanation */}
            {isTraffic && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {budget.optimizationGoal === "CLICK"
                      ? <>Traffic campaigns with <span className="font-medium text-foreground">Clicks</span> use CPC billing. You are charged only when someone clicks your ad. No pixel is required.</>
                      : <>Traffic campaigns with <span className="font-medium text-foreground">Landing Page View</span> use oCPM billing. A view is counted only when the user clicks AND your landing page fully loads. Requires a TikTok Pixel.</>
                    }
                  </p>
                </div>

                {budget.optimizationGoal === "LANDING_PAGE_VIEW" && !hasPixel && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Landing Page View requires a TikTok Pixel. Go back to Objective step and add a pixel, or switch to Clicks optimization.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-700">
                    <span className="font-semibold">Salla Tip:</span> Start with <span className="font-semibold">Clicks</span> for quick setup, or use <span className="font-semibold">Landing Page View</span> with a pixel for higher-quality visitors who actually reach your store.
                  </p>
                </div>
              </div>
            )}

            {/* Lead Gen: CPL explanation */}
            {isLeadGen && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Lead Generation campaigns use <span className="font-medium text-foreground">oCPM billing</span> (optimized CPM), but TikTok optimizes delivery to maximize form submissions. Your effective cost is measured as <span className="font-medium text-foreground">Cost per Lead (CPL)</span>.
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-700">
                    <span className="font-semibold">Salla Tip:</span> Use <span className="font-semibold">More Volume</span> instant forms to get the most leads at the lowest CPL, or <span className="font-semibold">Higher Intent</span> forms for better lead quality. You can configure your form in the Ad Design step.
                  </p>
                </div>
              </div>
            )}

            {/* App Promo: CPI explanation */}
            {isAppPromo && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    App Install campaigns use <span className="font-medium text-foreground">oCPM billing</span> (optimized CPM), but TikTok optimizes delivery to maximize installs. Your effective cost is measured as <span className="font-medium text-foreground">Cost per Install (CPI)</span>.
                    {budget.optimizationGoal === "IN_APP_EVENT" && <>{" "}For AEO campaigns, TikTok optimizes for your chosen in-app event using SDK data.</>}
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-700">
                    <span className="font-semibold">Salla Tip:</span> Start with <span className="font-semibold">App Install</span> optimization to build your user base, then switch to <span className="font-semibold">In-App Event (AEO)</span> once you have enough install data. Use engaging 15-30s video content showcasing your app.
                  </p>
                </div>
              </div>
            )}

            {/* Video Views: CPV explanation */}
            {isVideoViews && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {budget.optimizationGoal === "VIDEO_VIEW"
                      ? <>Video View campaigns use <span className="font-medium text-foreground">CPV (Cost Per View)</span> billing. A view is counted when a user watches your video for at least <span className="font-medium text-foreground">2 seconds</span>. Ideal for maximizing view volume.</>
                      : <>Focused View campaigns use <span className="font-medium text-foreground">CPV (Cost Per View)</span> billing. A focused view is counted when a user watches your video for at least <span className="font-medium text-foreground">6 seconds</span> or engages with it. Higher quality engagement.</>
                    }
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-700">
                    <span className="font-semibold">Salla Tip:</span> Start with <span className="font-semibold">Video View (2s)</span> to maximize view volume, or use <span className="font-semibold">Focused View (6s)</span> when you want viewers who truly engage with your content.
                  </p>
                </div>
              </div>
            )}
          </OptimizationGoalCard>


          {/* ======================================================= */}
          {/* SECTION 3: Conversion Event (only for CONVERSION/VALUE) */}
          {/* ======================================================= */}
          {!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && budget.optimizationGoal !== "CLICK" && (
            <ConversionEventCard
              events={CONVERSION_EVENTS}
              selectedEvent={budget.optimizationEvent}
              onEventChange={(v) => updateNested("budget", { optimizationEvent: v })}
              infoTipText="The specific e-commerce action TikTok will optimize for. This must match an event fired by your TikTok Pixel on your Salla store."
              tip="Start with Purchase for maximum ROI. If your pixel has fewer than 50 weekly purchases, try Add to Cart first -- TikTok needs enough event data to optimize effectively."
              roas={
                budget.optimizationGoal === "VALUE"
                  ? {
                      value: budget.roasBid,
                      onChange: (v) => updateNested("budget", { roasBid: Math.max(0.01, v || 1) }),
                    }
                  : undefined
              }
            />
          )}

          {/* ======================================================= */}
          {/* SECTION 4: Bid Strategy                                  */}
          {/* ======================================================= */}
          <BidStrategyCard
            strategies={BID_STRATEGIES.filter((s) => s.supportedGoals.includes(budget.optimizationGoal))}
            selectedStrategy={
              budget.bidType === "BID_TYPE_NO_BID" ? "LOWEST_COST"
                : budget.bidStrategy === "BID_CAP" ? "BID_CAP"
                : "COST_CAP"
            }
            onStrategyChange={(v: string) => {
              const strategy = BID_STRATEGIES.find((s) => s.value === v);
              if (strategy) {
                updateNested("budget", {
                  bidType: strategy.apiBidType,
                  bidStrategy: strategy.bidStrategy === "NONE" ? "COST_CAP" : strategy.bidStrategy,
                });
              }
            }}
            layout="buttons"
            infoTipText="Choose how TikTok spends your daily budget. Auto Bid is recommended for most advertisers."
            contextNote={
              budget.bidType !== "BID_TYPE_NO_BID" && budget.bidAmount > 0 && budget.bidAmount > budget.amount
                ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      <p className="text-xs leading-relaxed text-amber-700">
                        Your bid of <span className="font-semibold">SAR {budget.bidAmount.toFixed(2)}</span> exceeds your daily budget of <span className="font-semibold">SAR {budget.amount}</span>. You may get very few results per day — consider increasing your budget or lowering your bid.
                      </p>
                    </div>
                  )
                : undefined
            }
            bidInputs={
              budget.bidType === "BID_TYPE_CUSTOM"
                ? [{
                    label: budget.bidStrategy === "BID_CAP" ? "Maximum Bid per Action" : "Target Cost per Action",
                    desc: budget.bidStrategy === "BID_CAP"
                      ? "TikTok will never bid above this amount. Set it too low and you may not win any auctions."
                      : "TikTok will try to keep your average cost per result close to this amount.",
                    value: budget.optimizationGoal === "VALUE" ? (budget.roasBid ?? 1) : (budget.bidAmount || undefined),
                    onChange: budget.optimizationGoal === "VALUE"
                      ? (v) => updateNested("budget", { roasBid: Math.max(0.01, v || 1) })
                      : (v) => updateNested("budget", { bidAmount: v }),
                    prefix: budget.optimizationGoal === "VALUE" ? "×" : "SAR",
                    suffix: `per ${goalLabel.replace(/s$/, "")}`,
                    min: 0.01,
                    step: budget.optimizationGoal === "VALUE" ? 0.1 : 0.5,
                    suggestedRange: budget.optimizationGoal === "VALUE" ? { min: 2.0, max: 5.0 } : suggestedBid,
                    warning: budget.bidAmount > 0 && budget.bidAmount < suggestedBid.min && budget.optimizationGoal !== "VALUE"
                      ? `Your bid of SAR ${budget.bidAmount.toFixed(2)} is below the suggested minimum of SAR ${suggestedBid.min.toFixed(2)}. You may get very few or no results.`
                      : undefined,
                    tip: budget.bidAmount >= suggestedBid.min && budget.bidAmount <= suggestedBid.max && budget.optimizationGoal !== "VALUE"
                      ? "Your bid is within the suggested range — good balance between cost and delivery."
                      : undefined,
                  }]
                : undefined
            }
          />

          {/* ======================================================= */}
          {/* SECTION 4: Budget, Duration & Payment                    */}
          {/* ======================================================= */}
          <BudgetDurationCard
            budgetTypes={BUDGET_TYPES}
            paymentMethod={budget.paymentMethod}
            onPaymentMethodChange={(v) => updateNested("budget", { paymentMethod: v })}
            showLifetimeToggle={true}
            budgetMode={budget.budgetMode === "BUDGET_MODE_TOTAL" ? "lifetime" : "daily"}
            onBudgetModeChange={(mode) =>
              updateNested("budget", {
                budgetMode: mode === "lifetime" ? "BUDGET_MODE_TOTAL" : "BUDGET_MODE_DAY",
              })
            }
            amount={budget.budgetMode === "BUDGET_MODE_TOTAL" ? budget.lifetimeAmount : budget.amount}
            onAmountChange={(v) =>
              updateNested("budget", budget.budgetMode === "BUDGET_MODE_TOTAL" ? { lifetimeAmount: v } : { amount: v })
            }
            suggestedDaily={suggestedDaily}
            goalLabel={goalLabel}
            platformName="TikTok"
            strengthTiers={strengthTiers}
            startDate={budget.startDate}
            endDate={budget.endDate}
            endDateOptional={budget.endDateOptional}
            onStartDateChange={(d) => updateNested("budget", { startDate: d })}
            onEndDateChange={(d) => updateNested("budget", { endDate: d })}
            showRunContinuously={true}
            endDateRequired={endDateRequired}
            showAutoIncrease={true}
            autoIncrease={autoIncrease}
            onAutoIncreaseChange={(ai) => updateNested("budget", { autoIncrease: ai })}
            onBulkUpdate={(updates) => updateNested("budget", updates)}
            showSmartStart={true}
          />

          {/* ======================================================= */}
          {/* SECTION 5: Performance Boost (Salla Upsell)              */}
          {/* ======================================================= */}
          <PerformanceBoostCard
            enabled={budget.performanceBoost}
            onToggle={(checked) => updateNested("budget", { performanceBoost: checked })}
          />

          {/* ======================================================= */}
          {/* ADVANCED SETTINGS (Collapsible)                          */}
          {/* ======================================================= */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-6 pb-3 pt-5 text-left transition-colors",
                  showAdvanced ? "bg-muted/50" : "border border-border bg-card hover:bg-muted/30"
                )}
              >
                <div>
                  <span className="text-base font-bold text-foreground">Advanced Settings</span>
                  <p className="mt-1 text-xs text-muted-foreground">Attribution Window, Frequency Cap, Delivery Pacing</p>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className={cn("flex flex-col gap-4 rounded-b-2xl px-2 pb-2", showAdvanced && "bg-muted/50")}>

              {/* -- Frequency Capping (Reach only) -- */}
          {/* ======================================================= */}
          {/* SECTION 2a: Frequency Cap (Reach objective only; API: frequency + frequency_schedule) */}
          {/* ======================================================= */}
          {isReach && (
            <FrequencyCapCard
              enabled={true}
              onEnabledChange={() => {}}
              hideToggle={true}
              maxImpressions={budget.frequencyCap?.frequency ?? 3}
              onMaxImpressionsChange={(v) =>
                updateNested("budget", {
                  frequencyCap: {
                    frequency: v,
                    schedule: budget.frequencyCap?.schedule ?? 7,
                  },
                })
              }
              minImpressions={1}
              maxImpressionsMax={20}
              timeWindowValue={String(budget.frequencyCap?.schedule ?? 7)}
              timeWindowOptions={[
                { value: "1", label: "1 day" },
                { value: "7", label: "7 days" },
                { value: "14", label: "14 days" },
                { value: "30", label: "30 days" },
              ]}
              onTimeWindowChange={(v) =>
                updateNested("budget", {
                  frequencyCap: {
                    frequency: budget.frequencyCap?.frequency ?? 3,
                    schedule: Number(v) as FrequencySchedule,
                  },
                })
              }
              timeWindowSummaryLabel={
                (budget.frequencyCap?.schedule ?? 7) === 1
                  ? "1 day"
                  : `${budget.frequencyCap?.schedule ?? 7} days`
              }
              accent="primary"
              infoTipText="Controls how many times each unique user sees your ad. Maps to API fields frequency and frequency_schedule. Prevents ad fatigue and maximizes unique reach."
              summaryTip={
                <>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    {(budget.frequencyCap?.frequency ?? 3) <= 2
                      ? "Low frequency — maximizes unique reach but limits reinforcement. Good for broad awareness."
                      : (budget.frequencyCap?.frequency ?? 3) <= 5
                        ? "Balanced frequency — good mix of reach and message reinforcement. Recommended for most campaigns."
                        : "High frequency — strong message reinforcement but may cause ad fatigue. Best for short campaigns."}
                  </p>
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <p className="text-xs leading-relaxed text-emerald-700">
                      <span className="font-semibold">Salla Tip:</span> For product launches, use <span className="font-semibold">3 times per 7 days</span>. For ongoing brand awareness, use <span className="font-semibold">2 times per 7 days</span> to maximize unique reach.
                    </p>
                  </div>
                </>
              }
            />
          )}

              {/* -- Attribution Window -- */}
              {!isReach && budget.optimizationGoal !== "CLICK" && budget.optimizationGoal !== "SHOW" && (
                <AttributionWindowCard
                  mode="separate"
                  clickOptions={CLICK_ATTRIBUTION_WINDOWS}
                  viewOptions={VIEW_ATTRIBUTION_WINDOWS}
                  clickValue={budget.clickAttributionWindow}
                  viewValue={budget.viewAttributionWindow}
                  onClickChange={(v) => updateNested("budget", { clickAttributionWindow: v })}
                  onViewChange={(v) => updateNested("budget", { viewAttributionWindow: v })}
                  icon={<Link className="size-4 text-primary" />}
                  subtitle={
                    isAppPromo
                      ? "How long after someone interacts with your ad should an install or in-app event count as a result?"
                      : isLeadGen
                        ? "How long after someone interacts with your ad should a lead submission count as a result?"
                        : isTraffic
                          ? "How long after someone clicks your ad should a landing page view count as a result?"
                          : "How long after someone interacts with your ad should a purchase still count as a result? This affects both reporting and how TikTok optimizes delivery."
                  }
                  infoTipText="Defines the time window in which a conversion is credited to your ad after a user clicks or views it. Maps to API fields click_attribution_window and view_attribution_window."
                  tip={
                    isAppPromo
                      ? "Use 7-day click + 1-day view for app campaigns. Most users install within a few days of seeing an ad."
                      : isLeadGen
                        ? "Use 7-day click + 1-day view. Lead form submissions typically happen quickly, but a wider click window captures follow-up conversions."
                        : isVideoViews
                          ? "Use 7-day click + 1-day view to track conversions driven by your video ad engagement."
                          : "Use 7-day click + 1-day view for your online store. Most customers take 1-3 days to decide on a purchase after clicking an ad, and this window gives TikTok enough signal to optimize your campaign effectively."
                  }
                />
              )}

              {/* -- Delivery pacing -- */}
              <DeliveryPacingCard
                layout="buttons"
                options={[
                  { value: "PACING_MODE_SMOOTH", label: "Standard", desc: "Spend budget evenly throughout the day. Recommended for most campaigns.", icon: <Gauge className="size-4" />, recommended: true },
                  { value: "PACING_MODE_FAST", label: "Accelerated", desc: "Spend budget as fast as possible. Use for time-sensitive campaigns.", icon: <Zap className="size-4" /> },
                ]}
                selectedPacing={budget.pacing}
                onPacingChange={(v) => updateNested("budget", { pacing: v })}
                infoTipText="Controls how fast TikTok spends your daily budget."
              />

              {/* -- Skip Learning Phase & Comment Control -- */}
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Delivery Options</Label>
                  <InfoTip text="Additional options that affect how TikTok delivers your ads." />
                </div>

                {/* Skip Learning Phase */}
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <SkipForward className="size-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Skip learning phase</p>
                      <p className="text-xs text-muted-foreground">Start full delivery immediately without the initial learning period. May result in higher initial CPA.</p>
                    </div>
                  </div>
                  <Switch
                    checked={budget.skipLearningPhase}
                    onCheckedChange={(checked) => updateNested("budget", { skipLearningPhase: checked })}
                  />
                </div>

                {budget.skipLearningPhase && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                    <AlertCircle className="size-3 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">Skipping the learning phase may lead to higher and more volatile costs initially. Recommended only for experienced advertisers.</p>
                  </div>
                )}

                {/* Search Placement (Sales & Traffic only) */}
                {(!isReach && !isVideoViews && !isLeadGen && !isAppPromo) && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="size-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium text-foreground">TikTok Search Ads</p>
                        <p className="text-xs text-muted-foreground">Also show your ads in TikTok search results when users search for related keywords.</p>
                      </div>
                    </div>
                    <Switch
                      checked={budget.searchResultEnabled}
                      onCheckedChange={(checked) => updateNested("budget", { searchResultEnabled: checked })}
                    />
                  </div>
                )}
                {budget.searchResultEnabled && (!isReach && !isVideoViews && !isLeadGen && !isAppPromo) && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Search ads appear when users search for keywords related to your products on TikTok. This can drive additional high-intent traffic at no extra cost.
                    </p>
                  </div>
                )}

              </SectionCard>

            </CollapsibleContent>
          </Collapsible>

        </div>

        {/* ============= RIGHT COLUMN (Budget summary) ============= */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Cost Summary (shared) */}
            <CostSummaryCard
              budgetLabel="Daily budget"
              budgetAmount={dailyAmount}
              durationDays={durationDays}
              isOngoing={budget.endDateOptional}
              totalBudget={totalBudget}
              autoIncreaseEnabled={autoIncrease.enabled}
              boostEnabled={budget.performanceBoost}
              boostAmount={149}
              startDate={budget.startDate}
              endDate={budget.endDate}
            />

            {/* Estimated Results (shared) */}
            <EstimatedResultsCard
              badge="Predicted"
              rows={
                isReach ? [
                  { label: "Daily impressions", value: `${fmt(Math.round(dailyAmount / suggestedBid.min * 1000))} - ${fmt(Math.round(dailyAmount / suggestedBid.max * 1000 * 3))}` },
                  { label: "Daily unique reach", value: `${fmt(Math.round(dailyAmount / suggestedBid.min * 1000 / (budget.frequencyCap?.frequency ?? 3)))} - ${fmt(Math.round(dailyAmount / suggestedBid.max * 1000 * 3 / (budget.frequencyCap?.frequency ?? 3)))}` },
                  { label: "Est. CPM", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ] : isLeadGen ? [
                  { label: "Daily leads", value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 20)} - ${fmt(dailyAmount * 60)}` },
                  { label: "Est. cost per lead", value: `SAR ${suggestedBid.min.toFixed(0)} - ${suggestedBid.max.toFixed(0)}` },
                ] : isAppPromo ? [
                  { label: `Daily ${budget.optimizationGoal === "IN_APP_EVENT" ? "in-app events" : "installs"}`, value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 30)} - ${fmt(dailyAmount * 80)}` },
                  { label: `Est. cost per ${budget.optimizationGoal === "IN_APP_EVENT" ? "event" : "install"}`, value: `SAR ${suggestedBid.min.toFixed(0)} - ${suggestedBid.max.toFixed(0)}` },
                ] : isVideoViews ? [
                  { label: `Daily ${budget.optimizationGoal === "FOCUSED_VIEW" ? "focused views" : "video views"}`, value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 50)} - ${fmt(dailyAmount * 150)}` },
                  { label: "Est. CPV", value: `SAR ${suggestedBid.min.toFixed(3)} - ${suggestedBid.max.toFixed(3)}` },
                ] : isTraffic ? [
                  { label: `Daily ${budget.optimizationGoal === "LANDING_PAGE_VIEW" ? "page views" : "clicks"}`, value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 30)} - ${fmt(dailyAmount * 100)}` },
                  { label: `Est. cost per ${budget.optimizationGoal === "LANDING_PAGE_VIEW" ? "page view" : "click"}`, value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ] : [
                  { label: `Daily ${eventLabel}`, value: `${fmt(Math.round(dailyAmount * 0.8))} - ${fmt(Math.round(dailyAmount * 2.5))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                  { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ]
              }
              disclaimer="Estimates based on similar campaigns. Actual results may vary based on creative quality and competition."
            />

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Budget type", value: BUDGET_TYPES.find((m) => m.value === budget.paymentMethod)?.label ?? "-" },
                { label: "End date", value: budget.endDateOptional ? "Continuous" : budget.endDate || "Not set" },
                { label: "Goal", value: goalLabel },
                { label: "Budget mode", value: budget.budgetMode === "BUDGET_MODE_TOTAL" ? "Lifetime" : "Daily" },
                { label: "Bid", value: budget.bidType === "BID_TYPE_NO_BID" ? "Maximum Delivery" : `${budget.bidStrategy === "BID_CAP" ? "Bid Cap" : "Cost Cap"}: SAR ${budget.bidAmount}` },
                { label: "Schedule", value: budget.schedule === "custom" ? "Custom hours" : "24/7" },
                ...(budget.searchResultEnabled ? [{ label: "Search ads", value: "Enabled" }] : []),
                ...(autoIncrease.enabled ? [{ label: "Auto-increase", value: `+${autoIncrease.pct}% / ${autoIncrease.intervalDays}d` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: dailyAmount >= 50 ? "ok" as const : "warning" as const, text: dailyAmount >= 50 ? "Budget is healthy" : "Below recommended minimum" },
                { label: "Duration", status: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "ok" as const : "warning" as const, text: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "Sufficient learning time" : "Too short for optimization" },
                { label: "Bid strategy", status: "ok" as const, text: budget.bidType === "BID_TYPE_NO_BID" ? "Maximum Delivery" : `${budget.bidStrategy === "BID_CAP" ? "Bid Cap" : "Cost Cap"}: SAR ${budget.bidAmount}` },
                { label: "Billing event", status: "ok" as const, text: budget.billingEvent === "OCPM" ? "oCPM (optimized)" : budget.billingEvent === "CPV" ? "CPV (per view)" : budget.billingEvent },
                ...(isTraffic && budget.optimizationGoal === "LANDING_PAGE_VIEW" && !hasPixel ? [{ label: "Pixel", status: "error" as const, text: "Required for Landing Page View" }] : []),
              ]}
            />

            {/* Disclaimer */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Estimates are approximate and based on TikTok Ads API. Actual results depend on ad quality, competition, and audience engagement.
              </p>
            </div>

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(1)}
        onNext={() => setStep(3)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={isTraffic && budget.optimizationGoal === "LANDING_PAGE_VIEW" && !hasPixel}
      />
    </TooltipProvider>
  );
}
