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
  ShoppingCart,
  AlertCircle,
  BarChart3,
  MousePointerClick,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Wallet,
  Eye,
  Gauge,
  CalendarClock,
  ArrowUpRight,
  Settings2,
  MessageSquare,
} from "lucide-react";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { BidStrategyCard } from "@/components/shared/bid-strategy-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { DeliveryPacingCard } from "@/components/shared/delivery-pacing-card";
import { ConversionEventCard } from "@/components/shared/conversion-event-card";
import { OptimizationGoalCard } from "@/components/shared/optimization-goal-card";
import { AttributionWindowCard } from "@/components/shared/attribution-window-card";
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
    desc: "Get the most conversion events within your budget. Meta bids to maximize total events.",
    bestFor: "Best for most Salla merchants. Start here to maximize purchases from your online store.",
    icon: <Target className="size-4" />,
    billingLabel: "CPM",
    recommended: true,
  },
  {
    value: "VALUE",
    label: "Maximum Value (ROAS)",
    desc: "Maximize total purchase value, not just volume. Best for varied product prices.",
    bestFor: "Best when you have varied product prices and want to prioritize high-value conversions.",
    icon: <TrendingUp className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "LINK_CLICKS",
    label: "Link Clicks",
    desc: "Drive clicks to your website. No conversion optimization applied.",
    bestFor: "Best for new stores that need traffic, or when testing creatives before optimizing for purchases.",
    icon: <MousePointerClick className="size-4" />,
    billingLabel: "CPM",
  },
  {
    value: "CONVERSATIONS",
    label: "Conversations",
    desc: "Messenger, WhatsApp, or IG Direct conversations that lead to purchases.",
    bestFor: "Best for high-consideration products where customers need to chat before buying.",
    icon: <MessageSquare className="size-4" />,
    billingLabel: "CPM",
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
  { value: "VIEW_CONTENT", label: "View Content", desc: "Optimizes for product page views. Good for awareness.", icon: <Eye className="size-3.5" />, funnelStage: "Top funnel" },
  { value: "ADD_PAYMENT_INFO", label: "Add Payment Info", desc: "Optimizes for users who enter payment details.", icon: <CreditCard className="size-3.5" />, funnelStage: "Bottom funnel" },
  { value: "COMPLETE_REGISTRATION", label: "Registration", desc: "Optimizes for account sign-ups on your website.", icon: <CheckCircle2 className="size-3.5" />, funnelStage: "Top funnel" },
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
    supportedGoals: ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "CONVERSATIONS"],
  },
  {
    value: "COST_CAP",
    label: "Cost Cap",
    apiLabel: "Cost Cap (target CPA)",
    desc: "Set a target cost per result. Meta keeps your average cost per result around this amount.",
    bestFor: "Best when you know your target CPA and want to maintain profitability at scale.",
    icon: <Target className="size-4" />,
    supportedGoals: ["OFFSITE_CONVERSIONS", "LINK_CLICKS", "CONVERSATIONS"],
  },
  {
    value: "LOWEST_COST_WITH_BID_CAP",
    label: "Bid Cap",
    apiLabel: "Maximum bid per auction",
    desc: "Set a maximum bid. Meta won't bid above this in any auction.",
    bestFor: "Best for advertisers who want strict cost control and understand their auction dynamics.",
    icon: <BarChart3 className="size-4" />,
    supportedGoals: ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "CONVERSATIONS"],
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
  { value: "28d_click", label: "28 days" },
];

const VIEW_ATTRIBUTION_WINDOWS: { value: MetaViewAttributionWindow; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "1d_view", label: "1 day" },
  { value: "7d_view", label: "7 days" },
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
  };
  const suggestedBid = suggestedBidMap[budget.optimizationGoal] ?? { min: 1.0, max: 5.0 };

  const suggestedDailyMap: Record<string, number> = {
    OFFSITE_CONVERSIONS: 200,
    VALUE: 300,
    LINK_CLICKS: 75,
    CONVERSATIONS: 150,
  };
  const suggestedDaily = suggestedDailyMap[budget.optimizationGoal] ?? 100;

  /* Budget strength */
  const goalMultiplier = budget.optimizationGoal === "OFFSITE_CONVERSIONS" ? 1
    : budget.optimizationGoal === "VALUE" ? 1.2
    : budget.optimizationGoal === "LINK_CLICKS" ? 0.3
    : 0.8;
  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: Math.round(50 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(150 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(300 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(500 * goalMultiplier), pct: 100, color: "bg-[#1877F2]", textColor: "text-[#1877F2]", label: "Strong" },
  ];
  const currentTier = [...strengthTiers].reverse().find((t) => dailyAmount >= t.min)!;

  /* Goal labels */
  const goalLabelMap: Record<string, string> = {
    OFFSITE_CONVERSIONS: "purchases",
    VALUE: "revenue",
    LINK_CLICKS: "clicks",
    CONVERSATIONS: "conversations",
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-6 lg:flex-row", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============================================================ */}
        {/* LEFT COLUMN                                                   */}
        {/* ============================================================ */}
        <div className="flex flex-1 flex-col gap-5">

          {/* ======================================================= */}
          {/* SECTION 1: Budget, Duration (shared card)                */}
          {/* ======================================================= */}
          <BudgetDurationCard
            budgetTypes={[]}
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
          />


          {/* ======================================================= */}
          {/* SECTION 2: Optimization Goal                             */}
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
            layout="list"
            accent="#1877F2"
            apiBadge="optimization_goal"
            subtitle="What outcome do you want from this campaign? Meta will allocate your budget to maximize the chosen goal."
            infoTipText="Tell Meta what result matters most. The delivery algorithm optimizes towards this goal using your Pixel and CAPI data. Maps to optimization_goal at the Ad Set level."
          >
            {budget.optimizationGoal === "VALUE" && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-[#1877F2]/20 bg-[#1877F2]/5 px-3 py-2">
                <TrendingUp className="mt-0.5 size-3 shrink-0 text-[#1877F2]" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Value optimization</span> requires your pixel to send purchase values via the Conversions API. Meta will prioritize higher-value conversions.
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">Billing model</p>
                <p className="text-xs font-semibold text-foreground">
                  {budget.billingEvent === "IMPRESSIONS" ? "CPM (per 1,000 impressions)" : budget.billingEvent === "LINK_CLICKS" ? "CPC (per click)" : "ThruPlay (per view)"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground">What this means</p>
                <p className="text-xs font-medium text-foreground">
                  {budget.billingEvent === "IMPRESSIONS"
                    ? "Charged per 1,000 impressions, optimized for your goal"
                    : budget.billingEvent === "LINK_CLICKS"
                      ? "Charged only when someone clicks your ad"
                      : "Charged per completed video view (15s+)"}
                </p>
              </div>
            </div>
          </OptimizationGoalCard>

          {/* ======================================================= */}
          {/* SECTION 3: Conversion Event (for OFFSITE_CONVERSIONS/VALUE) */}
          {/* ======================================================= */}
          {(budget.optimizationGoal === "OFFSITE_CONVERSIONS" || budget.optimizationGoal === "VALUE") && (
            <ConversionEventCard
              accent="#1877F2"
              apiBadge="custom_event_type"
              events={CONVERSION_EVENTS}
              selectedEvent={budget.conversionEvent}
              onEventChange={(v) => updateBudget({ conversionEvent: v })}
              infoTipText="The specific website event Meta will optimize for. This must match an event sent by your Meta Pixel and Conversions API on your Salla store."
              tip="Start with Purchase for maximum ROI. If your pixel has fewer than 50 weekly purchases, try Add to Cart first -- Meta needs enough event data to exit the learning phase effectively."
              roas={
                budget.optimizationGoal === "VALUE"
                  ? {
                      value: budget.roasTarget,
                      onChange: (v) => updateBudget({ roasTarget: Math.max(0.01, v || 1) }),
                      apiBadge: "roas_average_floor",
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
            selectedStrategy={budget.bidStrategy}
            onStrategyChange={(v) => updateBudget({ bidStrategy: v as MetaBidStrategy })}
            layout="cards"
            infoTipText="Controls how Meta bids in the ad auction. Maps to bid_strategy at the Campaign or Ad Set level. Lowest Cost = LOWEST_COST_WITHOUT_CAP (auto-bid). Cost Cap = COST_CAP with bid_amount."
            billingContext={[
              {
                label: "Billing model",
                value: budget.billingEvent === "IMPRESSIONS" ? "CPM (per 1,000 impressions)" : budget.billingEvent === "LINK_CLICKS" ? "CPC (per click)" : "ThruPlay (per view)",
              },
              {
                label: "What this means",
                value: budget.billingEvent === "IMPRESSIONS"
                  ? "Charged per 1,000 impressions, optimized for your goal"
                  : budget.billingEvent === "LINK_CLICKS"
                    ? "Charged only when someone clicks your ad"
                    : "Charged per completed video view (15s+)",
              },
            ]}
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
                    suffix: "per action",
                    min: 0,
                    step: 0.01,
                  }]
                : budget.bidStrategy === "LOWEST_COST_WITH_MIN_ROAS"
                  ? [{
                      label: "Minimum ROAS Target",
                      desc: "A ROAS of 2.0 means SAR 2 revenue for every SAR 1 spent. Maps to roas_average_floor.",
                      value: budget.roasTarget || undefined,
                      onChange: (v: number) => updateBudget({ roasTarget: v || 1.0 }),
                      min: 0.01,
                      step: 0.1,
                    }]
                  : undefined
            }
          />

          {/* ======================================================= */}
          {/* SECTION 5: Attribution Window                             */}
          {/* ======================================================= */}
          {(budget.optimizationGoal === "OFFSITE_CONVERSIONS" || budget.optimizationGoal === "VALUE") && (
            <AttributionWindowCard
              mode="separate"
              clickOptions={CLICK_ATTRIBUTION_WINDOWS}
              viewOptions={VIEW_ATTRIBUTION_WINDOWS}
              clickValue={budget.clickAttributionWindow}
              viewValue={budget.viewAttributionWindow}
              onClickChange={(v) => updateBudget({ clickAttributionWindow: v as MetaClickAttributionWindow })}
              onViewChange={(v) => updateBudget({ viewAttributionWindow: v as MetaViewAttributionWindow })}
              accent="#1877F2"
              apiBadge="attribution_spec"
              subtitle="How long after someone interacts with your ad should a purchase still count as a result? This affects both reporting and how Meta optimizes delivery."
              infoTipText="Defines the time window in which a conversion is credited to your ad after a user clicks or views it. Maps to attribution_spec on the Ad Set."
              tip="Use 7-day click + 1-day view for your online store. Most customers take 1-3 days to decide on a purchase after clicking an ad."
            />
          )}

          {/* ======================================================= */}
          {/* SECTION 6: Advanced (collapsible)                        */}
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
                  <p className="mt-1 text-xs text-muted-foreground">Pacing and delivery type</p>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("flex flex-col gap-4 rounded-b-2xl px-2 pb-2", showAdvanced && "bg-muted/50")}>

              {/* Delivery Pacing */}
              <DeliveryPacingCard
                layout="cards"
                accent="#1877F2"
                apiBadge="pacing_type"
                options={[
                  { value: "standard", label: "Standard", desc: "Spend budget evenly throughout the day. Recommended for most campaigns.", icon: <Gauge className="size-4" />, recommended: true },
                  { value: "no_pacing", label: "Accelerated", desc: "Spend budget as fast as possible. Use for flash sales and time-sensitive promos.", icon: <Zap className="size-4" /> },
                ]}
                selectedPacing={budget.pacing}
                onPacingChange={(v) => updateBudget({ pacing: v as MetaPacing })}
                infoTipText="Controls how fast Meta spends your daily budget. Maps to pacing_type: STANDARD or NO_PACING."
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

        {/* ============================================================ */}
        {/* RIGHT COLUMN - Sticky Sidebar                                 */}
        {/* ============================================================ */}
        <div className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-4">

            {/* Cost Summary (shared) */}
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

            {/* Estimated Results (shared) */}
            <EstimatedResultsCard
              badge="Predicted"
              rows={[
                { label: `Daily ${eventLabel}`, value: budget.optimizationGoal === "LINK_CLICKS" ? `${fmt(Math.round(dailyAmount / suggestedBid.max))} - ${fmt(Math.round(dailyAmount / suggestedBid.min))}` : `${fmt(Math.round(dailyAmount * 0.7))} - ${fmt(Math.round(dailyAmount * 2.2))}` },
                { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
              ]}
              disclaimer="Estimates based on similar campaigns. Actual results vary by creative quality and competition."
            />

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                ...(budget.optimizationGoal === "OFFSITE_CONVERSIONS" || budget.optimizationGoal === "VALUE" ? [{ label: "Event", value: CONVERSION_EVENTS.find((e) => e.value === budget.conversionEvent)?.label ?? budget.conversionEvent }] : []),
                { label: "Goal", value: OPTIMIZATION_GOALS.find((g) => g.value === budget.optimizationGoal)?.label ?? budget.optimizationGoal },
                { label: "Bid strategy", value: BID_STRATEGIES.find((s) => s.value === budget.bidStrategy)?.label ?? budget.bidStrategy },
                { label: "Billing", value: budget.billingEvent === "IMPRESSIONS" ? "CPM" : budget.billingEvent === "LINK_CLICKS" ? "CPC" : "ThruPlay" },
                ...(budget.optimizationGoal === "OFFSITE_CONVERSIONS" || budget.optimizationGoal === "VALUE" ? [{ label: "Attribution", value: `${budget.clickAttributionWindow === "7d_click" ? "7d click" : budget.clickAttributionWindow === "1d_click" ? "1d click" : "28d click"} + ${budget.viewAttributionWindow === "1d_view" ? "1d view" : budget.viewAttributionWindow === "7d_view" ? "7d view" : "none"}` }] : []),
                ...(budget.optimizationGoal === "VALUE" ? [{ label: "ROAS target", value: `${budget.roasTarget}x` }] : []),
                { label: "Pacing", value: budget.pacing === "standard" ? "Standard" : "Accelerated" },
              ]}
              checkItems={[
                { label: "Budget", status: dailyAmount >= 50 ? "ok" as const : "warning" as const, text: dailyAmount >= 50 ? "Budget is healthy" : "Below recommended minimum" },
                { label: "Duration", status: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "ok" as const : "warning" as const, text: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "Sufficient learning time" : "Too short for optimization" },
                { label: "Pixel", status: campaign.objective.pixelMode !== "none" ? "ok" as const : "error" as const, text: campaign.objective.pixelMode !== "none" ? "Pixel connected" : "No pixel (required)" },
                { label: "Bid strategy", status: "ok" as const, text: budget.bidStrategy === "LOWEST_COST_WITHOUT_CAP" ? "Lowest Cost (Auto)" : `${BID_STRATEGIES.find((s) => s.value === budget.bidStrategy)?.label ?? budget.bidStrategy}${budget.bidAmount ? `: SAR ${budget.bidAmount}` : ""}` },
                { label: "Billing", status: "ok" as const, text: budget.billingEvent === "IMPRESSIONS" ? "CPM (standard)" : budget.billingEvent },
              ]}
            />

            {/* Disclaimer */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Estimates are approximate and based on Meta Ads API. Actual results depend on ad quality, competition, and audience engagement.
              </p>
            </div>

          </div>
        </div>
      </div>
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
