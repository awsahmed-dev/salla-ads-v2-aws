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
import { DaypartingCard } from "@/components/tiktok/dayparting-card";
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
import {
  LearnMoreTrigger,
  LearnMoreSheet,
  SheetSection,
  SheetDecisionCard,
  useLearnMore,
} from "@/components/shared/learn-more-sheet";
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
import { ScenarioDBlocker } from "@/components/tiktok/scenario-blocker";
import { getSalesScenario } from "@/lib/tiktok/scenario";

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
  // Phase 3 fix: "Impressions (Frequency)" mode removed — TikTok has no
  // "SHOW" optimization_goal. Impression capping is controlled via the
  // frequency + frequency_schedule fields on REACH campaigns.
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
    value: "VIEW_CONTENT",
    label: "View Product",
    desc: "Optimizes for product page views. Good for awareness.",
    icon: <Eye className="size-3.5" />,
    funnelStage: "Top funnel",
  },
  {
    value: "ADD_TO_CART",
    label: "Add to Cart",
    desc: "Optimizes for users who add products to their cart.",
    icon: <ShoppingCart className="size-3.5" />,
    funnelStage: "Mid funnel",
  },
  {
    value: "INITIATE_CHECKOUT",
    label: "Initiate Checkout",
    desc: "Optimizes for users who start the checkout process.",
    icon: <Wallet className="size-3.5" />,
    funnelStage: "Mid funnel",
  },
  {
    value: "ADD_BILLING",
    label: "Add Payment Info",
    desc: "Optimizes for users who enter payment details.",
    icon: <CreditCard className="size-3.5" />,
    funnelStage: "Bottom funnel",
  },
  {
    value: "COMPLETE_PAYMENT",
    label: "Purchase",
    desc: "Optimizes for completed orders. This is the most common choice.",
    icon: <CreditCard className="size-3.5" />,
    funnelStage: "Bottom funnel",
    recommended: true,
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
    supportedGoals: ["CONVERSION", "VALUE", "CLICK", "LANDING_PAGE_VIEW", "REACH", "VIDEO_VIEW", "FOCUSED_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"],
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
    supportedGoals: ["CONVERSION", "VALUE", "VIDEO_VIEW", "FOCUSED_VIEW", "LANDING_PAGE_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"],
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
    supportedGoals: ["CONVERSION", "CLICK", "LANDING_PAGE_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"],
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
  const isSales = campaign.objective.objective === "PRODUCT_SALES";
  const hasPixel = campaign.objective.pixelMode !== "none";
  // Smart+ budget mode — when AUTO, one campaign budget that TikTok
  // distributes across ad groups (sets budget_optimize_on=true on the API).
  const sp = campaign.objective.smartPlus;
  // Scenario C (Classic Search Ads) drops Smart+ entirely, so the slim
  // Smart+ banner at the top of the budget step is hidden — the merchant
  // is now in the manual classic auction mode (cost-per-keyword bidding).
  const scenario = getSalesScenario(campaign);
  const smartBudgetEligible = sp.enabled
    && (isLeadGen || isAppPromo || (isSales && !scenario.isClassicSearch))
    && !scenario.isBlocked;


  /* Auto-increase from campaign context (fallback for old drafts) */
  const autoIncrease = budget.autoIncrease ?? {
    enabled: false,
    pct: 20,
    intervalDays: 7,
    maxDailyBudget: budget.amount * 3,
  };

  /* Local UI state */
  const [showAdvanced, setShowAdvanced] = useState(false);
  const optimizationGoalLearnMore = useLearnMore();
  const bidStrategyLearnMore = useLearnMore();
  const budgetDurationLearnMore = useLearnMore();
  const attributionWindowLearnMore = useLearnMore();
  const frequencyCapLearnMore = useLearnMore();
  const deliveryOptionsLearnMore = useLearnMore();

  // Phase 2 fix: Lifetime (BUDGET_MODE_TOTAL) campaigns REQUIRE an end date —
  // TikTok rejects lifetime budgets without schedule_end_time.
  const endDateRequired =
    budget.paymentMethod === "prepaid" || budget.budgetMode === "BUDGET_MODE_TOTAL";

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

          {/* Scenario D blocker — disables Next when Catalog + Search are
              both on (TikTok refuses to deliver this combination). */}
          <ScenarioDBlocker />

          {/* Reach awareness banner — parallels the Smart+ banner used
              for Sales. Surfaces the playbook: CPM bidding, frequency
              cap controls fatigue, no pixel needed. */}
          {isReach && (
            <SectionCard>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                  <Sparkles className="size-4 text-blue-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">Budget &amp; schedule</p>
                    <Badge className="rounded-full bg-blue-50 px-2 py-0 text-[10px] font-bold text-blue-700 hover:bg-blue-50">Reach · CPM</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Reach campaigns bill by <strong>CPM</strong> (cost per 1,000 impressions). Salla best practice: <strong>start with SAR 100/day for 14 days</strong>, frequency cap at 3 impressions / 7 days. No pixel or conversion tracking needed.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ---- Smart+ Budget status note ──
              No Auto/Manual toggle. All budget fields show by default with
              AI-recommended defaults. The merchant picks Campaign-level
              vs. Ad-group-level allocation via the radio in Section 3. */}
          {smartBudgetEligible && (
            <SectionCard>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#004956]">
                  <Sparkles className="size-4 text-[#a4ffe5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">Budget &amp; schedule</p>
                    <Badge className="rounded-full bg-[#e6fff9] px-2 py-0 text-[10px] font-bold text-[#004956] hover:bg-[#e6fff9]">Smart+</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Smart+ recommends pacing automatically. Salla best practice: <strong>20× your target CPA</strong> as daily budget — gives TikTok enough data to learn within 7 days. Pick Campaign-level distribution to let TikTok shift spend between ad groups; pick Ad-group-level to cap spend per group.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ======================================================= */}
          {/* SECTION 1: Optimization Goal                             */}
          {/* ======================================================= */}
          <OptimizationGoalCard
            goals={ALL_OPTIMIZATION_GOALS.filter((g) =>
              objectiveConfig.allowedGoals.includes(g.value)
            )}
            selectedGoal={budget.optimizationGoal}
            learnMoreTrigger={<LearnMoreTrigger {...optimizationGoalLearnMore.triggerProps} />}
            onGoalChange={(value) => {
              const billingEvent: BillingEvent =
                value === "CLICK" ? "CPC"
                : value === "REACH" ? "CPM"
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
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                <p className="text-xs leading-relaxed text-[#004956]/80">
                  Reach campaigns use <span className="font-medium text-[#004956]">CPM (Cost per 1,000 impressions)</span> billing. You are charged for every 1,000 times your ad is shown. No pixel or conversion tracking is needed.
                </p>
              </div>
            )}

            {/* Traffic: optimization explanation */}
            {isTraffic && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    {budget.optimizationGoal === "CLICK"
                      ? <>Traffic campaigns with <span className="font-medium text-[#004956]">Clicks</span> use CPC billing. You are charged only when someone clicks your ad. No pixel is required.</>
                      : <>Traffic campaigns with <span className="font-medium text-[#004956]">Landing Page View</span> use oCPM billing. A view is counted only when the user clicks AND your landing page fully loads. Requires a TikTok Pixel.</>
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

                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    <span className="font-semibold text-[#004956]">Salla Tip:</span> Start with <span className="font-semibold">Clicks</span> for quick setup, or use <span className="font-semibold">Landing Page View</span> with a pixel for higher-quality visitors who actually reach your store.
                  </p>
                </div>
              </div>
            )}

            {/* Lead Gen: CPL explanation */}
            {isLeadGen && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    Lead Generation campaigns use <span className="font-medium text-[#004956]">oCPM billing</span> (optimized CPM), but TikTok optimizes delivery to maximize form submissions. Your effective cost is measured as <span className="font-medium text-[#004956]">Cost per Lead (CPL)</span>.
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    <span className="font-semibold text-[#004956]">Salla Tip:</span> Use <span className="font-semibold">More Volume</span> instant forms to get the most leads at the lowest CPL, or <span className="font-semibold">Higher Intent</span> forms for better lead quality. You can configure your form in the Ad Design step.
                  </p>
                </div>
              </div>
            )}

            {/* App Promo: CPI explanation */}
            {isAppPromo && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    App Install campaigns use <span className="font-medium text-[#004956]">oCPM billing</span> (optimized CPM), but TikTok optimizes delivery to maximize installs. Your effective cost is measured as <span className="font-medium text-[#004956]">Cost per Install (CPI)</span>.
                    {budget.optimizationGoal === "IN_APP_EVENT" && <>{" "}For AEO campaigns, TikTok optimizes for your chosen in-app event using SDK data.</>}
                  </p>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    <span className="font-semibold text-[#004956]">Salla Tip:</span> Start with <span className="font-semibold">App Install</span> optimization to build your user base, then switch to <span className="font-semibold">In-App Event (AEO)</span> once you have enough install data. Use engaging 15-30s video content showcasing your app.
                  </p>
                </div>
              </div>
            )}

            {/* Video Views: CPV explanation */}
            {isVideoViews && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2.5">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    {budget.optimizationGoal === "VIDEO_VIEW"
                      ? <>Video View campaigns use <span className="font-medium text-[#004956]">CPV (Cost Per View)</span> billing. A view is counted when a user watches your video for at least <span className="font-medium text-[#004956]">2 seconds</span>. Ideal for maximizing view volume.</>
                      : <>Focused View campaigns use <span className="font-medium text-[#004956]">CPV (Cost Per View)</span> billing. A focused view is counted when a user watches your video for at least <span className="font-medium text-[#004956]">6 seconds</span> or engages with it. Higher quality engagement.</>
                    }
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                  <p className="text-xs leading-relaxed text-[#004956]/80">
                    <span className="font-semibold text-[#004956]">Salla Tip:</span> Start with <span className="font-semibold">Video View (2s)</span> to maximize view volume, or use <span className="font-semibold">Focused View (6s)</span> when you want viewers who truly engage with your content.
                  </p>
                </div>
              </div>
            )}
          </OptimizationGoalCard>


          {/* ======================================================= */}
          {/* REACH: Primary Frequency Cap card                        */}
          {/* Promoted out of "Advanced Settings" — frequency + freq_  */}
          {/* schedule are REQUIRED API fields for Reach (per TikTok   */}
          {/* Marketing API v1.3) and the single defining knob of the  */}
          {/* objective. Burying it inside a collapsible was a UX bug. */}
          {/* The shared FrequencyCapCard component is reused as-is.   */}
          {/* ======================================================= */}
          {isReach && (
            <FrequencyCapCard
              enabled={true}
              onEnabledChange={() => {}}
              hideToggle={true}
              learnMoreTrigger={<LearnMoreTrigger {...frequencyCapLearnMore.triggerProps} />}
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
              infoTipText="Controls how many times each unique user sees your ad. Maps to TikTok API fields frequency + frequency_schedule on the ad-group. REQUIRED for the Reach objective — without it the campaign rejects at submit."
              summaryTip={
                <>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    {(budget.frequencyCap?.frequency ?? 3) <= 2
                      ? "Low frequency — maximizes unique reach but limits message reinforcement. Best for top-of-funnel brand awareness."
                      : (budget.frequencyCap?.frequency ?? 3) <= 5
                        ? "Balanced frequency — good mix of reach and message reinforcement. Recommended for most product launches."
                        : "High frequency — strong message reinforcement but real risk of ad fatigue. Use only for short tactical flights."}
                  </p>
                  <div className="flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                    <p className="text-xs leading-relaxed text-[#004956]/80">
                      <span className="font-semibold text-[#004956]">Salla Tip:</span> For product launches in KSA, use <span className="font-semibold">3 times per 7 days</span>. For ongoing brand awareness, drop to <span className="font-semibold">2 times per 7 days</span> to maximize unique reach across your audience.
                    </p>
                  </div>
                </>
              }
            />
          )}

          {/* ======================================================= */}
          {/* Phase 5: In-App Event (AEO + App VBO)                   */}
          {/* Required when IN_APP_EVENT goal or VALUE goal on App.   */}
          {/* Maps to app_event_id + deep_external_action on adgroup. */}
          {/* TODO(Phase 5 backend): replace free-text inputs with a  */}
          {/* dropdown populated from /app/event/list/ for the app.   */}
          {/* ======================================================= */}
          {isAppPromo && (budget.optimizationGoal === "IN_APP_EVENT" || budget.optimizationGoal === "VALUE") && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <Target className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">In-App Event</Label>
                <InfoTip text="The in-app event TikTok will optimize for. The event id comes from your app registration in TikTok Events Manager. Maps to app_event_id and deep_external_action on the ad group." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Select the event in your app TikTok should optimize for (e.g. Purchase, Subscribe, Level Up). The app must send this event via the TikTok SDK or an MMP integration.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Event ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. 7123456789012345678"
                    value={campaign.objective.appSettings.appEventId}
                    onChange={(e) => updateNested("objective", {
                      appSettings: { ...campaign.objective.appSettings, appEventId: e.target.value },
                    })}
                    className="h-9 font-mono text-sm"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">From TikTok Events Manager → your app.</p>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Event Category <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="PURCHASE, REGISTRATION, LEVEL_UP, …"
                    value={campaign.objective.appSettings.deepExternalAction}
                    onChange={(e) => updateNested("objective", {
                      appSettings: { ...campaign.objective.appSettings, deepExternalAction: e.target.value.toUpperCase() },
                    })}
                    className="h-9 text-sm uppercase"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Maps to deep_external_action.</p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ======================================================= */}
          {/* SECTION 2b: ROAS Target (APP_PROMOTION + VALUE only)    */}
          {/* ConversionEventCard is hidden for App Promo, so we need */}
          {/* a standalone ROAS input for the VO_MIN_ROAS deep bid.   */}
          {/* ======================================================= */}
          {isAppPromo && budget.optimizationGoal === "VALUE" && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Minimum ROAS Target</Label>
                <InfoTip text="Set the minimum Return on Ad Spend you want to achieve. TikTok will optimize delivery to meet this target. Maps to the roas_bid API field with deep_bid_type = VO_MIN_ROAS." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                How much revenue do you expect for every SAR 1 spent? TikTok will prioritize users most likely to generate this return.
              </p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min={0.01}
                    max={1000}
                    step={0.1}
                    value={budget.roasBid ?? 1}
                    onChange={(e) => updateNested("budget", { roasBid: Math.max(0.01, parseFloat(e.target.value) || 1) })}
                    className="h-9 pl-8 text-sm"
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  SAR 1 spent → SAR {(budget.roasBid ?? 1).toFixed(1)} returned
                </span>
              </div>
              {(budget.roasBid ?? 1) >= 2.0 && (budget.roasBid ?? 1) <= 5.0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-1.5">
                  <Sparkles className="size-3 shrink-0 text-[#004956]" />
                  <p className="text-xs text-[#004956]/80">ROAS target is in the recommended range (2×–5×).</p>
                </div>
              )}
              {(budget.roasBid ?? 1) > 5.0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                  <AlertCircle className="size-3 shrink-0 text-amber-600" />
                  <p className="text-xs text-amber-700">High ROAS target — delivery may be limited. Consider lowering to 2×–5× for better volume.</p>
                </div>
              )}
            </SectionCard>
          )}

          {/* ======================================================= */}
          {/* SECTION 3: Conversion Event (only for CONVERSION/VALUE) */}
          {/* ======================================================= */}
          {!isReach && !isTraffic && !isVideoViews && !isLeadGen && !isAppPromo && budget.optimizationGoal !== "CLICK" && (
            <ConversionEventCard
              events={CONVERSION_EVENTS}
              selectedEvent={budget.optimizationEvent}
              onEventChange={(v) => updateNested("budget", { optimizationEvent: v })}
              layout="dropdown"
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
            learnMoreTrigger={<LearnMoreTrigger {...bidStrategyLearnMore.triggerProps} />}
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
              budget.optimizationGoal === "VALUE" && budget.bidType === "BID_TYPE_CUSTOM"
                ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
                      <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                      <p className="text-xs leading-relaxed text-[#004956]">
                        Your <span className="font-semibold">minimum ROAS target</span> ({budget.roasBid ?? 1}×) controls the cost cap. TikTok will aim to maintain at least this return on ad spend. Adjust your target in the ROAS section above.
                      </p>
                    </div>
                  )
                : budget.bidType !== "BID_TYPE_NO_BID" && budget.bidAmount > 0 && budget.bidAmount > budget.amount
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
              budget.bidType === "BID_TYPE_CUSTOM" && budget.optimizationGoal !== "VALUE"
                ? [{
                    label: budget.bidStrategy === "BID_CAP" ? "Maximum Bid per Action" : "Target Cost per Action",
                    desc: budget.bidStrategy === "BID_CAP"
                      ? "TikTok will never bid above this amount. Set it too low and you may not win any auctions."
                      : "TikTok will try to keep your average cost per result close to this amount.",
                    value: budget.bidAmount || undefined,
                    onChange: (v) => updateNested("budget", { bidAmount: v }),
                    prefix: "SAR",
                    suffix: `per ${goalLabel.replace(/s$/, "")}`,
                    min: 0.01,
                    step: 0.5,
                    suggestedRange: suggestedBid,
                    warning: budget.bidAmount > 0 && budget.bidAmount < suggestedBid.min
                      ? `Your bid of SAR ${budget.bidAmount.toFixed(2)} is below the suggested minimum of SAR ${suggestedBid.min.toFixed(2)}. You may get very few or no results.`
                      : undefined,
                    tip: budget.bidAmount >= suggestedBid.min && budget.bidAmount <= suggestedBid.max
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
            learnMoreTrigger={<LearnMoreTrigger {...budgetDurationLearnMore.triggerProps} />}
            paymentMethod={budget.paymentMethod}
            onPaymentMethodChange={(v) => updateNested("budget", { paymentMethod: v })}
            showLifetimeToggle={true}
            budgetMode={budget.budgetMode === "BUDGET_MODE_TOTAL" ? "lifetime" : "daily"}
            onBudgetModeChange={(mode) =>
              updateNested("budget", {
                budgetMode: mode === "lifetime" ? "BUDGET_MODE_TOTAL" : "BUDGET_MODE_DAY",
                // Phase 2 fix: Lifetime budgets require a concrete end date.
                // Force-clear the "ongoing" toggle when switching into lifetime.
                ...(mode === "lifetime" && { endDateOptional: false }),
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
          {/* SECTION 4b: Dayparting (TikTok API: schedule_type +      */}
          {/* dayparting). Map of 168 hour slots (Mon-Sun × 24h).      */}
          {/* ======================================================= */}
          <DaypartingCard
            scheduleType={budget.scheduleType ?? "ALL_DAY"}
            dayparting={budget.dayparting ?? ""}
            onScheduleTypeChange={(t) => updateNested("budget", { scheduleType: t })}
            onDaypartingChange={(mask) => updateNested("budget", { dayparting: mask })}
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

              {/* Frequency Cap moved out — for Reach it's a REQUIRED API
                  field and now lives as a primary card above the
                  Bid Strategy section. No other objective uses it. */}

              {/* -- Attribution Window -- */}
              {!isReach && budget.optimizationGoal !== "CLICK" && (
                <AttributionWindowCard
                  mode="separate"
                  learnMoreTrigger={<LearnMoreTrigger {...attributionWindowLearnMore.triggerProps} />}
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

              {/* -- Skip Learning Phase & Search Ads -- */}
              {/* Hidden entirely for REACH/VIDEO_VIEW/FOCUSED_VIEW where neither option applies */}
              {!["REACH", "VIDEO_VIEW", "FOCUSED_VIEW"].includes(budget.optimizationGoal) && (
              <SectionCard>
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="size-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Delivery Options</Label>
                  <InfoTip text="Additional options that affect how TikTok delivers your ads." />
                  <LearnMoreTrigger {...deliveryOptionsLearnMore.triggerProps} />
                </div>

                {/* Skip Learning Phase (oCPM-billed conversion/event goals only) */}
                {["CONVERSION", "VALUE", "LANDING_PAGE_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"].includes(budget.optimizationGoal) && (
                  <>
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
                  </>
                )}

                {/* Search Ads (all goals except REACH, VIDEO_VIEW, FOCUSED_VIEW) */}
                {!["REACH", "VIDEO_VIEW", "FOCUSED_VIEW"].includes(budget.optimizationGoal) && (
                  <div className={cn("flex items-center justify-between rounded-lg border border-border px-3 py-2.5", ["CONVERSION", "VALUE", "LANDING_PAGE_VIEW", "LEAD_GENERATION", "INSTALL", "IN_APP_EVENT"].includes(budget.optimizationGoal) && "mt-3")}>
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
                {budget.searchResultEnabled && !["REACH", "VIDEO_VIEW", "FOCUSED_VIEW"].includes(budget.optimizationGoal) && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2">
                    <Sparkles className="mt-0.5 size-3 shrink-0 text-[#004956]" />
                    <p className="text-xs leading-relaxed text-[#004956]/80">
                      Search ads appear when users search for keywords related to your products on TikTok. This can drive additional high-intent traffic at no extra cost.
                    </p>
                  </div>
                )}

              </SectionCard>
              )}

            </CollapsibleContent>
          </Collapsible>

        </div>

        {/* ============= RIGHT COLUMN (Budget summary) ============= */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">

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
                { label: "Bid", value: budget.bidType === "BID_TYPE_NO_BID" ? "Maximum Delivery" : budget.optimizationGoal === "VALUE" ? `Cost Cap: ${budget.roasBid ?? 1}× ROAS` : `${budget.bidStrategy === "BID_CAP" ? "Bid Cap" : "Cost Cap"}: SAR ${budget.bidAmount}` },
                { label: "Schedule", value: budget.schedule === "custom" ? "Custom hours" : "24/7" },
                ...(budget.searchResultEnabled ? [{ label: "Search ads", value: "Enabled" }] : []),
                ...(autoIncrease.enabled ? [{ label: "Auto-increase", value: `+${autoIncrease.pct}% / ${autoIncrease.intervalDays}d` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: dailyAmount >= 50 ? "ok" as const : "warning" as const, text: dailyAmount >= 50 ? "Budget is healthy" : "Below recommended minimum" },
                { label: "Duration", status: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "ok" as const : "warning" as const, text: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "Sufficient learning time" : "Too short for optimization" },
                { label: "Bid strategy", status: "ok" as const, text: budget.bidType === "BID_TYPE_NO_BID" ? "Maximum Delivery" : budget.optimizationGoal === "VALUE" ? `Cost Cap: ${budget.roasBid ?? 1}× ROAS` : `${budget.bidStrategy === "BID_CAP" ? "Bid Cap" : "Cost Cap"}: SAR ${budget.bidAmount}` },
                { label: "Billing event", status: "ok" as const, text: budget.billingEvent === "OCPM" ? "oCPM (optimized)" : budget.billingEvent === "CPV" ? "CPV (per view)" : budget.billingEvent },
                ...(isTraffic && budget.optimizationGoal === "LANDING_PAGE_VIEW" && !hasPixel ? [{ label: "Pixel", status: "error" as const, text: "Required for Landing Page View" }] : []),
              ]}
              tips={[
                ...(!budget.endDateOptional ? [{ text: "Ongoing campaigns perform up to 40% better. Switch to Ongoing for the best results." }] : []),
                ...(dailyAmount < suggestedDaily ? [{ text: `Increasing your budget to SAR ${suggestedDaily}/day could significantly improve delivery and reach.` }] : []),
                ...(budget.bidType !== "BID_TYPE_NO_BID" ? [{ text: "Maximum Delivery (auto-bid) is recommended for most advertisers — it lets TikTok optimize for the best results." }] : []),
                // Reach playbook — Salla-tuned awareness tactics.
                ...(isReach && (budget.frequencyCap?.frequency ?? 3) > 5
                  ? [{ text: "Frequency above 5× / 7 days risks ad fatigue. Drop to 2–3× to stretch your budget further across unique users." }]
                  : []),
                ...(isReach && durationDays < 14 && !budget.endDateOptional
                  ? [{ text: "Awareness flights below 14 days leave money on the table — TikTok needs ~7 days to optimize reach delivery. Extend or switch to Ongoing." }]
                  : []),
                ...(isReach && !campaign.audience.autoTargetingEnabled
                  ? [{ text: "Audience Expansion is off. Reach campaigns get ~2× more unique users when expansion is on — flip it in the Audience step." }]
                  : []),
                ...(isReach && campaign.audience.languages.length === 0 && campaign.audience.locationIds.length > 1
                  ? [{ text: "Multi-country reach without a language filter often wastes impressions on the wrong dialect. Add Arabic (and English if you sell globally) in the Audience step." }]
                  : []),
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
      {/* ── Learn More Sheets ── */}
      <LearnMoreSheet
        open={optimizationGoalLearnMore.open}
        onOpenChange={optimizationGoalLearnMore.setOpen}
        title="Optimization Strategy"
        description="Your optimization goal tells TikTok what result to maximize with your budget. It directly controls which users see your ad."
        icon={<Target />}
        proTip="Start with a higher-funnel goal (like Page Views) to build Pixel data, then switch to Purchase optimization once you have 50+ events per week."
      >
        <SheetSection icon={<Target />} title="Which goal should I pick?">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Page Views / Landing Page View"
              description="Best for new Pixels with little data. Low cost, builds your retargeting pool quickly."
            />
            <SheetDecisionCard
              title="Add to Cart / Initiate Checkout"
              description="Mid-funnel goals. Use when you have 100+ page view events and want to push users deeper."
            />
            <SheetDecisionCard
              title="Complete Payment (Purchase)"
              description="Highest-value goal. Requires a mature Pixel with 50+ weekly purchases for stable optimization."
              highlighted
            />
            <SheetDecisionCard
              title="Value (ROAS)"
              description="Optimizes for total revenue, not just conversion count. Best for stores with varied product prices."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Info />} title="How it works">
          <p className="text-xs leading-relaxed text-muted-foreground">
            TikTok&apos;s algorithm uses your Pixel event data to find users most likely to take your chosen action. A well-fed Pixel (with enough historical conversions) allows the algorithm to model your ideal customer and bid accurately in the ad auction.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={bidStrategyLearnMore.open}
        onOpenChange={bidStrategyLearnMore.setOpen}
        title="Bidding Strategy"
        description="Your bid strategy controls how TikTok competes in the ad auction for each impression. It directly affects your cost per result and delivery volume."
        icon={<Gauge />}
        proTip="Start with Maximum Delivery (auto-bid) for the first 1–2 weeks. Once you know your average CPA, switch to Cost Cap to lock in that target."
      >
        <SheetSection icon={<Gauge />} title="Strategy comparison">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Maximum Delivery (Auto Bid)"
              description="TikTok bids as aggressively as needed to spend your full daily budget. You get the most results, but individual CPA may vary. Best for learning-phase campaigns."
              highlighted
            />
            <SheetDecisionCard
              title="Cost Cap"
              description="TikTok targets an average cost per result close to your cap. Delivery may slow if the market is competitive, but your average CPA stays controlled."
            />
            <SheetDecisionCard
              title="Bid Cap"
              description="Hard ceiling on each individual bid. Gives maximum cost control but can severely limit delivery if set too low. Best for experienced advertisers."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<Info />} title="When to switch">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Use auto-bid during the <span className="font-semibold text-foreground">learning phase</span> (first 50 conversions). Once your CPA stabilizes, consider switching to Cost Cap to prevent cost spikes during high-competition periods like weekends or salary week.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={budgetDurationLearnMore.open}
        onOpenChange={budgetDurationLearnMore.setOpen}
        title="Budget & Duration"
        description="Your budget and schedule determine how much TikTok can spend and for how long. Getting these right is critical for the learning phase."
        icon={<Wallet />}
        proTip="Set your daily budget to at least 50× your expected CPA. This gives TikTok enough room to exit the learning phase within 7 days."
      >
        <SheetSection icon={<DollarSign />} title="Daily vs Lifetime">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Daily Budget"
              description="TikTok spends up to this amount each day. Spend is consistent and predictable. Works with auto-increase and ongoing campaigns."
              highlighted
            />
            <SheetDecisionCard
              title="Lifetime Budget"
              description="TikTok spreads the total across the campaign duration. Allows TikTok to spend more on high-opportunity days and less on slow days."
            />
          </div>
        </SheetSection>
        <SheetSection icon={<TrendingUp />} title="Auto-Increase">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Auto-Increase gradually raises your daily budget on a schedule or based on ROAS performance. This prevents the need to manually adjust budgets as campaigns scale. A <span className="font-semibold text-foreground">safety cap</span> ensures your daily spend never exceeds a set maximum.
          </p>
        </SheetSection>
        <SheetSection icon={<Clock />} title="Campaign duration">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Ongoing campaigns</span> (no end date) tend to outperform fixed-duration ones by up to 40%. The algorithm continuously learns and improves over time. If you need a fixed schedule, aim for at least 14 days to clear the learning phase.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={attributionWindowLearnMore.open}
        onOpenChange={attributionWindowLearnMore.setOpen}
        title="Attribution Window"
        description="The attribution window defines how long after an ad interaction a conversion is credited to your campaign. It affects both reporting accuracy and delivery optimization."
        icon={<Link />}
        proTip="A wider window gives TikTok more conversion signals, which improves delivery optimization. Only narrow it if you sell impulse-buy products with very short purchase cycles."
      >
        <SheetSection icon={<MousePointerClick />} title="Click-through window">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Counts conversions that happen after a user <span className="font-semibold text-foreground">clicks</span> your ad. A 7-day click window means a purchase made 5 days after clicking still counts as a result. TikTok supports 1-day, 7-day, 14-day, and 28-day click windows.
          </p>
        </SheetSection>
        <SheetSection icon={<Eye />} title="View-through window">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Counts conversions that happen after a user <span className="font-semibold text-foreground">views</span> (but doesn&apos;t click) your ad. This captures users who are influenced by your ad but convert later through a direct visit or search. Typically set to 1 day since view-through influence fades quickly.
          </p>
        </SheetSection>
        <SheetSection icon={<Info />} title="Recommended setup">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="7-day click + 1-day view"
              description="The most balanced setup for e-commerce. Captures the full purchase cycle while keeping view-through attribution tight."
              highlighted
            />
            <SheetDecisionCard
              title="1-day click + off"
              description="For impulse purchases or app installs where the decision happens immediately. Gives the tightest attribution but fewer signals for optimization."
            />
          </div>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={frequencyCapLearnMore.open}
        onOpenChange={frequencyCapLearnMore.setOpen}
        title="Frequency Cap"
        description="Controls how many times each individual user sees your ad within a time window. Essential for Reach campaigns to prevent ad fatigue."
        icon={<Repeat />}
        proTip="For Reach campaigns, start with 3 impressions per 7 days. This balances message reinforcement with audience freshness."
      >
        <SheetSection icon={<Repeat />} title="Why frequency matters">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Showing your ad too many times to the same person leads to <span className="font-semibold text-foreground">ad fatigue</span> — users start ignoring or hiding your content. But showing it too few times means your message doesn&apos;t stick. The right balance depends on your campaign goal.
          </p>
        </SheetSection>
        <SheetSection icon={<Info />} title="Frequency guidelines">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="1-2 times (Low)"
              description="Maximizes unique reach. Best for broad awareness when your goal is to touch as many different people as possible."
            />
            <SheetDecisionCard
              title="3-5 times (Balanced)"
              description="Good mix of reach and reinforcement. Recommended for most campaigns — enough repetition for recall without causing fatigue."
              highlighted
            />
            <SheetDecisionCard
              title="6+ times (High)"
              description="Heavy reinforcement for time-sensitive promotions or complex messages that need repetition. Monitor performance closely."
            />
          </div>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={deliveryOptionsLearnMore.open}
        onOpenChange={deliveryOptionsLearnMore.setOpen}
        title="Delivery Options"
        description="Advanced settings that control how TikTok delivers your ads beyond the standard budget and bidding configuration."
        icon={<Settings2 />}
        proTip="Leave Skip Learning Phase off for your first campaign. The learning phase is when TikTok figures out who responds best to your ads."
      >
        <SheetSection icon={<SkipForward />} title="Skip Learning Phase">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Every new ad group enters a <span className="font-semibold text-foreground">learning phase</span> where TikTok experiments with different audiences and placements to find the best-performing combination. Skipping this phase starts full delivery immediately, but the algorithm won&apos;t have optimized targeting data — resulting in potentially <span className="font-semibold text-foreground">higher and more volatile costs</span>. Only recommended for experienced advertisers who already know their audience well.
          </p>
        </SheetSection>
        <SheetSection icon={<MousePointerClick />} title="TikTok Search Ads">
          <p className="text-xs leading-relaxed text-muted-foreground">
            When enabled, your ads also appear in TikTok&apos;s search results when users search for related keywords. This captures <span className="font-semibold text-foreground">high-intent users</span> who are actively looking for products or content like yours. Search ads use the same budget and bidding as your main campaign — no additional cost configuration needed.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <WizardStepFooter
        onPrevious={() => setStep(1)}
        onNext={() => setStep(3)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={(isTraffic && budget.optimizationGoal === "LANDING_PAGE_VIEW" && !hasPixel) || scenario.isBlocked}
      />
    </TooltipProvider>
  );
}
