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
  ShieldCheck,
  Users,
  Clock,
} from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
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
  requiresPixel?: boolean;
  requiresMMP?: boolean;
  bestFor?: string;
  costHint?: string;
  }[] = [
  {
    value: "PIXEL_PURCHASE",
    label: "Purchases",
    desc: "Snap optimizes delivery to people most likely to buy from your store.",
    icon: <ShoppingCart className="size-4" />,
    recommended: { SALES: true },
    requiresPixel: true,
    bestFor: "Best for: maximizing revenue and ROAS from your ad spend",
    costHint: "Higher cost per action, highest return",
  },
  {
    value: "PIXEL_ADD_TO_CART",
    label: "Add to Cart",
    desc: "Reach shoppers who are likely to add products to their cart — a strong purchase intent signal.",
    icon: <TrendingUp className="size-4" />,
    requiresPixel: true,
    bestFor: "Best for: building a retargeting pool of high-intent shoppers",
    costHint: "Moderate cost per action",
  },
  {
    value: "PIXEL_PAGE_VIEW",
    label: "Page Views",
    desc: "Drive the most visitors to your store pages. Great for new stores building traffic.",
    icon: <Eye className="size-4" />,
    requiresPixel: true,
    bestFor: "Best for: new stores, product launches, or driving traffic to specific pages",
    costHint: "Lower cost per action, broader reach",
  },
  {
    value: "SWIPES",
    label: "Swipe Ups",
    desc: "Maximize clicks to your website. Doesn't require a pixel.",
    icon: <MousePointerClick className="size-4" />,
    recommended: { WEBSITE_VISITS: true },
    bestFor: "Best for: driving traffic when pixel is not yet installed",
    costHint: "Lowest cost per action",
  },
  {
    value: "LANDING_PAGE_VIEW",
    label: "Landing Page Views",
    desc: "Optimize for visitors who fully load your page — higher quality traffic than swipe-ups.",
    icon: <FileText className="size-4" />,
    requiresPixel: true,
    bestFor: "Best for: ensuring visitors actually see your content, not just click",
    costHint: "Moderate cost, higher quality",
  },
  {
    value: "IMPRESSIONS",
    label: "Impressions",
    desc: "Show your ad to as many people as possible. Best for brand awareness campaigns.",
    icon: <Eye className="size-4" />,
    recommended: { ENGAGEMENT: true, SPONSORED_CHAT: true },
    bestFor: "Best for: brand awareness, product launches, seasonal promotions",
    costHint: "Lowest cost per 1,000 views",
  },
  {
    value: "STORY_OPENS",
    label: "Story Opens",
    desc: "Get more people to open and watch your Story Ad in the Discover feed.",
    icon: <Eye className="size-4" />,
    bestFor: "Best for: Story Ads with multi-snap narratives",
    costHint: "Low cost per open",
  },
  {
    value: "VIDEO_VIEWS",
    label: "Video Views (2s)",
    desc: "Maximize the number of people who watch at least 2 seconds of your video.",
    icon: <Eye className="size-4" />,
    bestFor: "Best for: short-form video awareness",
    costHint: "Low cost per view",
  },
  {
    value: "VIDEO_VIEWS_15_SEC",
    label: "Video Views (15s)",
    desc: "Reach engaged viewers who watch at least 15 seconds — deeper engagement than 2s views.",
    icon: <Eye className="size-4" />,
    bestFor: "Best for: longer storytelling videos, product demos",
    costHint: "Higher cost, more engaged viewers",
  },
  {
    value: "USES",
    label: "Lens/Filter Uses",
    desc: "Get more people to use your branded AR Lens or Filter.",
    icon: <Sparkles className="size-4" />,
    bestFor: "Best for: interactive brand experiences",
  },
  {
    value: "LEAD_FORM_SUBMISSIONS",
    label: "Form Submissions",
    desc: "Collect leads directly through Snapchat's native lead form — no website needed.",
    icon: <FileText className="size-4" />,
    recommended: { LEADS: true },
    bestFor: "Best for: collecting customer info, pre-orders, waitlists",
    costHint: "Cost per lead varies by form length",
  },
  {
    value: "APP_INSTALLS",
    label: "App Installs",
    desc: "Drive the most app downloads for your budget.",
    icon: <Download className="size-4" />,
    recommended: { APP_PROMOTION: true },
    bestFor: "Best for: growing your app user base",
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
  {
    value: "APP_REENGAGE_OPEN",
    label: "Re-engage App Opens",
    desc: "Bring back existing users and encourage them to re-open your app.",
    icon: <Download className="size-4" />,
    requiresMMP: true,
  },
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
    desc: "Captures conversions within 28 days of a swipe-up or 1 day of viewing your ad. Gives Snap the most signal to optimize delivery.",
    recommended: true,
  },
  {
    value: "SWIPE_7DAY",
    label: "7-Day Click Only",
    clickWindow: "7 days",
    viewWindow: "None",
    desc: "Stricter window — only counts conversions within 7 days of a swipe-up. Requires your pixel to have sufficient event data.",
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
    desc: "Snapchat automatically sets your bid to get the most results within your budget. No manual input needed.",
    bestFor: "Best for most advertisers — especially if you're new to Snap Ads or want a hands-off approach.",
    recommended: true,
  },
  {
    value: "LOWEST_COST_WITH_MAX_BID",
    label: "Max Bid",
    desc: "Set a ceiling — Snapchat will try to get results as cheaply as possible but never bid above your maximum.",
    bestFor: "Best when you have a strict cost-per-result ceiling (e.g. max SAR 15 per purchase).",
  },
  {
    value: "TARGET_COST",
    label: "Target Cost",
    desc: "Set your ideal cost per result. Snapchat will try to average around this amount — some may cost more, some less.",
    bestFor: "Best for predictable unit economics — keeps your average CPA stable over time.",
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
          {/* SECTION 1: Budget, Duration & Payment (shared card)      */}
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
                {OPTIMIZATION_GOALS.some((g) => g.requiresPixel) && !hasPixelConfigured && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs leading-relaxed text-amber-700">
                      Some goals require a <span className="font-semibold">Snap Pixel</span>. Go back to the Objective step to connect your pixel and unlock all optimization goals.
                    </p>
                  </div>
                )}
                {OPTIMIZATION_GOALS.some((g) => g.requiresPixel) && hasPixelConfigured && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                    <p className="text-xs leading-relaxed text-emerald-700">
                      Snap Pixel is connected — all pixel-based goals are available.
                    </p>
                  </div>
                )}
                {OPTIMIZATION_GOALS.some((g) => g.requiresMMP) && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                    <Lock className="mt-0.5 size-3.5 shrink-0 text-orange-600" />
                    <p className="text-xs leading-relaxed text-orange-700">
                      In-app event goals require a <span className="font-semibold">Mobile Measurement Partner (MMP)</span> integration. Without an MMP, Snapchat cannot track post-install events.
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
              updateNested("budget", updates);
            }}
            layout="buttons"
            infoTipText="Choose how your budget competes for ad placements. Auto Bid is recommended for most advertisers."
            bidInputs={
              budget.bidStrategy !== "AUTO_BID"
                ? [{
                    label: budget.bidStrategy === "TARGET_COST" ? "Target Cost per Action" : "Maximum Bid per Action",
                    desc: budget.bidStrategy === "TARGET_COST"
                      ? "Snap will try to keep your average cost per result close to this amount."
                      : "Snap will never bid above this amount. Set it too low and you may not win any auctions.",
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
            contextNote={
              budget.bidStrategy !== "AUTO_BID" && budget.bidAmount > 0 && budget.bidAmount > budget.amount
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
                      canUseAccelerated && budget.pacingType !== "STANDARD",
                      budget.frequencyCapEnabled,
                    ].filter(Boolean).length} active
                  </Badge>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-5 pt-5">

              {/* -- Attribution Window -- */}
              {objectiveConfig.hasConversionWindow && (() => {
                const goalTip =
                  budget.optimizationGoal === "PIXEL_PURCHASE"
                    ? "Purchases often happen days after the first ad — use the wider window."
                    : budget.optimizationGoal === "PIXEL_ADD_TO_CART"
                      ? "Add-to-cart events can be delayed — the wider window captures more."
                      : undefined;
                return (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <Label className="text-sm font-semibold text-foreground">Attribution Window</Label>
                      <InfoTip text="How long after seeing or clicking your ad should a conversion count? A wider window gives Snap more data to optimize." />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {CONVERSION_WINDOWS.map((w) => {
                        const isLocked = !!w.requiresEligibility && !pixelEligibleFor7Day;
                        const isSelected = !isLocked && budget.conversionWindow === w.value;
                        return (
                          <button
                            key={w.value}
                            type="button"
                            disabled={isLocked}
                            onClick={() => { if (!isLocked) updateNested("budget", { conversionWindow: w.value as ConversionWindow }); }}
                            className={cn(
                              "relative flex flex-col rounded-xl border p-4 text-left transition-all",
                              isLocked
                                ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                                : isSelected
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-border bg-background hover:border-primary/40"
                            )}
                          >
                            {w.recommended && !isLocked && (
                              <span className="absolute -top-2 right-3 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                Recommended
                              </span>
                            )}
                            {isLocked && (
                              <span className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                <Lock className="size-2.5" /> Locked
                              </span>
                            )}

                            <span className={cn(
                              "text-sm font-semibold",
                              isLocked ? "text-muted-foreground" : isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {w.label}
                            </span>

                            {/* Visual breakdown */}
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1">
                                <MousePointerClick className={cn("size-3", isLocked ? "text-muted-foreground/40" : "text-muted-foreground")} />
                                <span className={cn("text-[11px] font-medium", isLocked ? "text-muted-foreground" : "text-foreground")}>{w.clickWindow}</span>
                              </div>
                              {w.viewWindow !== "None" ? (
                                <>
                                  <span className="text-[10px] text-muted-foreground">+</span>
                                  <div className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1">
                                    <Eye className={cn("size-3", isLocked ? "text-muted-foreground/40" : "text-muted-foreground")} />
                                    <span className={cn("text-[11px] font-medium", isLocked ? "text-muted-foreground" : "text-foreground")}>{w.viewWindow}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-muted-foreground">+</span>
                                  <div className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1">
                                    <Eye className="size-3 text-muted-foreground/40" />
                                    <span className="text-[11px] text-muted-foreground">No view</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {isLocked ? (
                              <p className="mt-2 flex items-start gap-1 text-[11px] leading-snug text-amber-600">
                                <Lock className="mt-0.5 size-3 shrink-0" />
                                Your pixel needs more conversion data — keep running ads to unlock.
                              </p>
                            ) : (
                              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                                {w.desc}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Compact explanation */}
                    <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MousePointerClick className="size-3" />
                        <span><span className="font-medium text-foreground">Click</span> = user swipes up, then buys later</span>
                        <span className="mx-1">·</span>
                        <Eye className="size-3" />
                        <span><span className="font-medium text-foreground">View</span> = user only sees ad, then buys later</span>
                      </div>
                    </div>

                    {goalTip && (
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-primary">
                        <Sparkles className="mt-0.5 size-3 shrink-0" />
                        {goalTip}
                      </p>
                    )}
                  </div>
                );
              })()}

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
              {(() => {
                const FREQ_PRESETS = [
                  { id: "conservative", label: "Conservative", count: 2, interval: 168, window: "7 days", hint: "Less fatigue" },
                  { id: "balanced", label: "Balanced", count: 4, interval: 168, window: "7 days", hint: "Recommended", recommended: true },
                  { id: "moderate", label: "Moderate", count: 3, interval: 72, window: "3 days", hint: "Promotions" },
                  { id: "aggressive", label: "Aggressive", count: 6, interval: 168, window: "7 days", hint: "Flash sales" },
                ] as const;
                const activePreset = FREQ_PRESETS.find(
                  (p) => budget.frequencyCapCount === p.count && budget.frequencyCapInterval === p.interval
                );
                return (
                  <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={cn("size-4", budget.frequencyCapEnabled ? "text-primary" : "text-muted-foreground")} />
                        <Label className="text-sm font-semibold text-foreground">Frequency Cap</Label>
                        <InfoTip text="Limit how many times one person sees your ad. Prevents fatigue and improves efficiency." />
                      </div>
                      <Switch
                        checked={budget.frequencyCapEnabled}
                        onCheckedChange={(checked) => {
                          if (checked && (!budget.frequencyCapCount || budget.frequencyCapInterval < 24)) {
                            updateNested("budget", { frequencyCapEnabled: true, frequencyCapCount: 4, frequencyCapInterval: 168 });
                          } else {
                            updateNested("budget", { frequencyCapEnabled: checked });
                          }
                        }}
                      />
                    </div>

                    {budget.frequencyCapEnabled ? (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          {FREQ_PRESETS.map((preset) => {
                            const isActive = activePreset?.id === preset.id;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => updateNested("budget", { frequencyCapCount: preset.count, frequencyCapInterval: preset.interval })}
                                className={cn(
                                  "flex flex-col items-center rounded-xl border py-3 transition-all",
                                  isActive
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border bg-background hover:border-primary/40"
                                )}
                              >
                                <span className={cn("text-lg font-bold tabular-nums", isActive ? "text-primary" : "text-foreground")}>
                                  {preset.count}x
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  / {preset.window}
                                </span>
                                <span className={cn(
                                  "mt-1.5 rounded-full px-2 py-0.5 text-[9px] font-medium",
                                  isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                  {preset.recommended && !isActive ? "★ " : ""}{preset.hint}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Summary */}
                        <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                          <Users className="size-3.5 text-primary" />
                          <p className="text-xs font-medium text-primary">
                            Each person sees your ad up to <span className="font-bold">{budget.frequencyCapCount}x</span> every <span className="font-bold">{budget.frequencyCapInterval === 24 ? "day" : `${budget.frequencyCapInterval / 24} days`}</span>
                          </p>
                        </div>

                        {/* Mixed formats warning */}
                        {campaign.creative.ads.length > 1 && new Set(campaign.creative.ads.map((a) => a.adFormat ?? "SINGLE")).size > 1 && (
                          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                            <p className="text-[11px] leading-relaxed text-red-700">
                              Frequency cap requires all ads to use the same format. Fix in <span className="font-semibold">Ad Design</span> or disable this.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        No limit on how many times a person sees your ad.
                      </p>
                    )}
                  </div>
                );
              })()}


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
              budgetLabel="Daily budget"
              budgetAmount={budget.amount}
              durationDays={durationDays}
              isOngoing={budget.endDateOptional}
              totalBudget={totalBudget}
              autoIncreaseEnabled={autoIncrease.enabled}
              boostEnabled={budget.performanceBoost}
              boostAmount={299}
              startDate={budget.startDate}
              endDate={budget.endDate}
            />

            {/* Estimated Results (shared) */}
            {(() => {
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
              const currentGoalName = goalNameMap[budget.optimizationGoal] ?? "Action";
              const estMin = suggestedBid.max > 0 ? Math.floor(dailyAmount / suggestedBid.max) : 0;
              const estMax = suggestedBid.min > 0 ? Math.floor(dailyAmount / suggestedBid.min) : 0;
              const weeklyMin = estMin * 7;
              const weeklyMax = estMax * 7;
              const rows = [
                { label: `Est. daily ${goalLabel}`, value: estMin > 0 ? `${estMin} – ${estMax}` : "—", highlight: true },
                { label: `Est. weekly ${goalLabel}`, value: weeklyMin > 0 ? `${weeklyMin} – ${weeklyMax}` : "—" },
                { label: `Cost per ${currentGoalName.toLowerCase()}`, value: suggestedBid.min > 0 ? `SAR ${suggestedBid.min.toFixed(2)} – ${suggestedBid.max.toFixed(2)}` : "—" },
                ...(durationDays > 0 && !budget.endDateOptional ? [{ label: `Total est. (${durationDays}d)`, value: estMin > 0 ? `${estMin * durationDays} – ${estMax * durationDays} ${goalLabel}` : "—" }] : []),
              ];
              return (
                <EstimatedResultsCard
                  badge="Snap API"
                  bidRange={{
                    min: suggestedBid.min,
                    max: suggestedBid.max,
                    current: budget.bidStrategy !== "AUTO_BID" ? (budget.bidAmount || 0) : undefined,
                    goalName: currentGoalName,
                  }}
                  dailyBudget={dailyAmount}
                  rows={rows}
                  disclaimer="Estimates are from the Snap Bid Estimate API and depend on targeting, competition, and ad quality. Actual results may vary."
                />
              );
            })()}

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Daily budget", value: `SAR ${budget.amount.toLocaleString()}` },
                { label: "Duration", value: budget.endDateOptional ? "Ongoing" : `${durationDays} days` },
                { label: "Goal", value: OPTIMIZATION_GOALS.find((g) => g.value === budget.optimizationGoal)?.label ?? "-" },
                { label: "Bid strategy", value: budget.bidStrategy === "AUTO_BID" ? "Auto bid" : budget.bidStrategy === "TARGET_COST" ? `Target SAR ${budget.bidAmount || 0}` : `Max SAR ${budget.bidAmount || 0}` },
                ...(objectiveConfig.hasConversionWindow ? [{ label: "Attribution", value: CONVERSION_WINDOWS.find((w) => w.value === budget.conversionWindow)?.label ?? "-" }] : []),
                { label: "Pacing", value: !canUseAccelerated ? "Standard" : budget.pacingType === "STANDARD" ? "Standard" : "Accelerated" },
                { label: "Freq. cap", value: budget.frequencyCapEnabled ? `${budget.frequencyCapCount}x / ${budget.frequencyCapInterval / 24}d` : "Off" },
                ...(budget.performanceBoost ? [{ label: "Boost", value: "Active (SAR 299)" }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: budget.amount >= 150 ? "ok" : "error", text: budget.amount >= 150 ? `SAR ${budget.amount}/day` : "Below SAR 150 minimum" },
                { label: "Schedule", status: budget.startDate ? "ok" : "warning", text: budget.startDate ? `${budget.startDate}${budget.endDateOptional ? " (ongoing)" : ` to ${budget.endDate}`}` : "No start date" },
                { label: "Goal", status: (() => {
                  if (!budget.optimizationGoal) return "warning" as const;
                  const goalEntry = goalsWithLocked.find((g) => g.value === budget.optimizationGoal);
                  if (goalEntry?.locked) return "error" as const;
                  return "ok" as const;
                })(), text: (() => {
                  if (!budget.optimizationGoal) return "Not set";
                  const goalEntry = goalsWithLocked.find((g) => g.value === budget.optimizationGoal);
                  if (goalEntry?.locked) return "Requires pixel — connect in Objective step";
                  return goalEntry?.label ?? "Selected";
                })() },
                { label: "Bid", status: (() => {
                  if (budget.bidStrategy === "AUTO_BID") return "ok" as const;
                  if (!budget.bidAmount || budget.bidAmount <= 0) return "error" as const;
                  if (budget.bidAmount < suggestedBid.min) return "warning" as const;
                  if (budget.bidAmount > budget.amount) return "warning" as const;
                  return "ok" as const;
                })(), text: (() => {
                  if (budget.bidStrategy === "AUTO_BID") return "Auto-optimized";
                  if (!budget.bidAmount || budget.bidAmount <= 0) return "No bid amount set";
                  if (budget.bidAmount < suggestedBid.min) return `SAR ${budget.bidAmount.toFixed(2)} — below suggested`;
                  if (budget.bidAmount > budget.amount) return `SAR ${budget.bidAmount.toFixed(2)} — exceeds daily budget`;
                  return `SAR ${budget.bidAmount.toFixed(2)} per ${goalLabel.replace(/s$/, "")}`;
                })() },
                ...(objectiveConfig.hasConversionWindow ? [{
                  label: "Attribution",
                  status: (budget.conversionWindow === "SWIPE_7DAY" && !pixelEligibleFor7Day ? "warning" : "ok") as "ok" | "warning" | "error",
                  text: budget.conversionWindow === "SWIPE_7DAY" && !pixelEligibleFor7Day
                    ? "7-Day requires pixel eligibility"
                    : CONVERSION_WINDOWS.find((w) => w.value === budget.conversionWindow)?.label ?? "Set",
                }] : []),
                ...(budget.frequencyCapEnabled && campaign.creative.ads.length > 1 && new Set(campaign.creative.ads.map((a) => a.adFormat ?? "SINGLE")).size > 1
                  ? [{ label: "Freq. cap", status: "error" as const, text: "Mixed ad formats — disable cap or unify formats" }]
                  : []),
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
    </TooltipProvider>
  );
}
