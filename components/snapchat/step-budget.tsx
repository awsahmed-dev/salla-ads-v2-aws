"use client";

import { useEffect, useState } from "react";
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
  CheckCircle2,
  Wallet,
  MousePointerClick,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Settings2,
  Download,
  Lock,
  Clock,
} from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { fmt } from "@/components/shared/fmt";
import { BidStrategyCard } from "@/components/shared/bid-strategy-card";
import { OptimizationGoalCard } from "@/components/shared/optimization-goal-card";
import {
  OBJECTIVE_CONFIGS,
  getGoalsForLocation,
  TARGET_COST_COMPATIBLE_GOALS,
  type OptimizationGoal,
  type ConversionWindow,
  type BidStrategy,
  type PaymentMethod,
} from "@/lib/snapchat/campaign-types";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { DeliveryPacingCard } from "@/components/shared/delivery-pacing-card";
import { AttributionWindowCard } from "@/components/shared/attribution-window-card";
import { LearnMoreSheet, LearnMoreTrigger, SheetSection, SheetDecisionCard, useLearnMore } from "@/components/shared/learn-more-sheet";
import { Target, Gauge, Clock as ClockIcon, Info } from "lucide-react";
import { FrequencyCapCard } from "@/components/shared/frequency-cap-card";
import type { FrequencyPreset } from "@/components/shared/frequency-cap-card";

/* ================================================================== */
/*  Static config                                                     */
/* ================================================================== */

const ALL_OPTIMIZATION_GOALS: {
  value: OptimizationGoal;
  label: string;
  desc: string;
  icon: React.ReactNode;
  recommended?: Record<string, boolean>;
  requiresPixel?: boolean;
  requiresMMP?: boolean;
  bestFor?: string;
  costHint?: string;
  }[] = [
  {
    value: "PIXEL_PAGE_VIEW",
    label: "Page Views",
    desc: "Drive visitors to your store. Best starting point.",
    icon: <Eye className="size-4" />,
    recommended: { SALES: true },
    requiresPixel: true,
    bestFor: "New stores and new pixels — builds data for advanced goals",
    costHint: "Lowest cost, broadest reach",
  },
  {
    value: "PIXEL_ADD_TO_CART",
    label: "Add to Cart",
    desc: "Target shoppers likely to add products to their cart.",
    icon: <TrendingUp className="size-4" />,
    requiresPixel: true,
    bestFor: "Stores with 50+ daily page views on their pixel",
    costHint: "Moderate cost per action",
  },
  {
    value: "PIXEL_PURCHASE",
    label: "Purchases",
    desc: "Optimized for people most likely to buy.",
    icon: <ShoppingCart className="size-4" />,
    requiresPixel: true,
    bestFor: "Stores with established pixel data and 10+ weekly purchases",
    costHint: "Higher cost per action, highest return",
  },
  {
    value: "SWIPES",
    label: "Swipe Ups",
    desc: "Maximize clicks to your website. No pixel required.",
    icon: <MousePointerClick className="size-4" />,
    recommended: { WEBSITE_VISITS: true },
    costHint: "Lowest cost per action",
  },
  {
    value: "LANDING_PAGE_VIEW",
    label: "Landing Page Views",
    desc: "Higher quality traffic — visitors who fully load your page.",
    icon: <FileText className="size-4" />,
    requiresPixel: true,
    costHint: "Moderate cost, higher quality",
  },
  {
    value: "IMPRESSIONS",
    label: "Impressions",
    desc: "Show your ad to the maximum number of people.",
    icon: <Eye className="size-4" />,
    recommended: { ENGAGEMENT: true, SPONSORED_CHAT: true },
    costHint: "Lowest cost per 1,000 views",
  },
  {
    value: "STORY_OPENS",
    label: "Story Opens",
    desc: "More people open and watch your Story Ad.",
    icon: <Eye className="size-4" />,
    costHint: "Low cost per open",
  },
  {
    value: "VIDEO_VIEWS",
    label: "Video Views (2s)",
    desc: "Maximize people who watch at least 2s of your video.",
    icon: <Eye className="size-4" />,
    costHint: "Low cost per view",
  },
  {
    value: "VIDEO_VIEWS_15_SEC",
    label: "Video Views (15s)",
    desc: "Reach viewers who watch at least 15 seconds.",
    icon: <Eye className="size-4" />,
    costHint: "Higher cost, more engaged viewers",
  },
  {
    value: "USES",
    label: "Lens/Filter Uses",
    desc: "More people use your branded AR Lens or Filter.",
    icon: <Sparkles className="size-4" />,
  },
  {
    value: "LEAD_FORM_SUBMISSIONS",
    label: "Form Submissions",
    desc: "Collect leads through Snapchat's native lead form.",
    icon: <FileText className="size-4" />,
    recommended: { LEADS: true },
    costHint: "Cost per lead varies by form length",
  },
  {
    value: "APP_INSTALLS",
    label: "App Installs",
    desc: "Drive the most app downloads for your budget.",
    icon: <Download className="size-4" />,
    recommended: { APP_PROMOTION: true },
    costHint: "Moderate cost per install",
  },
  {
    value: "APP_PURCHASE",
    label: "In-App Purchases",
    desc: "Optimize for users most likely to make a purchase inside your app.",
    icon: <ShoppingCart className="size-4" />,
    requiresMMP: true,
    costHint: "High cost, highest return",
  },
  {
    value: "APP_SIGNUP",
    label: "In-App Sign Ups",
    desc: "Drive registrations within your app.",
    icon: <FileText className="size-4" />,
    requiresMMP: true,
  },
  {
    value: "APP_ADD_TO_CART",
    label: "In-App Add to Cart",
    desc: "Drive add-to-cart actions within your app.",
    icon: <TrendingUp className="size-4" />,
    requiresMMP: true,
  },
  // APP_REENGAGE_OPEN removed from UI: requires MMP + app_install_state targeting.
  // Will be added back when MMP integration is available.
];


/**
 * Valid Snap API `conversion_window` values (per Ad Squads documentation):
 *  - SWIPE_28DAY_VIEW_1DAY (default) — always available, no eligibility check
 *  - SWIPE_7DAY — requires pixel eligibility (event quality + conversion volume)
 *
 * The eligibility endpoint (/v1/pixels/{pixel_id}/campaign_eligibilities) returns
 * ELIGIBLE, ELIGIBLE_WARNING, or INELIGIBLE for each goal + window combination.
 * Since Sept 2025, Snap enforces this at Ad Squad creation time.
 */
const CONVERSION_WINDOWS: {
  value: ConversionWindow;
  label: string;
  clickWindow: string;
  viewWindow: string;
  desc: string;
  recommended?: boolean;
  requiresEligibility?: boolean;
}[] = [
  {
    value: "SWIPE_28DAY_VIEW_1DAY",
    label: "28-Day Click + 1-Day View",
    clickWindow: "28 days",
    viewWindow: "1 day",
    desc: "Captures conversions within 28 days of a click or 1 day of a view. Gives Snap the strongest optimization signal.",
    recommended: true,
  },
  {
    value: "SWIPE_7DAY",
    label: "7-Day Click Only",
    clickWindow: "7 days",
    viewWindow: "None",
    desc: "Stricter window — only credits conversions within 7 days of a click. Requires sufficient pixel data.",
    requiresEligibility: true,
  },
];


const BID_STRATEGIES: {
  value: BidStrategy;
  label: string;
  desc: string;
  bestFor?: string;
  recommended?: boolean;
}[] = [
  {
    value: "AUTO_BID",
    label: "Auto Bid",
    desc: "Snapchat automatically sets your bid for the most results. No manual input needed.",
    recommended: true,
  },
  {
    value: "LOWEST_COST_WITH_MAX_BID",
    label: "Max Bid",
    desc: "Set a cap — Snapchat won't exceed your limit per result.",
  },
  {
    value: "TARGET_COST",
    label: "Target Cost",
    desc: "Set your ideal cost per result. Snapchat averages around this amount.",
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

export function StepBudget() {
  const { campaign, setStep, updateNested } = useCampaign();
  const budget = campaign.budget;
  const objectiveConfig = OBJECTIVE_CONFIGS[campaign.objective.objective];

  /* Filter goals based on selected objective + conversion location */
  const locationGoals = getGoalsForLocation(
    campaign.objective.objective,
    campaign.objective.conversionLocation
  );
  const OPTIMIZATION_GOALS = ALL_OPTIMIZATION_GOALS.filter((g) =>
    locationGoals.includes(g.value)
  );

  /**
   * ACCELERATED pacing is only available when the selected optimization_goal is in the
   * Snap API-allowed list. Goals like pixel events, app events, and lead forms are
   * incompatible with ACCELERATED pacing per the Snap Marketing API spec.
   */
  const canUseAccelerated = ACCELERATED_COMPATIBLE_GOALS.includes(budget.optimizationGoal);
  const hasMMP = false; /* TODO: wire when MMP integration exists */
  const pixelMode = campaign.objective.pixelMode;
  const hasPixelConfigured = pixelMode === "salla_managed" || (pixelMode === "existing" && !!campaign.objective.pixelId);
  const pixelEligibleFor7Day = hasPixelConfigured && pixelMode === "salla_managed";

  const goalsWithLocked = OPTIMIZATION_GOALS.map((g) => ({
    value: g.value,
    label: g.label,
    desc: g.desc,
    icon: g.icon,
    recommended: !!g.recommended?.[campaign.objective.objective],
    requiresPixel: g.requiresPixel,
    requiresMMP: g.requiresMMP,
    bestFor: g.bestFor,
    costHint: g.costHint,
    locked: !!(g.requiresMMP && !hasMMP) || !!(g.requiresPixel && !hasPixelConfigured),
  }));
  /* If the currently selected goal is now locked (e.g. pixel removed), fall back to the first unlocked goal */
  useEffect(() => {
    const currentGoalEntry = goalsWithLocked.find((g) => g.value === budget.optimizationGoal);
    if (currentGoalEntry?.locked) {
      const firstUnlocked = goalsWithLocked.find((g) => !g.locked);
      if (firstUnlocked) {
        updateNested("budget", { optimizationGoal: firstUnlocked.value as OptimizationGoal });
      }
    }
  }, [hasPixelConfigured, hasMMP]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (budget.conversionWindow === "SWIPE_7DAY" && !pixelEligibleFor7Day) {
      updateNested("budget", { conversionWindow: "SWIPE_28DAY_VIEW_1DAY" as ConversionWindow });
    }
  }, [pixelEligibleFor7Day]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Filter bid strategies by objective allowlist AND goal compatibility.
   * TARGET_COST is only valid for specific goals (see TARGET_COST_COMPATIBLE_GOALS).
   * This prevents API rejections like LEADS + LEAD_FORM_SUBMISSIONS + TARGET_COST.
   */
  const FILTERED_BID_STRATEGIES = BID_STRATEGIES.filter((s) => {
    if (!objectiveConfig.allowedBidStrategies.includes(s.value)) return false;
    if (s.value === "TARGET_COST" && !TARGET_COST_COMPATIBLE_GOALS.includes(budget.optimizationGoal)) return false;
    return true;
  });

  /* Auto-increase reads from persisted campaign context (fallback for old drafts missing the field) */
  const autoIncrease = budget.autoIncrease ?? {
    enabled: false,
    pct: 20,
    intervalDays: 7,
    maxDailyBudget: budget.amount * 3,
  };

  /* Learn More sliders */
  const goalLearnMore = useLearnMore();
  const bidLearnMore = useLearnMore();
  const attributionLearnMore = useLearnMore();

  /* Local UI state */
  const [showAdvanced, setShowAdvanced] = useState(
    budget.pacingType !== "STANDARD" || budget.frequencyCapEnabled || budget.schedule === "custom"
  );

  /* End date is required for Prepaid (needs a finite duration) */
  const endDateRequired = budget.paymentMethod === "prepaid";

  /* Whether auto-increase is available (only daily budget with a set end date) */
  const autoIncreaseAvailable = !budget.endDateOptional;

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

  const dailyAmount = budget.amount;

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
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Minimum" },
    { min: Math.round(200 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(350 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(500 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(800 * goalMultiplier), pct: 100, color: "bg-primary", textColor: "text-primary", label: "Strong" },
  ];
  const currentTier = [...strengthTiers]
    .reverse()
    .find((t) => dailyAmount >= t.min)!;

  /* Goal label — covers all optimization goals across every objective */
  const goalLabelMap: Record<string, string> = {
    PIXEL_PURCHASE: "purchases",
    PIXEL_ADD_TO_CART: "add to carts",
    PIXEL_PAGE_VIEW: "page views",
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

  const goalNameMap: Record<string, string> = {
    PIXEL_PURCHASE: "Purchase",
    PIXEL_ADD_TO_CART: "Add to Cart",
    PIXEL_PAGE_VIEW: "Page View",
    SWIPES: "Swipe Up",
    LANDING_PAGE_VIEW: "Landing Page View",
    IMPRESSIONS: "1k Impressions",
    STORY_OPENS: "Story Open",
    VIDEO_VIEWS: "Video View",
    VIDEO_VIEWS_15_SEC: "15s Video View",
    USES: "Lens Use",
    LEAD_FORM_SUBMISSIONS: "Form Submission",
    APP_INSTALLS: "App Install",
    APP_PURCHASE: "In-App Purchase",
    APP_SIGNUP: "In-App Sign Up",
    APP_ADD_TO_CART: "In-App Add to Cart",
    APP_REENGAGE_OPEN: "App Re-open",
  };
  const goalName = goalNameMap[budget.optimizationGoal] ?? "Action";

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
  const totalBudgetBase = budget.amount * durationDays;
  const totalBudget = (autoIncrease.enabled && autoIncreaseAvailable) ? projectedTotalSpend : totalBudgetBase;
  const totalWithBoost = totalBudget + (budget.performanceBoost ? 299 : 0);

  const budgetNavDisabled =
    budget.amount < 150 ||
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
          {/* SECTION 1: Optimization Goal                             */}
          {/* ======================================================= */}
          <OptimizationGoalCard
            goals={goalsWithLocked}
            selectedGoal={budget.optimizationGoal}
            onGoalChange={(v) => {
              const newGoal = v as OptimizationGoal;
              // When the new goal is incompatible with ACCELERATED pacing, revert to STANDARD
              const isNewGoalAcceleratedCompatible = ACCELERATED_COMPATIBLE_GOALS.includes(newGoal);
              // When switching to a goal that doesn't support TARGET_COST, revert to AUTO_BID
              const isTargetCostCompatible = TARGET_COST_COMPATIBLE_GOALS.includes(newGoal);
              updateNested("budget", {
                optimizationGoal: newGoal,
                ...(!isNewGoalAcceleratedCompatible && budget.pacingType === "ACCELERATED"
                  ? { pacingType: "STANDARD" }
                  : {}),
                ...(!isTargetCostCompatible && budget.bidStrategy === "TARGET_COST"
                  ? { bidStrategy: "AUTO_BID" as BidStrategy }
                  : {}),
              });
            }}
            layout="grid"
            infoTipText="Choose what action you want to optimize for. This determines how your budget is spent."
            learnMoreTrigger={<LearnMoreTrigger {...goalLearnMore.triggerProps} />}
            pixelReadiness={
              !hasPixelConfigured ? "none"
              : pixelMode === "salla_managed" ? "new"
              : "established"
            }
            warnings={
              <>
                {/* Only show the pixel warning when goals in this objective actually need a pixel and no pixel is configured. */}
                {OPTIMIZATION_GOALS.some((g) => g.requiresPixel) && !hasPixelConfigured && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      Some goals need a <span className="font-semibold">Snap Pixel</span>. Connect one in Step 1 to unlock them.
                    </p>
                  </div>
                )}
                {/* Only show the MMP warning when goals in this objective actually need MMP (APP_PROMOTION only). */}
                {OPTIMIZATION_GOALS.some((g) => g.requiresMMP) && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                    <Lock className="size-3.5 shrink-0 text-orange-600" />
                    <p className="text-xs text-orange-700">
                      In-app event goals need an <span className="font-semibold">MMP</span> integration (not yet supported).
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
            onStrategyChange={(v) => {
              const newStrategy = v as BidStrategy;
              const updates: Record<string, unknown> = { bidStrategy: newStrategy };
              if (newStrategy !== "AUTO_BID" && (!budget.bidAmount || budget.bidAmount <= 0)) {
                updates.bidAmount = Math.round(((suggestedBid.min + suggestedBid.max) / 2) * 100) / 100;
              }
              // Snap API: ACCELERATED pacing requires LOWEST_COST_WITH_MAX_BID + bid_micro.
              // If switching away from that strategy while ACCELERATED is active, revert to STANDARD.
              if (budget.pacingType === "ACCELERATED" && newStrategy !== "LOWEST_COST_WITH_MAX_BID") {
                updates.pacingType = "STANDARD";
              }
              updateNested("budget", updates);
            }}
            layout="buttons"
            infoTipText="Choose how your budget competes for ad placements. Auto Bid is recommended for most advertisers."
            learnMoreTrigger={<LearnMoreTrigger {...bidLearnMore.triggerProps} />}
            bidInputs={
              budget.bidStrategy !== "AUTO_BID"
                ? [{
                    label: budget.bidStrategy === "TARGET_COST" ? "Target Cost per Action" : "Maximum Bid per Action",
                    desc: budget.bidStrategy === "TARGET_COST"
                      ? "Snap will average around this amount per result."
                      : "Snap will never bid above this amount per result.",
                    value: budget.bidAmount || undefined,
                    onChange: (v) => updateNested("budget", { bidAmount: v }),
                    prefix: "SAR",
                    suffix: `per ${goalLabel.replace(/s$/, "")}`,
                    min: 0.01,
                    step: 0.5,
                    suggestedRange: suggestedBid,
                    // Priority-ordered: bid > budget (critical) → bid < min (caution) → in range (ok)
                    warning: budget.bidAmount > 0 && budget.bidAmount > budget.amount
                      ? `Bid exceeds your daily budget of SAR ${budget.amount}. Lower your bid or raise your budget.`
                      : budget.bidAmount > 0 && budget.bidAmount < suggestedBid.min
                        ? `Below suggested range (SAR ${suggestedBid.min.toFixed(2)}+). You may get few or no results.`
                        : undefined,
                    tip: budget.bidAmount >= suggestedBid.min && budget.bidAmount <= suggestedBid.max && budget.bidAmount <= budget.amount
                      ? "Bid is within the suggested range."
                      : undefined,
                  }]
                : undefined
            }
          />

          {/* ======================================================= */}
          {/* SECTION 3: Budget, Duration & Payment (shared card)      */}
          {/* ======================================================= */}
          <BudgetDurationCard
            budgetTypes={BUDGET_TYPES}
            paymentMethod={budget.paymentMethod}
            onPaymentMethodChange={(v) => updateNested("budget", { paymentMethod: v })}
            showLifetimeToggle={false}
            budgetMode="daily"
            amount={budget.amount}
            onAmountChange={(v) => updateNested("budget", { amount: v })}
            minAmount={150}
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
            showSmartStart={true}
          />

          {/* ======================================================= */}
          {/* SECTION 4: Performance Boost (Salla Upsell)              */}
          {/* ======================================================= */}
          <PerformanceBoostCard
            enabled={budget.performanceBoost}
            onToggle={(checked) => updateNested("budget", { performanceBoost: checked })}
          />

          {/* ======================================================= */}
          {/* SECTION 5: ADVANCED SETTINGS (Collapsible)               */}
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
                  <p className="mt-1 text-xs text-muted-foreground">Attribution Window, Frequency Cap</p>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className={cn("flex flex-col gap-4 rounded-b-2xl px-2 pb-2", showAdvanced && "bg-muted/50")}>

              {/* -- Attribution Window (shared component) -- */}
              {(objectiveConfig.hasConversionWindow || budget.optimizationGoal.startsWith("PIXEL_")) && (
                <AttributionWindowCard
                  mode="combined"
                  combinedOptions={CONVERSION_WINDOWS.map((w) => ({
                    value: w.value,
                    label: w.label,
                    clickWindow: w.clickWindow,
                    viewWindow: w.viewWindow,
                    recommended: w.recommended,
                    requiresEligibility: w.requiresEligibility,
                  }))}
                  combinedValue={budget.conversionWindow}
                  onCombinedChange={(v) => updateNested("budget", { conversionWindow: v as ConversionWindow })}
                  tip="Wider windows capture more conversions. Purchases often happen days after the first ad."
                  learnMoreTrigger={<LearnMoreTrigger {...attributionLearnMore.triggerProps} />}
                />
              )}

              {/* -- Delivery Pacing -- */}
              {/* Only show when ACCELERATED is actually available (awareness/engagement goals).
                  For SALES (all pixel goals), only STANDARD is valid — no need to show a single-option card. */}
              {canUseAccelerated && (
              <DeliveryPacingCard
                layout="buttons"
                options={[
                  { value: "STANDARD", label: "Standard", desc: "Even spend throughout the day." },
                  { value: "ACCELERATED" as const, label: "Accelerated", desc: "Spend budget as fast as possible. Requires Max Bid." },
                ]}
                selectedPacing={budget.pacingType}
                onPacingChange={(v) => {
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
              )}

              {/* -- Frequency Capping (Snapchat API: ad_squad.cap_and_exclusion_config.frequency_cap_config) -- */}
              {/* Snap API supports frequency cap for ALL optimization goals.
                  Only restriction: incompatible with multi-format delivery (different ad types in same ad squad). */}
                <FrequencyCapCard
                  enabled={budget.frequencyCapEnabled}
                  onEnabledChange={(checked) => {
                    if (checked && (!budget.frequencyCapCount || budget.frequencyCapInterval < 24)) {
                      updateNested("budget", { frequencyCapEnabled: true, frequencyCapCount: 4, frequencyCapInterval: 168 });
                    } else {
                      updateNested("budget", { frequencyCapEnabled: checked });
                    }
                  }}
                  maxImpressions={budget.frequencyCapCount}
                  onMaxImpressionsChange={(v) => updateNested("budget", { frequencyCapCount: v })}
                  timeWindowValue={String(budget.frequencyCapInterval)}
                  timeWindowOptions={[
                    { value: "72", label: "3 days" },
                    { value: "168", label: "7 days" },
                  ]}
                  onTimeWindowChange={(v) => updateNested("budget", { frequencyCapInterval: Number(v) })}
                  timeWindowSummaryLabel={budget.frequencyCapInterval === 24 ? "day" : `${budget.frequencyCapInterval / 24} days`}
                  accent="primary"
                  infoTipText="Limit how many times one person sees your ad. Prevents fatigue and improves efficiency."
                  showFormatWarning
                  presets={[
                    { id: "conservative", count: 2, timeWindowValue: "168", timeWindowLabel: "7 days", hint: "Less fatigue" },
                    { id: "balanced", count: 4, timeWindowValue: "168", timeWindowLabel: "7 days", hint: "Recommended", recommended: true },
                    { id: "moderate", count: 3, timeWindowValue: "72", timeWindowLabel: "3 days", hint: "Promotions" },
                    { id: "aggressive", count: 6, timeWindowValue: "168", timeWindowLabel: "7 days", hint: "Flash sales" },
                  ]}
                  onPresetSelect={(count, tw) =>
                    updateNested("budget", { frequencyCapCount: count, frequencyCapInterval: Number(tw) })
                  }
                >
                  {/* Mixed formats error — shows when actually mixed */}
                  {campaign.creative.ads.length > 1 && new Set(campaign.creative.ads.map((a) => a.adFormat ?? "SINGLE")).size > 1 && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                      <p className="text-[11px] leading-relaxed text-red-700">
                        Your ads currently use mixed formats. Fix in <span className="font-semibold">Ad Design</span> or disable frequency cap.
                      </p>
                    </div>
                  )}
                </FrequencyCapCard>


            </CollapsibleContent>
          </Collapsible>

        </div>

        {/* ============= RIGHT COLUMN ============= */}
        <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-4">

            {/* Card A: Cost Summary (shared) */}
            <CostSummaryCard
              budgetLabel={budget.type === "lifetime" ? "Lifetime budget" : "Daily budget"}
              budgetAmount={dailyAmount}
              durationDays={durationDays}
              isOngoing={budget.endDateOptional}
              totalBudget={totalBudget}
              autoIncreaseEnabled={autoIncrease.enabled}
              autoIncreaseMode={autoIncrease.mode}
              paymentMethod={budget.paymentMethod}
              boostEnabled={budget.performanceBoost}
              boostAmount={299}
              startDate={budget.startDate}
              endDate={budget.endDate}
            />

            {/* Card B: Estimated Results (shared) */}
            <EstimatedResultsCard
              badge="Estimate"
              rows={
                budget.optimizationGoal.startsWith("PIXEL_") ? [
                  { label: `Daily ${goalLabel}`, value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                  { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ] : budget.optimizationGoal === "IMPRESSIONS" || budget.optimizationGoal === "STORY_OPENS" ? [
                  { label: "Daily impressions", value: `${fmt(Math.round(dailyAmount / suggestedBid.min * 1000))} - ${fmt(Math.round(dailyAmount / suggestedBid.max * 1000 * 3))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 60)} - ${fmt(dailyAmount * 200)}` },
                  { label: "Est. CPM", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ] : budget.optimizationGoal === "SWIPES" || budget.optimizationGoal === "LANDING_PAGE_VIEW" ? [
                  { label: `Daily ${budget.optimizationGoal === "LANDING_PAGE_VIEW" ? "page views" : "swipe-ups"}`, value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 30)} - ${fmt(dailyAmount * 100)}` },
                  { label: "Est. cost per swipe", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ] : budget.optimizationGoal === "VIDEO_VIEWS" || budget.optimizationGoal === "VIDEO_VIEWS_15_SEC" ? [
                  { label: `Daily ${budget.optimizationGoal === "VIDEO_VIEWS_15_SEC" ? "15s views" : "video views"}`, value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 50)} - ${fmt(dailyAmount * 150)}` },
                  { label: "Est. CPV", value: `SAR ${suggestedBid.min.toFixed(3)} - ${suggestedBid.max.toFixed(3)}` },
                ] : budget.optimizationGoal === "APP_INSTALLS" ? [
                  { label: "Daily installs", value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 30)} - ${fmt(dailyAmount * 80)}` },
                  { label: "Est. cost per install", value: `SAR ${suggestedBid.min.toFixed(0)} - ${suggestedBid.max.toFixed(0)}` },
                ] : budget.optimizationGoal === "LEAD_FORM_SUBMISSIONS" ? [
                  { label: "Daily leads", value: `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 20)} - ${fmt(dailyAmount * 60)}` },
                  { label: "Est. cost per lead", value: `SAR ${suggestedBid.min.toFixed(0)} - ${suggestedBid.max.toFixed(0)}` },
                ] : [
                  { label: `Daily ${goalLabel}`, value: `${fmt(Math.round(dailyAmount * 0.8))} - ${fmt(Math.round(dailyAmount * 2.5))}` },
                  { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                  { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
                ]
              }
              disclaimer="Based on similar campaigns. Actual results vary."
            />

            {/* Card C: Configuration Check (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Budget type", value: budget.type === "lifetime" ? "Lifetime" : "Daily" },
                { label: "Payment", value: budget.paymentMethod === "prepaid" ? "Prepaid" : "Pay as You Go" },
                { label: "End date", value: budget.endDateOptional ? "Ongoing" : budget.endDate ? new Date(budget.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not set" },
                { label: "Goal", value: goalLabel.charAt(0).toUpperCase() + goalLabel.slice(1) },
                { label: "Bid", value: budget.bidStrategy === "AUTO_BID" ? "Auto Bid" : `${budget.bidStrategy === "TARGET_COST" ? "Target Cost" : "Max Bid"}: SAR ${budget.bidAmount}` },
                ...(autoIncrease.enabled ? [{ label: "Auto-increase", value: autoIncrease.mode === "performance" ? "By ROAS" : `+${autoIncrease.pct}% / ${autoIncrease.intervalDays}d` }] : []),
                ...(objectiveConfig.hasConversionWindow ? [{ label: "Attribution", value: CONVERSION_WINDOWS.find((w) => w.value === budget.conversionWindow)?.label ?? "Set" }] : []),
                ...(budget.frequencyCapEnabled ? [{ label: "Frequency cap", value: `${budget.frequencyCapCount}× / ${Math.round(budget.frequencyCapInterval / 24)} days` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: (budget.amount >= 150 ? "ok" : "error") as "ok" | "warning" | "error", text: budget.amount >= 150 ? `SAR ${budget.amount}/day — meets minimum` : "Below SAR 150/day minimum" },
                { label: "Duration", status: ((durationDays >= 7 || budget.endDateOptional) ? "ok" : "warning") as "ok" | "warning" | "error", text: (durationDays >= 7 || budget.endDateOptional) ? `${budget.endDateOptional ? "Ongoing" : `${durationDays} days`} — sufficient for optimization` : `${durationDays} days — below 7-day minimum` },
                { label: "Bid strategy", status: (() => {
                  if (budget.bidStrategy === "AUTO_BID") return "ok" as const;
                  if (!budget.bidAmount || budget.bidAmount <= 0) return "error" as const;
                  return "ok" as const;
                })(), text: budget.bidStrategy === "AUTO_BID" ? "Auto-optimized by Snapchat" : `SAR ${budget.bidAmount?.toFixed(2) ?? "0"} per ${goalLabel.replace(/s$/, "")}` },
                { label: "Billing", status: "ok" as const, text: "Impression-based (CPM)" },
                ...(budget.frequencyCapEnabled && campaign.creative.ads.length > 1 && new Set(campaign.creative.ads.map((a) => a.adFormat ?? "SINGLE")).size > 1
                  ? [{ label: "Frequency cap", status: "error" as const, text: "Mixed ad formats — unify or disable cap" }]
                  : []),
              ]}
              tips={[
                ...(!budget.endDateOptional ? [{ text: "Ongoing campaigns perform up to 40% better. Switch to Ongoing for the best results." }] : []),
                ...(budget.amount < (suggestedDaily ?? 400) ? [{ text: `Increasing your budget to SAR ${suggestedDaily ?? 400}/day could significantly improve delivery and reach.` }] : []),
              ]}
            />

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(1)}
        onNext={() => setStep(3)}
        previousLabel="Previous"
        nextLabel="Next"
        nextDisabled={budgetNavDisabled}
        accent="primary"
      />
      {/* ---- Learn More: Optimization Goal ---- */}
      <LearnMoreSheet
        open={goalLearnMore.open}
        onOpenChange={goalLearnMore.setOpen}
        title="Optimization Goal"
        description="This tells Snapchat what action you want from users. Snapchat will show your ad to people most likely to take that action."
        icon={<Target className="size-4" />}
        proTip={
          campaign.objective.objective === "SALES"
            ? "Start with Page Views if your pixel is new (less than 2 weeks old). Move to Add to Cart after 50+ daily page views, then to Purchases after 10+ weekly purchases."
            : campaign.objective.objective === "WEBSITE_VISITS"
              ? "Swipe Ups gives you the most clicks at the lowest cost. Use Landing Page Views for higher-quality visitors who actually load your page."
              : campaign.objective.objective === "LEADS"
                ? "Form Submissions is best for collecting leads directly. Use Swipe Ups only if you want to drive traffic to your own website form."
                : campaign.objective.objective === "ENGAGEMENT"
                  ? "Impressions gets you maximum reach. Use Video Views if your creative is video — it finds people who actually watch."
                  : campaign.objective.objective === "APP_PROMOTION"
                    ? "App Installs drives the most downloads. In-app event goals (Purchases, Sign Ups) require an MMP integration."
                    : "Use the recommended goal (highlighted) and give your campaign at least 3-5 days before changing it."
        }
      >
        <SheetSection icon={<Target className="size-4" />} title="Available goals">
          <div className="flex flex-col gap-2">
            {goalsWithLocked.filter((g) => !g.locked).map((g) => (
              <SheetDecisionCard
                key={g.value}
                title={g.label}
                description={g.desc}
                highlighted={g.recommended}
              />
            ))}
          </div>
        </SheetSection>
        <SheetSection icon={<Info className="size-4" />} title="How does this affect my campaign?">
          <div className="text-xs leading-relaxed text-muted-foreground">
            <p className="mb-2">Your goal changes <span className="font-medium text-foreground">who sees your ad</span>. For example:</p>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p><span className="font-medium text-foreground">Purchases</span> — Snapchat finds people with a history of buying online</p>
              <p><span className="font-medium text-foreground">Impressions</span> — Snapchat shows your ad to as many people as possible</p>
              <p><span className="font-medium text-foreground">Swipe Ups</span> — Snapchat targets people who regularly swipe up on ads</p>
            </div>
            <p className="mt-2">The more specific your goal, the smaller but higher-quality your audience will be.</p>
          </div>
        </SheetSection>
        {OPTIMIZATION_GOALS.some((g) => g.requiresPixel) && (
          <SheetSection icon={<Lock className="size-4" />} title="Why are some goals locked?">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Goals like Purchases, Add to Cart, and Page Views require a <span className="font-medium text-foreground">Snap Pixel</span> — a small tracking code on your website. Without it, Snapchat can&apos;t see what visitors do after clicking your ad. Go to the Objective step to connect your pixel.
            </p>
          </SheetSection>
        )}
      </LearnMoreSheet>

      {/* ---- Learn More: Bid Strategy ---- */}
      <LearnMoreSheet
        open={bidLearnMore.open}
        onOpenChange={bidLearnMore.setOpen}
        title="Bidding Strategy"
        description="When your ad competes for a placement, Snapchat uses your bid strategy to decide how much to pay. This affects how many people see your ad and what each result costs."
        icon={<Gauge className="size-4" />}
        proTip="Start with Auto Bid for your first campaign. After 7 days, check your cost per result — if it's too high, try Max Bid with a cap 10-20% above your average."
      >
        <SheetSection icon={<Gauge className="size-4" />} title="Which strategy is right for me?">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Auto Bid"
              description="Snapchat handles everything — it bids the right amount to get you the most results within your budget. No setup needed. Best for beginners."
              highlighted
            />
            <SheetDecisionCard
              title="Max Bid"
              description="You set the maximum you're willing to pay per result. Snapchat will never go above your limit. Use this when you know your target cost — but set it too low and your ads won't show."
            />
            {objectiveConfig.allowedBidStrategies.includes("TARGET_COST") && (
              <SheetDecisionCard
                title="Target Cost"
                description="You set your ideal cost and Snapchat tries to stay close to it on average. Some results may cost more, others less. Good when you need predictable costs for budgeting."
              />
            )}
          </div>
        </SheetSection>
        <SheetSection icon={<Info className="size-4" />} title="How does the auction work?">
          <div className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
            <p>Every time there&apos;s a chance to show an ad, Snapchat runs a quick auction:</p>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[10px] font-bold text-white">1</span>
                  <p><span className="font-medium text-foreground">Your bid enters</span> — based on your strategy and budget</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[10px] font-bold text-white">2</span>
                  <p><span className="font-medium text-foreground">Snapchat scores ads</span> — combines bid amount with ad quality and relevance</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#004956] text-[10px] font-bold text-white">3</span>
                  <p><span className="font-medium text-foreground">Best ad wins</span> — you only pay what&apos;s needed to beat the next competitor</p>
                </div>
              </div>
            </div>
          </div>
        </SheetSection>
        <SheetSection icon={<Eye className="size-4" />} title="Things to watch out for">
          <div className="flex flex-col gap-2 text-xs">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              <p className="font-medium">Bid too low?</p>
              <p>Your ads won&apos;t win any auctions and you&apos;ll get zero results. Always check the suggested bid range.</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">
              <p className="font-medium">Bid much higher than suggested?</p>
              <p>You&apos;ll win more auctions but pay more per result. Start within the range and adjust gradually.</p>
            </div>
          </div>
        </SheetSection>
      </LearnMoreSheet>

      {/* ---- Learn More: Attribution Window ---- */}
      <LearnMoreSheet
        open={attributionLearnMore.open}
        onOpenChange={attributionLearnMore.setOpen}
        title="Conversion Window"
        description="How long after seeing or clicking your ad should a purchase still count as a result? This setting controls that timeframe."
        icon={<ClockIcon className="size-4" />}
        proTip="Always start with 28-day. It gives Snapchat the most data to learn who your best customers are. Only switch to 7-day after you're getting 50+ conversions per week."
      >
        <SheetSection icon={<ClockIcon className="size-4" />} title="Simple example">
          <div className="text-xs leading-relaxed text-muted-foreground">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="mb-2 font-medium text-foreground">A customer sees your ad on Saturday...</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base">👀</span>
                  <p>Visits your store on Tuesday</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base">🛒</span>
                  <p>Adds a product to cart on Wednesday</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base">💳</span>
                  <p>Buys it on Friday (6 days later)</p>
                </div>
              </div>
              <div className="mt-3 border-t border-border pt-2 space-y-1">
                <p><span className="font-medium text-foreground">28-day window:</span> This purchase counts as a result of your ad</p>
                <p><span className="font-medium text-foreground">7-day window:</span> Also counts (it was within 7 days)</p>
              </div>
              <p className="mt-2 text-muted-foreground">If they bought 10 days later, only the 28-day window would count it.</p>
            </div>
          </div>
        </SheetSection>
        <SheetSection icon={<Target className="size-4" />} title="Which should I choose?">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="28-Day Click + 1-Day View"
              description="Counts purchases up to 28 days after a click, and 1 day after viewing your ad. Captures more conversions and gives Snapchat more data to optimize. Best for most stores."
              highlighted
            />
            <SheetDecisionCard
              title="7-Day Click Only"
              description="Only counts purchases within 7 days of clicking your ad. Stricter measurement, but needs a mature pixel with lots of conversion data to work well."
            />
          </div>
        </SheetSection>
      </LearnMoreSheet>
    </TooltipProvider>
  );
}
