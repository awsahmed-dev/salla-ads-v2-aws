"use client";

import { useState } from "react";
import { useCampaign } from "@/lib/snapchat/campaign-context";
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
  Zap,
  CreditCard,
  Eye,
  ShoppingCart,
  AlertCircle,
  Wallet,
  MousePointerClick,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Settings2,
  Download,
  Lock,
} from "lucide-react";
import { FrequencyCapCard } from "@/components/shared/frequency-cap-card";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { AdSchedulingCard } from "@/components/shared/ad-scheduling-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { BidStrategyCard } from "@/components/shared/bid-strategy-card";
import { OptimizationGoalCard } from "@/components/shared/optimization-goal-card";
import {
  OBJECTIVE_CONFIGS,
  type OptimizationGoal,
  type ConversionWindow,
  type BidStrategy,
  type PaymentMethod,
} from "@/lib/snapchat/campaign-types";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { AttributionWindowCard } from "@/components/shared/attribution-window-card";
import { DeliveryPacingCard } from "@/components/shared/delivery-pacing-card";

/* ================================================================== */
/*  Static config                                                     */
/* ================================================================== */

const ALL_OPTIMIZATION_GOALS: {
  value: OptimizationGoal;
  label: string;
  desc: string;
  icon: React.ReactNode;
  recommended?: Record<string, boolean>;
  /** If true, this goal requires the advertiser to have an active Snap Pixel with matching events */
  requiresPixel?: boolean;
  /** If true, this goal requires a Mobile Measurement Partner (MMP) integration */
  requiresMMP?: boolean;
  }[] = [
  {
    value: "PIXEL_PURCHASE",
    label: "Purchases",
    desc: "Get the most purchases from your store visitors.",
    icon: <ShoppingCart className="size-4" />,
    recommended: { SALES: true },
    requiresPixel: true,
  },
  {
    value: "PIXEL_ADD_TO_CART",
    label: "Add to Cart",
    desc: "Drive more customers to add products to their cart.",
    icon: <TrendingUp className="size-4" />,
    requiresPixel: true,
  },
  {
    value: "PIXEL_PAGE_VIEW",
    label: "Page Views",
    desc: "Maximize the number of visitors who view pages on your store.",
    icon: <Eye className="size-4" />,
    requiresPixel: true,
  },
  {
    value: "PIXEL_SIGNUP",
    label: "Sign Ups",
    desc: "Get more sign-ups and registrations on your store.",
    icon: <FileText className="size-4" />,
    requiresPixel: true,
  },
  {
    value: "SWIPES",
    label: "Swipe Ups",
    desc: "Drive maximum traffic to your website from ad clicks.",
    icon: <MousePointerClick className="size-4" />,
    recommended: { WEBSITE_VISITS: true },
  },
  {
    value: "LANDING_PAGE_VIEW",
    label: "Landing Page Views",
    desc: "Get higher quality visitors who actually load your page fully.",
    icon: <FileText className="size-4" />,
    requiresPixel: true,
  },
  {
    value: "IMPRESSIONS",
    label: "Impressions",
    desc: "Maximize the number of times your ad is shown. Best for brand awareness.",
    icon: <Eye className="size-4" />,
    recommended: { ENGAGEMENT: true, SPONSORED_CHAT: true },
  },
  {
    value: "STORY_OPENS",
    label: "Story Opens",
    desc: "Get more people to open and view your Story Ad.",
    icon: <Eye className="size-4" />,
  },
  {
    value: "VIDEO_VIEWS",
    label: "Video Views (2s)",
    desc: "Get more people to watch your video ad.",
    icon: <Eye className="size-4" />,
  },
  {
    value: "VIDEO_VIEWS_15_SEC",
    label: "Video Views (15s)",
    desc: "Get more people to watch at least 15 seconds of your video.",
    icon: <Eye className="size-4" />,
  },
  {
    value: "USES",
    label: "Lens/Filter Uses",
    desc: "Get more people to use your branded Lens or Filter.",
    icon: <Sparkles className="size-4" />,
  },
  {
    value: "LEAD_FORM_SUBMISSIONS",
    label: "Form Submissions",
    desc: "Collect leads directly through your ad with a built-in form.",
    icon: <FileText className="size-4" />,
    recommended: { LEADS: true },
  },
  {
    value: "APP_INSTALLS",
    label: "App Installs",
    desc: "Get the most app downloads for your budget.",
    icon: <Download className="size-4" />,
    recommended: { APP_PROMOTION: true },
  },
  {
    value: "APP_PURCHASE",   // Snap API uses singular APP_PURCHASE
    label: "In-App Purchases",
    desc: "Drive purchases within your app from new users. Requires an MMP integration.",
    icon: <ShoppingCart className="size-4" />,
    requiresMMP: true,
  },
  {
    value: "APP_SIGNUP",
    label: "In-App Sign Ups",
    desc: "Get more user registrations within your app. Requires an MMP integration.",
    icon: <FileText className="size-4" />,
    requiresMMP: true,
  },
  {
    value: "APP_ADD_TO_CART",
    label: "In-App Add to Cart",
    desc: "Drive more add-to-cart actions within your app. Requires an MMP integration.",
    icon: <TrendingUp className="size-4" />,
    requiresMMP: true,
  },
  {
    value: "APP_REENGAGE_OPEN",  // Snap API: APP_REENGAGE_OPEN (re-engagement to open the app)
    label: "Re-engage App Opens",
    desc: "Bring back existing app users and encourage them to re-open your app. Requires an MMP integration.",
    icon: <Download className="size-4" />,
    requiresMMP: true,
  },
];


/**
 * Snap API supports exactly 2 conversion_window values for SALES and APP_PROMOTION.
 * SWIPE_1DAY and SWIPE_7DAY_VIEW_1DAY are NOT valid Snap API values.
 */
const CONVERSION_WINDOWS: {
  value: ConversionWindow;
  label: string;
  desc: string;
  recommended?: boolean;
}[] = [
  {
    value: "SWIPE_28DAY_VIEW_1DAY",
    label: "28-Day Click, 1-Day View",
    desc: "Counts results within 28 days of clicking or 1 day of viewing your ad. Best for most campaigns.",
    recommended: true,
  },
  {
    value: "SWIPE_7DAY",
    label: "7-Day Click Only",
    desc: "Only counts results within 7 days of clicking your ad. Stricter measurement.",
  },
];


const BID_STRATEGIES: {
  value: BidStrategy;
  label: string;
  desc: string;
  recommended?: boolean;
}[] = [
  {
    value: "AUTO_BID",
    label: "Auto Bid",
    desc: "We automatically optimize to get the most results for your budget. Best for most advertisers.",
    recommended: true,
  },
  {
    value: "LOWEST_COST_WITH_MAX_BID",
    label: "Max Bid",
    desc: "Set the maximum you are willing to pay per action. You will never pay more than this amount.",
  },
  {
    value: "TARGET_COST",
    label: "Target Cost",
    desc: "Set your target cost per action. Actual cost will average around this amount.",
  },
];


/**
 * Snap API: pacing_type = ACCELERATED is only valid when optimization_goal is one of these.
 * Source: Snap Marketing API Ad Squad spec — pacing_type field constraints.
 * All other goals (pixel events, app-specific events, lead form) require STANDARD pacing.
 */
const ACCELERATED_COMPATIBLE_GOALS: OptimizationGoal[] = [
  "IMPRESSIONS",
  "USES",
  "SWIPES",
  "VIDEO_VIEWS",
  "VIDEO_VIEWS_15_SEC",
  "STORY_OPENS",
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
    desc: "Budget is spent daily. You're charged as impressions are delivered.",
    icon: <CreditCard className="size-4" />,
  },
  {
    value: "prepaid",
    label: "Prepaid (Fixed)",
    desc: "Full budget reserved upfront. Campaign stops when the limit is reached.",
    icon: <Wallet className="size-4" />,
  },
];



/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function StepBudget() {
  const { campaign, setStep, updateNested } = useCampaign();
  const budget = campaign.budget;
  const objectiveConfig = OBJECTIVE_CONFIGS[campaign.objective.objective];

  /* Filter goals and bid strategies based on selected objective */
  const OPTIMIZATION_GOALS = ALL_OPTIMIZATION_GOALS.filter((g) =>
    objectiveConfig.allowedGoals.includes(g.value)
  );

  /**
   * ACCELERATED pacing is only available when the selected optimization_goal is in the
   * Snap API-allowed list. Goals like pixel events, app events, and lead forms are
   * incompatible with ACCELERATED pacing per the Snap Marketing API spec.
   */
  const canUseAccelerated = ACCELERATED_COMPATIBLE_GOALS.includes(budget.optimizationGoal);
  const hasMMP = false; /* TODO: wire when MMP integration exists */
  const goalsWithLocked = OPTIMIZATION_GOALS.map((g) => ({
    value: g.value,
    label: g.label,
    desc: g.desc,
    icon: g.icon,
    recommended: !!g.recommended?.[campaign.objective.objective],
    requiresPixel: g.requiresPixel,
    requiresMMP: g.requiresMMP,
    locked: !!(g.requiresMMP && !hasMMP),
  }));
  const FILTERED_BID_STRATEGIES = BID_STRATEGIES.filter((s) =>
    objectiveConfig.allowedBidStrategies.includes(s.value)
  );

  /* Auto-increase reads from persisted campaign context (fallback for old drafts missing the field) */
  const autoIncrease = budget.autoIncrease ?? {
    enabled: false,
    pct: 20,
    intervalDays: 7,
    maxDailyBudget: budget.amount * 3,
  };

  /* Local UI state */
  const [showAdvanced, setShowAdvanced] = useState(
    budget.pacingType !== "STANDARD" || budget.frequencyCapEnabled || budget.schedule === "custom"
  );
  const [showScheduling, setShowScheduling] = useState(budget.schedule === "custom");

  /* End date is required for Prepaid and Lifetime (both need a finite duration) */
  const endDateRequired = budget.paymentMethod === "prepaid" || budget.type === "lifetime";

  /* Whether auto-increase is available (only daily budget with a set end date) */
  const autoIncreaseAvailable = budget.type === "daily" && !budget.endDateOptional;

  /* Duration calc (minimum 7 days when an end date is set) */
  const MIN_CAMPAIGN_DAYS = 7;
  const durationDays =
    budget.startDate && budget.endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(budget.endDate).getTime() -
              new Date(budget.startDate).getTime()) /
              86400000
          )
        )
      : 14;

  const dailyAmount =
    budget.type === "daily"
      ? budget.amount
      : Math.round(budget.amount / Math.max(1, durationDays));

  /* Suggested bid range (from spend_guidance API in prod) */
  const suggestedBidMap: Record<string, { min: number; max: number }> = {
    PIXEL_PURCHASE: { min: 12.06, max: 21.91 },
    PIXEL_ADD_TO_CART: { min: 5.5, max: 10.25 },
    PIXEL_PAGE_VIEW: { min: 1.2, max: 3.5 },
    SWIPES: { min: 0.6, max: 2.0 },
    LANDING_PAGE_VIEW: { min: 1.0, max: 3.0 },
    IMPRESSIONS: { min: 0.15, max: 0.8 },
    STORY_OPENS: { min: 0.5, max: 1.5 },
    VIDEO_VIEWS: { min: 0.3, max: 1.0 },
    VIDEO_VIEWS_15_SEC: { min: 0.5, max: 1.5 },
    USES: { min: 0.8, max: 2.5 },
  };
  const suggestedBid = suggestedBidMap[budget.optimizationGoal] ?? { min: 1.0, max: 5.0 };

  /* Suggested daily budget (from spend_guidance.default_daily_budget_micros in prod) */
  const suggestedDailyMap: Record<string, number> = {
    PIXEL_PURCHASE: 565,
    PIXEL_ADD_TO_CART: 158,
    PIXEL_PAGE_VIEW: 50,
    SWIPES: 75,
    LANDING_PAGE_VIEW: 80,
    IMPRESSIONS: 50,
    STORY_OPENS: 60,
    VIDEO_VIEWS: 50,
    VIDEO_VIEWS_15_SEC: 60,
    USES: 100,
  };
  const suggestedDaily = suggestedDailyMap[budget.optimizationGoal] ?? 50;

  /* Budget strength -- thresholds adjust per optimization goal */
  const goalMultiplier = budget.optimizationGoal === "PIXEL_PURCHASE" ? 1
    : budget.optimizationGoal === "PIXEL_ADD_TO_CART" ? 0.5
    : budget.optimizationGoal === "PIXEL_PAGE_VIEW" ? 0.2
    : budget.optimizationGoal === "SWIPES" ? 0.15
    : budget.optimizationGoal === "LANDING_PAGE_VIEW" ? 0.2
    : budget.optimizationGoal === "IMPRESSIONS" ? 0.1
    : 0.15;
  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: Math.round(50 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(150 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(300 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(500 * goalMultiplier), pct: 100, color: "bg-primary", textColor: "text-primary", label: "Strong" },
  ];
  const currentTier = [...strengthTiers]
    .reverse()
    .find((t) => dailyAmount >= t.min)!;

  /* Goal label — covers all optimization goals across every objective */
  const goalLabelMap: Record<string, string> = {
    PIXEL_PURCHASE: "purchases",
    PIXEL_ADD_TO_CART: "add to carts",
    PIXEL_PAGE_VIEW: "page views",
    PIXEL_SIGNUP: "sign ups",
    SWIPES: "swipe-ups",
    LANDING_PAGE_VIEW: "landing page views",
    IMPRESSIONS: "impressions",
    STORY_OPENS: "story opens",
    VIDEO_VIEWS: "video views",
    VIDEO_VIEWS_15_SEC: "15s video views",
    USES: "lens uses",
    LEAD_FORM_SUBMISSIONS: "form submissions",
    APP_INSTALLS: "app installs",
    APP_PURCHASE: "in-app purchases",
    APP_SIGNUP: "in-app sign ups",
    APP_ADD_TO_CART: "in-app add-to-carts",
    APP_REENGAGE_OPEN: "re-engagements",
  };
  const goalLabel = goalLabelMap[budget.optimizationGoal] ?? "actions";

  /* Duration preset helper */
  const applyPreset = (days: number) => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + days);
    updateNested("budget", {
      startDate: today.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
  };

  const isPreset = (days: number) => durationDays === days;

  /* Minimum end date: startDate + 7 days */
  const minEndDate = (() => {
    if (!budget.startDate) return new Date().toISOString().split("T")[0];
    const d = new Date(budget.startDate);
    d.setDate(d.getDate() + MIN_CAMPAIGN_DAYS);
    return d.toISOString().split("T")[0];
  })();

  /* Budget auto-increase preview (only meaningful with daily budget + fixed end date) */
  const autoIncreasePreview = (autoIncrease.enabled && autoIncreaseAvailable)
    ? Array.from({ length: Math.floor(durationDays / autoIncrease.intervalDays) }, (_, i) => {
        const day = (i + 1) * autoIncrease.intervalDays;
        const uncapped = Math.round(dailyAmount * Math.pow(1 + autoIncrease.pct / 100, i + 1));
        return { day, budget: Math.min(uncapped, autoIncrease.maxDailyBudget) };
      })
    : [];

  /* Projected total spend with auto-increase factored in (computed BEFORE totalBudget) */
  const projectedTotalSpend = (() => {
    if (!autoIncrease.enabled || !autoIncreaseAvailable) {
      return budget.type === "daily" ? dailyAmount * durationDays : budget.amount;
    }
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

  /* Final daily amount after all auto-increases (for warnings) */
  const finalAutoIncreaseDailyBudget = autoIncreasePreview.length > 0
    ? autoIncreasePreview[autoIncreasePreview.length - 1].budget
    : dailyAmount;

  /* Mock estimates (from outcome estimates API in prod) */
  const totalBudgetBase =
    budget.type === "daily"
      ? budget.amount * durationDays
      : budget.amount;
  const totalBudget = (autoIncrease.enabled && autoIncreaseAvailable) ? projectedTotalSpend : totalBudgetBase;
  const totalWithBoost = totalBudget + (budget.performanceBoost ? 149 : 0);

  const budgetNavDisabled =
    budget.amount < (budget.type === "daily" ? 20 : 100) ||
    !budget.startDate ||
    (!budget.endDateOptional && !budget.endDate) ||
    (!budget.endDateOptional && !!budget.endDate && budget.endDate <= budget.startDate) ||
    (!budget.endDateOptional && durationDays < MIN_CAMPAIGN_DAYS);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>
        {/* ============= LEFT COLUMN ============= */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ======================================================= */}
          {/* SECTION 1: Budget, Duration & Payment (shared card)      */}
          {/* ======================================================= */}
          <BudgetDurationCard
            budgetTypes={BUDGET_TYPES}
            paymentMethod={budget.paymentMethod}
            onPaymentMethodChange={(v) => updateNested("budget", { paymentMethod: v })}
            showLifetimeToggle={true}
            budgetMode={budget.type}
            onBudgetModeChange={(m) => updateNested("budget", { type: m })}
            amount={budget.amount}
            onAmountChange={(v) => updateNested("budget", { amount: v })}
            suggestedDaily={suggestedDaily}
            goalLabel={goalLabel}
            platformName="Snap"
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
          />

          {/* ======================================================= */}
          {/* SECTION 2: Optimization Goal                             */}
          {/* ======================================================= */}
          <OptimizationGoalCard
            goals={goalsWithLocked}
            selectedGoal={budget.optimizationGoal}
            onGoalChange={(v) => {
              const newGoal = v as OptimizationGoal;
              // When the new goal is incompatible with ACCELERATED pacing, revert to STANDARD
              const isNewGoalAcceleratedCompatible = ACCELERATED_COMPATIBLE_GOALS.includes(newGoal);
              updateNested("budget", {
                optimizationGoal: newGoal,
                ...(!isNewGoalAcceleratedCompatible && budget.pacingType === "ACCELERATED"
                  ? { pacingType: "STANDARD" }
                  : {}),
              });
            }}
            layout="grid"
            infoTipText="Choose what action you want to optimize for. This determines how your budget is spent."
            warnings={
              <>
                {OPTIMIZATION_GOALS.some((g) => g.requiresPixel) && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs leading-relaxed text-amber-700">
                      Goals marked <span className="font-semibold">Pixel</span> require a tracking pixel on your store. Make sure you set up your pixel in the previous step for these goals to work.
                    </p>
                  </div>
                )}
                {OPTIMIZATION_GOALS.some((g) => g.requiresMMP) && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-orange-600" />
                    <p className="text-xs leading-relaxed text-orange-700">
                      In-app event goals require a <span className="font-semibold">Mobile Measurement Partner (MMP)</span> such as AppsFlyer, Adjust, or Branch to be integrated into your app. Without an MMP, Snapchat cannot track post-install events.
                    </p>
                  </div>
                )}
              </>
            }
          />

          {/* ======================================================= */}
          {/* SECTION 3: Bid Strategy                                  */}
          {/* ======================================================= */}
          <BidStrategyCard
            strategies={FILTERED_BID_STRATEGIES}
            selectedStrategy={budget.bidStrategy}
            onStrategyChange={(v) => updateNested("budget", { bidStrategy: v })}
            layout="buttons"
            infoTipText="Choose how your budget competes for ad placements. Auto Bid is recommended for most advertisers."
            bidInputs={
              budget.bidStrategy !== "AUTO_BID"
                ? [{
                    label: budget.bidStrategy === "TARGET_COST" ? "Target Cost per Action" : "Maximum Bid per Action",
                    value: budget.bidAmount || undefined,
                    onChange: (v) => updateNested("budget", { bidAmount: v }),
                    prefix: "SAR",
                    suffix: `per ${goalLabel.replace(/s$/, "")}`,
                    min: 0,
                    step: 0.5,
                    suggestedRange: suggestedBid,
                  }]
                : undefined
            }
          />

          {/* ======================================================= */}
          {/* ADVANCED SETTINGS (Collapsible)                          */}
          {/* ======================================================= */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-2.5">
                  <Settings2 className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Advanced Settings</span>
                  <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
                    {[
                      objectiveConfig.hasConversionWindow,
                      budget.pacingType !== "STANDARD",
                      budget.frequencyCapEnabled,
                      showScheduling,
                    ].filter(Boolean).length} active
                  </Badge>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-5 pt-5">

              {/* -- Attribution Window -- */}
              {objectiveConfig.hasConversionWindow && (
                <AttributionWindowCard
                  mode="combined"
                  combinedOptions={CONVERSION_WINDOWS}
                  combinedValue={budget.conversionWindow}
                  onCombinedChange={(v) => updateNested("budget", { conversionWindow: v })}
                  infoTipText="How long after seeing your ad should results be counted? A wider window helps optimize your campaign better."
                />
              )}

              {/* -- Delivery Pacing -- */}
              {/* ACCELERATED is only shown when the selected goal is compatible per Snap API.
                  Compatible goals: IMPRESSIONS, USES, SWIPES, VIDEO_VIEWS, VIDEO_VIEWS_15_SEC, STORY_OPENS.
                  All pixel-event, app-event and lead-form goals require STANDARD pacing. */}
              <DeliveryPacingCard
                layout="buttons"
                options={[
                  { value: "STANDARD", label: "Standard", desc: "Even spend throughout the day." },
                  ...(canUseAccelerated
                    ? [{ value: "ACCELERATED" as const, label: "Accelerated", desc: "Spend budget as fast as possible. Requires Max Bid." }]
                    : []),
                ]}
                selectedPacing={budget.pacingType}
                onPacingChange={(v) => {
                  // Snap API requires bid_strategy = LOWEST_COST_WITH_MAX_BID for ACCELERATED pacing
                  updateNested("budget", {
                    pacingType: v,
                    ...(v === "ACCELERATED" ? { bidStrategy: "LOWEST_COST_WITH_MAX_BID" } : {}),
                  });
                }}
                infoTipText="Standard spreads your budget evenly throughout the day. Accelerated spends as fast as possible — only available for awareness and engagement goals."
                warnings={
                  budget.pacingType === "ACCELERATED" && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5">
                        <AlertCircle className="size-3 shrink-0 text-blue-600" />
                        <span className="text-xs text-blue-700">
                          <span className="font-semibold">Max Bid</span> strategy is required for Accelerated pacing and has been automatically selected.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                        <AlertCircle className="size-3 shrink-0 text-amber-600" />
                        <span className="text-xs text-amber-700">
                          Accelerated pacing may exhaust your daily budget early. Best for flash sales or time-sensitive promotions.
                        </span>
                      </div>
                      {dailyAmount < 100 && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                          <AlertCircle className="size-3 shrink-0 text-red-600" />
                          <span className="text-xs text-red-700">
                            Accelerated pacing with a budget under SAR 100/day is not recommended. Snap may struggle to deliver your ads effectively.
                          </span>
                        </div>
                      )}
                    </div>
                  )
                }
              />

              {/* -- Frequency Capping (Snapchat API: ad_squad.cap_and_exclusion_config.frequency_cap_config) -- */}
              <FrequencyCapCard
                enabled={budget.frequencyCapEnabled}
                onEnabledChange={(checked) => {
                  updateNested("budget", { frequencyCapEnabled: checked });
                }}
                maxImpressions={budget.frequencyCapCount}
                onMaxImpressionsChange={(v) =>
                  updateNested("budget", { frequencyCapCount: v })
                }
                minImpressions={1}
                maxImpressionsMax={15}
                timeWindowValue={budget.frequencyCapInterval.toString()}
                timeWindowOptions={[
                  { value: "6", label: "6 hours" },
                  { value: "12", label: "12 hours" },
                  { value: "24", label: "1 day" },
                  { value: "48", label: "2 days" },
                  { value: "72", label: "3 days" },
                  { value: "168", label: "7 days" },
                  { value: "336", label: "14 days" },
                  { value: "720", label: "30 days" },
                ]}
                onTimeWindowChange={(v) =>
                  updateNested("budget", { frequencyCapInterval: Number(v) })
                }
                timeWindowSummaryLabel={
                  budget.frequencyCapInterval < 24
                    ? `${budget.frequencyCapInterval} hours`
                    : `${budget.frequencyCapInterval / 24} day${budget.frequencyCapInterval > 24 ? "s" : ""}`
                }
                accent="primary"
                showFormatWarning={true}
                infoTipText="Limit how many times one person sees your ad to prevent ad fatigue. Maps to ad squad frequency_cap_config."
              />
              {budget.frequencyCapEnabled && campaign.creative.ads.length > 1 && new Set(campaign.creative.ads.map((a) => a.adFormat ?? "SINGLE")).size > 1 && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-800/40 dark:bg-red-950/30">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-500" />
                  <p className="text-xs leading-relaxed text-red-700 dark:text-red-400">
                    Your ad groups currently use different formats. Snapchat requires all ads to share the same format when frequency cap is enabled. Go to <span className="font-semibold">Ad Design</span> to fix this, or disable frequency cap.
                  </p>
                </div>
              )}

              {/* -- Ad Scheduling (Dayparting) -- */}
              <AdSchedulingCard
                enabled={showScheduling}
                onToggle={(checked) => {
                  setShowScheduling(checked);
                  updateNested("budget", { schedule: checked ? "custom" : "all_day" });
                }}
                infoTipText="Choose specific days and hours to show your ads. Maps to Snap ad squad scheduled_start_time / scheduled_end_time. Times are in Saudi Arabia time (AST, UTC+3)."
              />

            </CollapsibleContent>
          </Collapsible>

          {/* ======================================================= */}
          {/* PERFORMANCE BOOST (Salla Upsell)                         */}
          {/* ======================================================= */}
          <PerformanceBoostCard
            enabled={budget.performanceBoost}
            onToggle={(checked) => updateNested("budget", { performanceBoost: checked })}
          />

        </div>

        {/* ============= RIGHT COLUMN ============= */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="sticky top-20 flex flex-col gap-4">

            {/* Cost Summary (shared) */}
            <CostSummaryCard
              budgetLabel={budget.type === "daily" ? "Daily budget" : "Lifetime budget"}
              budgetAmount={budget.amount}
              durationDays={budget.type === "daily" ? durationDays : undefined}
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
              badge="Snap API"
              bidRange={{
                min: suggestedBid.min,
                max: suggestedBid.max,
                current: budget.bidStrategy !== "AUTO_BID" ? (budget.bidAmount || 0) : undefined,
                goalName:
                  budget.optimizationGoal === "PIXEL_PURCHASE"         ? "Purchase"
                  : budget.optimizationGoal === "PIXEL_ADD_TO_CART"     ? "Add to Cart"
                  : budget.optimizationGoal === "PIXEL_PAGE_VIEW"       ? "Page View"
                  : budget.optimizationGoal === "PIXEL_SIGNUP"          ? "Sign Up"
                  : budget.optimizationGoal === "SWIPES"                ? "Swipe Up"
                  : budget.optimizationGoal === "LANDING_PAGE_VIEW"     ? "Landing Page View"
                  : budget.optimizationGoal === "IMPRESSIONS"           ? "1k Impressions"
                  : budget.optimizationGoal === "STORY_OPENS"           ? "Story Open"
                  : budget.optimizationGoal === "VIDEO_VIEWS"           ? "Video View"
                  : budget.optimizationGoal === "VIDEO_VIEWS_15_SEC"    ? "15s Video View"
                  : budget.optimizationGoal === "USES"                  ? "Lens Use"
                  : budget.optimizationGoal === "LEAD_FORM_SUBMISSIONS" ? "Form Submission"
                  : budget.optimizationGoal === "APP_INSTALLS"          ? "App Install"
                  : budget.optimizationGoal === "APP_PURCHASE"          ? "In-App Purchase"
                  : budget.optimizationGoal === "APP_SIGNUP"            ? "In-App Sign Up"
                  : budget.optimizationGoal === "APP_ADD_TO_CART"       ? "In-App Add to Cart"
                  : budget.optimizationGoal === "APP_REENGAGE_OPEN"     ? "App Re-open"
                  : "Action",
              }}
              dailyBudget={dailyAmount}
              rows={[]}
              disclaimer="Bid estimates are from the Snap Bid Estimate API and depend on your targeting, optimization goal, and market competition. Actual costs may differ."
            />

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Payment", value: BUDGET_TYPES.find((m) => m.value === budget.paymentMethod)?.label ?? "-" },
                { label: "End date", value: budget.endDateOptional ? "Continuous" : budget.endDate || "Not set" },
                { label: "Goal", value: OPTIMIZATION_GOALS.find((g) => g.value === budget.optimizationGoal)?.label ?? "-" },
                { label: "Bid", value: budget.bidStrategy === "AUTO_BID" ? "Auto" : budget.bidStrategy === "TARGET_COST" ? `Target SAR ${budget.bidAmount || 0}` : `Max SAR ${budget.bidAmount || 0}` },
                ...(objectiveConfig.hasConversionWindow ? [{ label: "Attribution", value: budget.conversionWindow === "SWIPE_28DAY_VIEW_1DAY" ? "28d click, 1d view" : "7d click" }] : []),
                { label: "Pacing", value: budget.pacingType === "STANDARD" ? "Standard" : "Accelerated" },
                { label: "Freq. cap", value: budget.frequencyCapEnabled ? `${budget.frequencyCapCount}x / ${budget.frequencyCapInterval < 24 ? `${budget.frequencyCapInterval}h` : `${budget.frequencyCapInterval / 24}d`}` : "Off" },
                { label: "Schedule", value: showScheduling ? "Custom hours" : "24/7" },
                ...(autoIncrease.enabled ? [{ label: "Auto-increase", value: `+${autoIncrease.pct}% / ${autoIncrease.intervalDays}d (max ${autoIncrease.maxDailyBudget})` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: budget.amount >= (budget.type === "daily" ? 20 : 100) ? "ok" : "error", text: budget.amount >= (budget.type === "daily" ? 20 : 100) ? "Meets minimum" : "Below minimum" },
                { label: "Schedule", status: budget.startDate ? "ok" : "warning", text: budget.startDate ? "Start date set" : "No start date" },
                { label: "Goal", status: budget.optimizationGoal ? "ok" : "warning", text: budget.optimizationGoal ? "Selected" : "Not set" },
                { label: "Bid", status: "ok", text: budget.bidStrategy === "AUTO_BID" ? "Auto-optimized" : "Manual" },
              ]}
            />

            {/* Disclaimer */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Estimates are approximate and based on the Snap Outcome Estimates API. Actual results depend on ad quality, competition, and audience engagement.
              </p>
            </div>
          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(1)}
        onNext={() => setStep(3)}
        previousLabel="Previous"
        nextLabel="Next: Creative"
        nextDisabled={budgetNavDisabled}
        accent="primary"
      />
    </TooltipProvider>
  );
}
