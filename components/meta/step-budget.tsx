"use client";

import { useState, useMemo } from "react";
import { useMetaCampaign } from "@/lib/meta/campaign-context";
import {
  META_OBJECTIVE_CONFIGS,
  getBillingEventForGoal,
} from "@/lib/meta/campaign-types";
import type {
  MetaOptimizationGoal,
  MetaConversionEvent,
  MetaBidStrategy,
  MetaBillingEvent,
  MetaClickAttributionWindow,
  MetaViewAttributionWindow,
  MetaPacing,
} from "@/lib/meta/campaign-types";
import { cn } from "@/lib/utils";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  TrendingUp,
  Info,
  Target,
  Zap,
  CreditCard,
  ShoppingCart,
  BarChart3,
  MousePointerClick,
  ChevronDown,
  CheckCircle2,
  Wallet,
  Eye,
  Gauge,
  Settings2,
  MessageSquare,
  Globe,
  Clock,
  Repeat,
  Users,
  Play,
  Smartphone,
  Heart,
} from "lucide-react";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { BidStrategyCard } from "@/components/shared/bid-strategy-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { DeliveryPacingCard } from "@/components/shared/delivery-pacing-card";
import { FrequencyCapCard } from "@/components/shared/frequency-cap-card";
import { ConversionEventCard } from "@/components/shared/conversion-event-card";
import { OptimizationGoalCard } from "@/components/shared/optimization-goal-card";
import { AttributionWindowCard } from "@/components/shared/attribution-window-card";
import {
  LearnMoreSheet,
  LearnMoreTrigger,
  SheetSection,
  SheetDecisionCard,
  useLearnMore,
} from "@/components/shared/learn-more-sheet";
import { fmt } from "@/components/shared/fmt";

/* ================================================================== */
/*  Static config for Sales objective (OUTCOME_SALES)                  */
/* ================================================================== */

const OPTIMIZATION_GOALS: {
  value: MetaOptimizationGoal;
  label: string;
  desc: string;
  bestFor: string;
  icon: React.ReactNode;
  billingLabel: string;
  recommended?: boolean;
}[] = [
  {
    value: "OFFSITE_CONVERSIONS",
    label: "Maximum Conversions",
    desc: "Maximize purchases from your store.",
    bestFor: "Best for most Salla merchants. Start here to maximize purchases from your online store.",
    icon: <Target className="size-4" />,
    billingLabel: "CPM",
    recommended: true,
  },
  {
    value: "VALUE",
    label: "Maximum Value (ROAS)",
    desc: "Prioritize high-value orders over volume.",
    bestFor: "Best when you have varied product prices and want to prioritize high-value conversions.",
    icon: <TrendingUp className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "LINK_CLICKS",
    label: "Link Clicks",
    desc: "Drive traffic to your website.",
    bestFor: "Best for new stores that need traffic, or when testing creatives before optimizing for purchases.",
    icon: <MousePointerClick className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "LANDING_PAGE_VIEWS",
    label: "Landing Page Views",
    desc: "Only count visitors who load your page.",
    bestFor: "Best when you want to ensure visitors reach your store, not just click the ad.",
    icon: <Globe className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "CONVERSATIONS",
    label: "Conversations",
    desc: "Start WhatsApp or Messenger chats.",
    bestFor: "Best for high-consideration products where customers need to chat before buying.",
    icon: <MessageSquare className="size-4" />,
    billingLabel: "CPM",
  },
  /* ---- Awareness & Engagement goals ---- */
  {
    value: "REACH",
    label: "Maximize Reach",
    desc: "Show your ad to the maximum number of unique people.",
    bestFor: "Best for brand awareness, product launches, and getting your store name in front of new audiences.",
    icon: <Users className="size-4" />,
    billingLabel: "CPM",
    recommended: true,
  },
  {
    value: "IMPRESSIONS",
    label: "Maximize Impressions",
    desc: "Show your ad as many times as possible, including repeat views.",
    bestFor: "Best when frequency matters — repeated exposure helps reinforce your message.",
    icon: <Eye className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "AD_RECALL_LIFT",
    label: "Ad Recall Lift",
    desc: "Maximize estimated ad recall — people who remember seeing your ad.",
    bestFor: "Best for brand campaigns where recall and recognition are the primary metrics.",
    icon: <BarChart3 className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "THRUPLAY",
    label: "Video Views (ThruPlay)",
    desc: "Maximize 15-second video views or complete views for shorter videos.",
    bestFor: "Best for video campaigns where watch time and storytelling matter.",
    icon: <Play className="size-4" />,
    billingLabel: "CPM",
    recommended: true,
  },
  {
    value: "POST_ENGAGEMENT",
    label: "Post Engagement",
    desc: "Maximize likes, comments, shares, and reactions on your posts.",
    bestFor: "Best for building social proof and community engagement around your brand.",
    icon: <Heart className="size-4" />,
    billingLabel: "CPM",
  },
  /* ---- App Promotion goals ---- */
  {
    value: "APP_INSTALLS",
    label: "App Installs",
    desc: "Maximize the number of people who install your mobile app.",
    bestFor: "Best for growing your app user base and driving new installations.",
    icon: <Smartphone className="size-4" />,
    billingLabel: "CPM",
    recommended: true,
  },
];

const CONVERSION_EVENTS: {
  value: MetaConversionEvent;
  label: string;
  desc: string;
  icon: React.ReactNode;
  funnelStage: string;
  recommended?: boolean;
}[] = [
  { value: "PURCHASE", label: "Purchase", desc: "Optimizes for completed orders. The most common choice for e-commerce.", icon: <CreditCard className="size-3.5" />, funnelStage: "Bottom funnel", recommended: true },
  { value: "INITIATE_CHECKOUT", label: "Initiate Checkout", desc: "Optimizes for users who start the checkout process.", icon: <Wallet className="size-3.5" />, funnelStage: "Mid funnel" },
  { value: "ADD_TO_CART", label: "Add to Cart", desc: "Optimizes for users who add products to their cart.", icon: <ShoppingCart className="size-3.5" />, funnelStage: "Mid funnel" },
  { value: "VIEW_CONTENT", label: "View Content", desc: "Optimizes for product page views. Good for building pixel data.", icon: <Eye className="size-3.5" />, funnelStage: "Top funnel" },
  { value: "ADD_PAYMENT_INFO", label: "Add Payment Info", desc: "Optimizes for users who enter payment details.", icon: <CreditCard className="size-3.5" />, funnelStage: "Bottom funnel" },
  { value: "COMPLETE_REGISTRATION", label: "Registration", desc: "Optimizes for account sign-ups on your website.", icon: <CheckCircle2 className="size-3.5" />, funnelStage: "Top funnel" },
  { value: "LEAD", label: "Lead", desc: "Optimizes for lead form submissions on your website.", icon: <Users className="size-3.5" />, funnelStage: "Bottom funnel", recommended: true },
  { value: "SEARCH", label: "Search", desc: "Optimizes for search actions on your website.", icon: <Globe className="size-3.5" />, funnelStage: "Top funnel" },
];

const BID_STRATEGIES: {
  value: MetaBidStrategy;
  label: string;
  apiLabel: string;
  desc: string;
  bestFor: string;
  icon: React.ReactNode;
  recommended?: boolean;
  supportedGoals: MetaOptimizationGoal[];
}[] = [
  {
    value: "LOWEST_COST_WITHOUT_CAP",
    label: "Lowest Cost (Auto)",
    apiLabel: "Automatic bidding",
    desc: "Meta automatically bids to get the most results at the lowest cost. No manual cap needed.",
    bestFor: "Best for most Salla merchants, especially when starting a new campaign or testing new products.",
    icon: <Zap className="size-4" />,
    recommended: true,
    supportedGoals: ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "LANDING_PAGE_VIEWS", "CONVERSATIONS", "REACH", "IMPRESSIONS", "AD_RECALL_LIFT", "THRUPLAY", "POST_ENGAGEMENT", "APP_INSTALLS"],
  },
  {
    value: "COST_CAP",
    label: "Cost Cap",
    apiLabel: "Cost Cap (target CPA)",
    desc: "Set a target cost per result. Meta keeps your average cost around this amount.",
    bestFor: "Best when you know your target CPA and want to maintain profitability at scale.",
    icon: <Target className="size-4" />,
    supportedGoals: ["OFFSITE_CONVERSIONS", "LINK_CLICKS", "LANDING_PAGE_VIEWS", "CONVERSATIONS", "THRUPLAY", "POST_ENGAGEMENT", "APP_INSTALLS"],
  },
  {
    value: "LOWEST_COST_WITH_BID_CAP",
    label: "Bid Cap",
    apiLabel: "Maximum bid per auction",
    desc: "Set a maximum bid per auction. Meta won't bid above this amount.",
    bestFor: "Best for advertisers who want strict cost control and understand their auction dynamics.",
    icon: <BarChart3 className="size-4" />,
    supportedGoals: ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "LANDING_PAGE_VIEWS", "CONVERSATIONS", "REACH", "IMPRESSIONS", "AD_RECALL_LIFT", "THRUPLAY", "POST_ENGAGEMENT", "APP_INSTALLS"],
  },
  {
    value: "LOWEST_COST_WITH_MIN_ROAS",
    label: "Minimum ROAS",
    apiLabel: "Minimum ROAS floor",
    desc: "Set a minimum return on ad spend. Meta ensures revenue exceeds this target per SAR spent.",
    bestFor: "Best when you have strong pixel data and want to guarantee a minimum return on ad spend.",
    icon: <TrendingUp className="size-4" />,
    supportedGoals: ["VALUE"],
  },
];

const CLICK_ATTRIBUTION_WINDOWS: { value: MetaClickAttributionWindow; label: string }[] = [
  { value: "1d_click", label: "1 day" },
  { value: "7d_click", label: "7 days" },
];

const VIEW_ATTRIBUTION_WINDOWS: { value: MetaViewAttributionWindow; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "1d_view", label: "1 day" },
  { value: "7d_view", label: "7 days" },
];

const BUDGET_TYPES: { value: string; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "pay_as_you_go", label: "Pay as You Go", desc: "Charged daily, stop anytime", icon: <CreditCard className="size-4" /> },
  { value: "prepaid", label: "Prepaid (Fixed)", desc: "Pay upfront, fixed budget", icon: <Wallet className="size-4" /> },
];

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function MetaStepBudget() {
  const { campaign, setStep, updateNested } = useMetaCampaign();
  const budget = campaign.budget;
  const objectiveConfig = META_OBJECTIVE_CONFIGS[campaign.objective.objective] ?? META_OBJECTIVE_CONFIGS.OUTCOME_SALES;

  /* Auto-increase from campaign context (fallback for old drafts) */
  const autoIncrease = budget.autoIncrease ?? {
    enabled: false,
    pct: 20,
    intervalDays: 7,
    maxDailyBudget: budget.amount * 3,
  };

  /* Local UI state */
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* Learn More hooks */
  const optimizationGoalLearnMore = useLearnMore();
  const bidStrategyLearnMore = useLearnMore();
  const budgetDurationLearnMore = useLearnMore();
  const attributionWindowLearnMore = useLearnMore();
  const frequencyCapLearnMore = useLearnMore();

  const updateBudget = (updates: Partial<typeof budget>) => {
    updateNested("budget", updates);
  };

  /* Duration calc */
  const durationDays = useMemo(() => {
    if (budget.startDate && budget.endDate) {
      return Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000));
    }
    return 14;
  }, [budget.startDate, budget.endDate]);

  const dailyAmount = budget.budgetType === "daily" ? budget.amount : Math.round(budget.amount / durationDays);
  const totalBudget = budget.budgetType === "lifetime" ? budget.amount : budget.amount * durationDays;

  /* Suggested benchmarks for Meta Sales (SAR market) */
  const suggestedBidMap: Record<string, { min: number; max: number }> = {
    OFFSITE_CONVERSIONS: { min: 15.0, max: 30.0 },
    VALUE: { min: 20.0, max: 40.0 },
    LINK_CLICKS: { min: 0.5, max: 2.0 },
    CONVERSATIONS: { min: 8.0, max: 25.0 },
    REACH: { min: 0.3, max: 1.0 },
    IMPRESSIONS: { min: 0.1, max: 0.5 },
    AD_RECALL_LIFT: { min: 0.5, max: 2.0 },
    THRUPLAY: { min: 0.3, max: 1.5 },
    POST_ENGAGEMENT: { min: 0.2, max: 1.0 },
    LANDING_PAGE_VIEWS: { min: 0.8, max: 3.0 },
    APP_INSTALLS: { min: 3.0, max: 10.0 },
  };
  const suggestedBid = suggestedBidMap[budget.optimizationGoal] ?? { min: 1.0, max: 5.0 };

  const suggestedDailyMap: Record<string, number> = {
    OFFSITE_CONVERSIONS: 200,
    VALUE: 300,
    LINK_CLICKS: 75,
    CONVERSATIONS: 150,
    REACH: 50,
    IMPRESSIONS: 50,
    AD_RECALL_LIFT: 75,
    THRUPLAY: 60,
    POST_ENGAGEMENT: 50,
    LANDING_PAGE_VIEWS: 100,
    APP_INSTALLS: 150,
  };
  const suggestedDaily = suggestedDailyMap[budget.optimizationGoal] ?? 100;

  /* Budget strength */
  const goalMultiplierMap: Record<string, number> = {
    OFFSITE_CONVERSIONS: 1,
    VALUE: 1.2,
    LINK_CLICKS: 0.3,
    LANDING_PAGE_VIEWS: 0.4,
    CONVERSATIONS: 0.8,
    REACH: 0.2,
    IMPRESSIONS: 0.15,
    AD_RECALL_LIFT: 0.3,
    THRUPLAY: 0.25,
    POST_ENGAGEMENT: 0.2,
    APP_INSTALLS: 0.8,
  };
  const goalMultiplier = goalMultiplierMap[budget.optimizationGoal] ?? 0.5;
  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: Math.round(50 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(150 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(300 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(500 * goalMultiplier), pct: 100, color: "bg-[#1877F2]", textColor: "text-[#1877F2]", label: "Strong" },
  ];

  /* Goal labels */
  const goalLabelMap: Record<string, string> = {
    OFFSITE_CONVERSIONS: "purchases",
    VALUE: "revenue",
    LINK_CLICKS: "clicks",
    LANDING_PAGE_VIEWS: "page views",
    CONVERSATIONS: "conversations",
    REACH: "people reached",
    IMPRESSIONS: "impressions",
    AD_RECALL_LIFT: "ad recall",
    THRUPLAY: "video views",
    POST_ENGAGEMENT: "engagements",
    APP_INSTALLS: "installs",
  };
  const goalLabel = goalLabelMap[budget.optimizationGoal] ?? "results";

  const eventLabelMap: Record<string, string> = {
    PURCHASE: "purchases",
    INITIATE_CHECKOUT: "checkouts",
    ADD_TO_CART: "add-to-carts",
    VIEW_CONTENT: "page views",
    ADD_PAYMENT_INFO: "payment info adds",
    COMPLETE_REGISTRATION: "registrations",
  };
  const eventLabel = eventLabelMap[budget.conversionEvent] ?? goalLabel;

  const isValid = budget.amount > 0 && budget.startDate;

  /* Whether conversion-based goals are selected (need conversion event + attribution) */
  const isConversionGoal = budget.optimizationGoal === "OFFSITE_CONVERSIONS" || budget.optimizationGoal === "VALUE";

  /* Whether attribution window should be visible */
  const showAttribution = objectiveConfig.hasConversionWindow || (campaign.objective.pixelMode !== "none" && isConversionGoal);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ======================================================= */}
          {/* SECTION 1: Optimization Goal                             */}
          {/* ======================================================= */}
          <OptimizationGoalCard
            goals={OPTIMIZATION_GOALS.filter((goal) => objectiveConfig.allowedGoals.includes(goal.value))}
            selectedGoal={budget.optimizationGoal}
            onGoalChange={(value) => {
              updateBudget({
                optimizationGoal: value as MetaOptimizationGoal,
                billingEvent: getBillingEventForGoal(value as MetaOptimizationGoal) as MetaBillingEvent,
                ...(value === "VALUE" && budget.bidStrategy !== "LOWEST_COST_WITH_MIN_ROAS"
                  ? { bidStrategy: "LOWEST_COST_WITHOUT_CAP" as MetaBidStrategy }
                  : {}),
                ...(value !== "VALUE" && budget.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS"
                  ? { bidStrategy: "LOWEST_COST_WITHOUT_CAP" as MetaBidStrategy }
                  : {}),
              });
            }}
            layout="grid"
            accent="#1877F2"
            learnMoreTrigger={<LearnMoreTrigger {...optimizationGoalLearnMore.triggerProps} />}
          >
            {budget.optimizationGoal === "VALUE" && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2">
                <TrendingUp className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Value optimization</span> requires your pixel to send purchase values via the Conversions API. Meta will prioritize higher-value conversions.
                </p>
              </div>
            )}
          </OptimizationGoalCard>

          {/* ======================================================= */}
          {/* SECTION 2: Conversion Event (for conversion goals)       */}
          {/* ======================================================= */}
          {isConversionGoal && (
            <ConversionEventCard
              accent="#1877F2"
              layout="dropdown"
              events={CONVERSION_EVENTS}
              selectedEvent={budget.conversionEvent}
              onEventChange={(v) => updateBudget({ conversionEvent: v as MetaConversionEvent })}
              roas={
                budget.optimizationGoal === "VALUE"
                  ? {
                      value: budget.roasTarget,
                      onChange: (v) => updateBudget({ roasTarget: Math.max(0.01, v || 1) }),
                    }
                  : undefined
              }
            />
          )}

          {/* ======================================================= */}
          {/* SECTION 3: Bid Strategy                                  */}
          {/* ======================================================= */}
          <BidStrategyCard
            strategies={BID_STRATEGIES.filter((s) => s.supportedGoals.includes(budget.optimizationGoal))}
            selectedStrategy={budget.bidStrategy}
            onStrategyChange={(v) => updateBudget({ bidStrategy: v as MetaBidStrategy })}
            layout="buttons"
            learnMoreTrigger={<LearnMoreTrigger {...bidStrategyLearnMore.triggerProps} />}
            bidInputs={
              budget.bidStrategy === "COST_CAP" || budget.bidStrategy === "LOWEST_COST_WITH_BID_CAP"
                ? [{
                    label: budget.bidStrategy === "COST_CAP" ? "Target Cost per Result" : "Maximum Bid",
                    desc: budget.bidStrategy === "COST_CAP"
                      ? "The maximum average amount you want to pay per result. Meta will try to keep your cost around this target."
                      : "The absolute maximum Meta will bid in any single auction. Strict ceiling, not an average.",
                    value: budget.bidAmount || undefined,
                    onChange: (v: number) => updateBudget({ bidAmount: v || 0 }),
                    suggestedRange: suggestedBid,
                    prefix: "SAR",
                    suffix: `per ${goalLabel}`,
                    min: 0,
                    step: 0.01,
                  }]
                : budget.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS"
                  ? [{
                      label: "Minimum ROAS Target",
                      desc: "A ROAS of 2.0 means SAR 2 revenue for every SAR 1 spent. Meta ensures your return meets this minimum.",
                      value: budget.roasTarget || undefined,
                      onChange: (v: number) => updateBudget({ roasTarget: v || 1.0 }),
                      min: 0.01,
                      step: 0.1,
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
            onPaymentMethodChange={(v) => updateBudget({ paymentMethod: v as "pay_as_you_go" | "prepaid" })}
            showLifetimeToggle={true}
            budgetMode={budget.budgetType}
            onBudgetModeChange={(m) => updateBudget({ budgetType: m })}
            amount={budget.amount}
            onAmountChange={(v) => updateBudget({ amount: v })}
            suggestedDaily={suggestedDaily}
            goalLabel={goalLabel}
            platformName="Meta"
            strengthTiers={strengthTiers}
            startDate={budget.startDate}
            endDate={budget.endDate}
            endDateOptional={budget.endDateOptional ?? false}
            onStartDateChange={(d) => updateBudget({ startDate: d })}
            onEndDateChange={(d) => updateBudget({ endDate: d })}
            showRunContinuously={true}
            endDateRequired={budget.budgetType === "lifetime"}
            showAutoIncrease={true}
            autoIncrease={autoIncrease}
            onAutoIncreaseChange={(ai) => updateBudget({ autoIncrease: ai })}
            onBulkUpdate={(updates) => updateBudget(updates as Partial<typeof budget>)}
            showSmartStart={true}
            learnMoreTrigger={<LearnMoreTrigger {...budgetDurationLearnMore.triggerProps} />}
          />

          {/* ======================================================= */}
          {/* SECTION 5: Performance Boost (Salla Upsell)              */}
          {/* ======================================================= */}
          <PerformanceBoostCard
            enabled={budget.performanceBoost}
            onToggle={(checked) => updateNested("budget", { performanceBoost: checked })}
          />

          {/* ======================================================= */}
          {/* SECTION 6: Advanced Settings (collapsible)               */}
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
                  <p className="mt-1 text-xs text-muted-foreground">Attribution window, pacing, and frequency cap</p>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("flex flex-col gap-4 rounded-b-2xl px-2 pb-2", showAdvanced && "bg-muted/50")}>

              {/* Attribution Window */}
              {showAttribution && (
                <AttributionWindowCard
                  mode="separate"
                  clickOptions={CLICK_ATTRIBUTION_WINDOWS}
                  viewOptions={VIEW_ATTRIBUTION_WINDOWS}
                  clickValue={budget.clickAttributionWindow}
                  viewValue={budget.viewAttributionWindow}
                  onClickChange={(v) => updateBudget({ clickAttributionWindow: v as MetaClickAttributionWindow })}
                  onViewChange={(v) => updateBudget({ viewAttributionWindow: v as MetaViewAttributionWindow })}
                  accent="#1877F2"
                  subtitle="How long after an ad interaction should a conversion still count?"
                  tip="Use 7-day click + 1-day view for your online store. Most customers take 1-3 days to decide after clicking."
                  learnMoreTrigger={<LearnMoreTrigger {...attributionWindowLearnMore.triggerProps} />}
                />
              )}

              {/* Delivery Pacing */}
              <DeliveryPacingCard
                layout="cards"
                accent="#1877F2"
                options={[
                  { value: "standard", label: "Standard", desc: "Spend evenly throughout the day.", icon: <Gauge className="size-4" />, recommended: true },
                  { value: "no_pacing", label: "Accelerated", desc: "Spend as fast as possible. For flash sales.", icon: <Zap className="size-4" /> },
                ]}
                selectedPacing={budget.pacing}
                onPacingChange={(v) => updateBudget({ pacing: v as MetaPacing })}
              />

              {/* Frequency Capping */}
              <FrequencyCapCard
                enabled={budget.frequencyCap.enabled}
                onEnabledChange={(v) => {
                  if (v && !budget.frequencyCap.maxFrequency) {
                    updateBudget({ frequencyCap: { enabled: true, maxFrequency: 4, intervalDays: 7 } });
                  } else {
                    updateBudget({ frequencyCap: { ...budget.frequencyCap, enabled: v } });
                  }
                }}
                maxImpressions={budget.frequencyCap.maxFrequency}
                onMaxImpressionsChange={(v) =>
                  updateBudget({ frequencyCap: { ...budget.frequencyCap, maxFrequency: v } })
                }
                timeWindowValue={String(budget.frequencyCap.intervalDays)}
                timeWindowOptions={[
                  { value: "3", label: "3 days" },
                  { value: "7", label: "7 days" },
                ]}
                onTimeWindowChange={(v) =>
                  updateBudget({ frequencyCap: { ...budget.frequencyCap, intervalDays: Number(v) } })
                }
                timeWindowSummaryLabel={
                  budget.frequencyCap.intervalDays === 1
                    ? "day"
                    : `${budget.frequencyCap.intervalDays} days`
                }
                accent="meta"
                learnMoreTrigger={<LearnMoreTrigger {...frequencyCapLearnMore.triggerProps} />}
                presets={[
                  { id: "conservative", count: 2, timeWindowValue: "7", timeWindowLabel: "7 days", hint: "Less fatigue" },
                  { id: "balanced", count: 4, timeWindowValue: "7", timeWindowLabel: "7 days", hint: "Recommended", recommended: true },
                  { id: "moderate", count: 3, timeWindowValue: "3", timeWindowLabel: "3 days", hint: "Promotions" },
                  { id: "aggressive", count: 6, timeWindowValue: "7", timeWindowLabel: "7 days", hint: "Flash sales" },
                ]}
                onPresetSelect={(count, tw) =>
                  updateBudget({ frequencyCap: { ...budget.frequencyCap, maxFrequency: count, intervalDays: Number(tw) } })
                }
              />

            </CollapsibleContent>
          </Collapsible>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN - Sidebar                                        */}
        {/* ============================================================ */}
        <div className="w-full shrink-0 lg:w-80">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Cost Summary */}
            <CostSummaryCard
              budgetLabel={budget.budgetType === "daily" ? "Daily budget" : "Lifetime budget"}
              budgetAmount={budget.amount}
              durationDays={budget.budgetType === "daily" ? durationDays : undefined}
              isOngoing={budget.endDateOptional}
              totalBudget={totalBudget}
              boostEnabled={budget.performanceBoost}
              boostAmount={149}
              startDate={budget.startDate}
              endDate={budget.endDate}
            />

            {/* Estimated Results */}
            <EstimatedResultsCard
              badge="Predicted"
              rows={[
                { label: `Daily ${eventLabel}`, value: budget.optimizationGoal === "LINK_CLICKS" ? `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` : `${fmt(Math.round(dailyAmount * 0.7))} - ${fmt(Math.round(dailyAmount * 2.2))}` },
                { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
              ]}
            />

            {/* Configuration Check */}
            <ConfigCheckCard
              configRows={[]}
              checkItems={[
                { label: "Budget", status: dailyAmount >= 50 ? "ok" as const : "warning" as const, text: dailyAmount >= 50 ? "Budget is healthy" : "Below recommended minimum" },
                { label: "Duration", status: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "ok" as const : "warning" as const, text: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "Sufficient learning time" : "Too short for optimization" },
                ...(objectiveConfig.pixelRequirement === "required" ? [{
                  label: "Pixel",
                  status: (campaign.objective.pixelMode !== "none" ? "ok" : "error") as "ok" | "error",
                  text: campaign.objective.pixelMode !== "none" ? "Pixel connected" : "No pixel (required)",
                }] : objectiveConfig.pixelRequirement === "optional" ? [{
                  label: "Pixel",
                  status: (campaign.objective.pixelMode !== "none" ? "ok" : "warning") as "ok" | "warning",
                  text: campaign.objective.pixelMode !== "none" ? "Pixel connected" : "No pixel (optional, recommended)",
                }] : []),
                ...(campaign.objective.objective === "OUTCOME_APP_PROMOTION" ? [{
                  label: "App",
                  status: (campaign.objective.appSettings.appStoreUrl ? "ok" : "error") as "ok" | "error",
                  text: campaign.objective.appSettings.appStoreUrl ? "App configured" : "App store URL required",
                }] : []),
              ]}
            />


          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Learn More Sheets                                              */}
      {/* ============================================================ */}

      <LearnMoreSheet
        open={optimizationGoalLearnMore.open}
        onOpenChange={optimizationGoalLearnMore.setOpen}
        title="Optimization Strategy"
        description="Your optimization goal tells Meta what result to maximize with your budget. It directly controls which users see your ad."
        icon={<Target />}
        proTip={
          campaign.objective.objective === "OUTCOME_AWARENESS"
            ? "For awareness, Reach gives you the widest unique audience. Use Ad Recall Lift when measuring brand impact is the priority."
            : campaign.objective.objective === "OUTCOME_ENGAGEMENT"
              ? "Start with ThruPlay if you have video content — it drives the deepest engagement. Use Post Engagement to build social proof."
              : campaign.objective.objective === "OUTCOME_APP_PROMOTION"
                ? "Use App Installs for growth. Once you have 50+ weekly in-app events, switch to In-App Events to optimize for higher-value users."
                : "Start with Maximum Conversions (Purchase) if your Pixel has 50+ weekly purchases. For newer stores, start with Link Clicks to build traffic, then upgrade to Conversions once you have enough Pixel data."
        }
      >
        <SheetSection icon={<Target />} title="Which goal should I pick?">
          <div className="flex flex-col gap-2">
            {/* Sales & Leads goals */}
            {objectiveConfig.allowedGoals.includes("OFFSITE_CONVERSIONS") && (
              <SheetDecisionCard
                title="Maximum Conversions"
                description="Meta finds people most likely to complete your desired action (purchase, lead, etc.). Requires a Pixel with at least 50 weekly events for stable optimization."
                highlighted
              />
            )}
            {objectiveConfig.allowedGoals.includes("VALUE") && (
              <SheetDecisionCard
                title="Maximum Value (ROAS)"
                description="Optimizes for total revenue, not just conversion count. Best for stores with varied product prices where you want to prioritize high-value orders."
              />
            )}
            {objectiveConfig.allowedGoals.includes("LINK_CLICKS") && (
              <SheetDecisionCard
                title="Link Clicks"
                description="Drives the most clicks to your destination. Good for new stores building traffic, or when testing creatives before switching to conversion optimization."
              />
            )}
            {objectiveConfig.allowedGoals.includes("LANDING_PAGE_VIEWS") && (
              <SheetDecisionCard
                title="Landing Page Views"
                description="Like Link Clicks, but only counts visitors who actually load your page. Filters out accidental clicks and slow connections."
              />
            )}
            {objectiveConfig.allowedGoals.includes("CONVERSATIONS") && (
              <SheetDecisionCard
                title="Conversations"
                description="Optimizes for WhatsApp, Messenger, or Instagram Direct chats. Best for high-consideration products where customers need to chat before buying."
              />
            )}
            {/* Awareness goals */}
            {objectiveConfig.allowedGoals.includes("REACH") && (
              <SheetDecisionCard
                title="Maximize Reach"
                description="Shows your ad to the maximum number of unique people. Best for brand launches and getting your name in front of new audiences."
                highlighted={campaign.objective.objective === "OUTCOME_AWARENESS"}
              />
            )}
            {objectiveConfig.allowedGoals.includes("IMPRESSIONS") && (
              <SheetDecisionCard
                title="Maximize Impressions"
                description="Shows your ad as many times as possible, including repeat views. Best when repeated exposure matters for message reinforcement."
              />
            )}
            {objectiveConfig.allowedGoals.includes("AD_RECALL_LIFT") && (
              <SheetDecisionCard
                title="Ad Recall Lift"
                description="Maximizes estimated ad recall — people who remember seeing your ad. Best for brand campaigns where recall and recognition are the key metrics."
              />
            )}
            {/* Engagement goals */}
            {objectiveConfig.allowedGoals.includes("THRUPLAY") && (
              <SheetDecisionCard
                title="Video Views (ThruPlay)"
                description="Maximizes 15-second video views or complete views for shorter videos. Best for video campaigns where watch time and storytelling matter."
                highlighted={campaign.objective.objective === "OUTCOME_ENGAGEMENT"}
              />
            )}
            {objectiveConfig.allowedGoals.includes("POST_ENGAGEMENT") && (
              <SheetDecisionCard
                title="Post Engagement"
                description="Maximizes likes, comments, shares, and reactions. Best for building social proof and community engagement around your brand."
              />
            )}
            {/* App goals */}
            {objectiveConfig.allowedGoals.includes("APP_INSTALLS") && (
              <SheetDecisionCard
                title="App Installs"
                description="Maximizes the number of people who install your app. Best for growing your user base when app download volume is the primary goal."
                highlighted={campaign.objective.objective === "OUTCOME_APP_PROMOTION"}
              />
            )}
          </div>
        </SheetSection>
        <SheetSection icon={<Info />} title="How it works">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Meta&apos;s algorithm uses your event data to find users most likely to take your chosen action. For conversion goals, the more historical data your Pixel or app SDK has, the better Meta can model your ideal audience and bid accurately in the ad auction.
          </p>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={bidStrategyLearnMore.open}
        onOpenChange={bidStrategyLearnMore.setOpen}
        title="Bidding Strategy"
        description="Your bid strategy controls how Meta competes in the ad auction for each impression. It directly affects your cost per result and delivery volume."
        icon={<Gauge />}
        proTip="Start with Lowest Cost (Auto) for the first 1-2 weeks. Once you know your average CPA, switch to Cost Cap to lock in that target while scaling."
      >
        <SheetSection icon={<Gauge />} title="Strategy comparison">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Lowest Cost (Auto)"
              description="Meta bids automatically to get the most results at the lowest possible cost. You get the most volume, but individual cost per result may vary. Best for new campaigns."
              highlighted
            />
            <SheetDecisionCard
              title="Cost Cap"
              description="Meta targets an average cost per result close to your cap. Delivery may slow if the market is competitive, but your average CPA stays controlled."
            />
            <SheetDecisionCard
              title="Bid Cap"
              description="Hard ceiling on each individual bid. Gives maximum cost control but can severely limit delivery if set too low. Best for experienced advertisers."
            />
            <SheetDecisionCard
              title="Minimum ROAS"
              description="Only available with Value optimization. Sets a floor for return on ad spend. Meta won't bid unless it expects the conversion to meet your ROAS target."
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
        description="Your budget and schedule determine how much Meta can spend and for how long. Getting these right is critical for the learning phase."
        icon={<Wallet />}
        proTip="Set your daily budget to at least 50x your expected CPA. This gives Meta enough room to exit the learning phase within 7 days and stabilize your cost per result."
      >
        <SheetSection icon={<DollarSign />} title="Daily vs Lifetime">
          <div className="flex flex-col gap-2">
            <SheetDecisionCard
              title="Daily Budget"
              description="Meta spends up to this amount each day. Spend is consistent and predictable. Works with auto-increase and ongoing campaigns."
              highlighted
            />
            <SheetDecisionCard
              title="Lifetime Budget"
              description="Meta spreads the total across the campaign duration. Allows Meta to spend more on high-opportunity days and less on slow days."
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
        icon={<MousePointerClick />}
        proTip="A wider window gives Meta more conversion signals, which improves delivery optimization. Only narrow it if you sell impulse-buy products with very short purchase cycles."
      >
        <SheetSection icon={<MousePointerClick />} title="Click-through window">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Counts conversions that happen after a user <span className="font-semibold text-foreground">clicks</span> your ad. A 7-day click window means a purchase made 5 days after clicking still counts as a result. Meta supports 1-day, 7-day, and 28-day click windows.
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
              description="For impulse purchases where the decision happens immediately. Gives the tightest attribution but fewer signals for optimization."
            />
          </div>
        </SheetSection>
      </LearnMoreSheet>

      <LearnMoreSheet
        open={frequencyCapLearnMore.open}
        onOpenChange={frequencyCapLearnMore.setOpen}
        title="Frequency Cap"
        description="Controls how many times each individual user sees your ad within a time window. Prevents ad fatigue and improves cost efficiency."
        icon={<Repeat />}
        proTip="For conversion campaigns, start with 3 impressions per 7 days. This balances message reinforcement with audience freshness."
      >
        <SheetSection icon={<Repeat />} title="Why frequency matters">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Showing your ad too many times to the same person leads to <span className="font-semibold text-foreground">ad fatigue</span> — users start ignoring or hiding your content. But showing it too few times means your message doesn&apos;t stick. The right balance depends on your campaign goal and creative quality.
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

      <WizardStepFooter
        onPrevious={() => setStep(1)}
        onNext={() => setStep(3)}
        previousLabel="Back"
        nextLabel="Next"
        nextDisabled={!isValid}
        accent="meta"
      />
    </TooltipProvider>
  );
}
