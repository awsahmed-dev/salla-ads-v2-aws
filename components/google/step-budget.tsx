"use client";

import { useEffect, useMemo, useState } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/google/campaign-types";
import { generateBudgetRecommendation, getStoreSnapshot, type BudgetRecommendation } from "@/lib/google/search-ai-generator";
import type { BiddingStrategy, ConversionGoal, PaymentMethod } from "@/lib/google/campaign-types";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
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
  DollarSign,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  CreditCard,
  ShoppingCart,
  Clock,
  AlertCircle,
  Gauge,
  ArrowUpRight,
  Wallet,
  Sparkles,
  Settings2,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Link2,
  Globe,
  CheckCircle2,
  Receipt,
  Smartphone,
  X,
  AlertTriangle,
  Clock3,
  MousePointerClick,
} from "lucide-react";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { BidStrategyCard, type BidInput } from "@/components/shared/bid-strategy-card";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { ConversionEventCard } from "@/components/shared/conversion-event-card";
import { fmt } from "@/components/shared/fmt";

/* ================================================================== */
/*  Static config                                                     */
/* ================================================================== */

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

const BIDDING_STRATEGIES: {
  value: BiddingStrategy;
  label: string;
  apiLabel: string;
  desc: string;
  bestFor: string;
  icon: React.ReactNode;
  recommended?: boolean;
  showTargetCpa?: boolean;
  showTargetRoas?: boolean;
  supportedObjectives: string[];
}[] = [
  {
    value: "MAXIMIZE_CONVERSIONS",
    label: "Maximize Conversions",
    apiLabel: "Lowest Cost (auto-bid)",
    desc: "Google automatically sets bids to help get the most conversions within your budget.",
    bestFor: "Best for most PMax campaigns, especially when starting out or testing. Lets Google's AI optimize freely.",
    icon: <Zap className="size-4" />,
    recommended: true,
    showTargetCpa: true,
    supportedObjectives: ["PERFORMANCE_MAX", "SHOPPING", "DEMAND_GEN", "SEARCH", "DISPLAY", "APP"],
  },
  {
    value: "MAXIMIZE_CONVERSION_VALUE",
    label: "Maximize Conversion Value",
    apiLabel: "Value Optimization",
    desc: "Google automatically sets bids to maximize total conversion value (revenue) within your budget.",
    bestFor: "Best when you have varied product prices and want to maximize total revenue, not just order count.",
    icon: <TrendingUp className="size-4" />,
    showTargetRoas: true,
    supportedObjectives: ["PERFORMANCE_MAX", "SHOPPING", "DEMAND_GEN", "SEARCH"],
  },
  {
    value: "TARGET_CPA",
    label: "Target CPA",
    apiLabel: "Cost Cap (target CPA)",
    desc: "Google sets bids to get as many conversions as possible at the target cost-per-action you set.",
    bestFor: "Best when you know your target cost per purchase and want to maintain profitability.",
    icon: <Target className="size-4" />,
    showTargetCpa: true,
    supportedObjectives: ["PERFORMANCE_MAX", "DEMAND_GEN", "SEARCH", "DISPLAY", "APP"],
  },
  {
    value: "TARGET_CPC",
    label: "Target CPC",
    apiLabel: "Target CPC",
    desc: "Google sets bids to maximize clicks while aiming for your target average cost-per-click.",
    bestFor: "Best for Demand Gen traffic campaigns focused on efficient click acquisition.",
    icon: <MousePointerClick className="size-4" />,
    supportedObjectives: ["DEMAND_GEN"],
  },
  {
    value: "TARGET_ROAS",
    label: "Target ROAS",
    apiLabel: "Target ROAS",
    desc: "Google sets bids to maximize conversion value while trying to achieve the target return on ad spend.",
    bestFor: "Best for established stores with stable conversion data who want to hit a specific return target.",
    icon: <BarChart3 className="size-4" />,
    showTargetRoas: true,
    supportedObjectives: ["PERFORMANCE_MAX", "SHOPPING", "DEMAND_GEN", "SEARCH"],
  },
  {
    value: "TARGET_SPEND",
    label: "Maximize Clicks",
    apiLabel: "Maximize Clicks",
    desc: "Get as many clicks as possible within your budget.",
    bestFor: "Best for driving traffic when you want maximum click volume at the lowest cost.",
    icon: <MousePointerClick className="size-4" />,
    supportedObjectives: ["SEARCH", "DISPLAY"],
  },
  {
    value: "MANUAL_CPC",
    label: "Manual CPC",
    apiLabel: "Manual CPC",
    desc: "Set your own maximum cost-per-click bids for each product group. Full control over individual bid amounts.",
    bestFor: "Best for experienced advertisers who want granular control over Shopping bids per product group.",
    icon: <Settings2 className="size-4" />,
    supportedObjectives: ["SHOPPING", "SEARCH", "DISPLAY"],
  },
  {
    value: "ENHANCED_CPC",
    label: "Enhanced CPC",
    apiLabel: "Enhanced CPC",
    desc: "Automatically adjusts manual bids for clicks more likely to convert.",
    bestFor: "Best for advertisers who want manual bid control with automated adjustments for higher-converting clicks.",
    icon: <TrendingUp className="size-4" />,
    supportedObjectives: ["SHOPPING", "SEARCH", "DISPLAY"],
  },
];

const CONVERSION_GOALS: {
  value: ConversionGoal;
  label: string;
  desc: string;
  funnelStage: string;
  icon: React.ReactNode;
  recommended?: boolean;
}[] = [
  {
    value: "PURCHASE",
    label: "Purchase",
    desc: "Optimizes for completed orders. This is the most common choice.",
    funnelStage: "Bottom funnel",
    icon: <CreditCard className="size-3.5" />,
    recommended: true,
  },
  {
    value: "BEGIN_CHECKOUT",
    label: "Begin Checkout",
    desc: "Optimizes for users who start the checkout process.",
    funnelStage: "Mid funnel",
    icon: <ShoppingCart className="size-3.5" />,
  },
  {
    value: "ADD_TO_CART",
    label: "Add to Cart",
    desc: "Optimizes for users who add products to their cart.",
    funnelStage: "Mid funnel",
    icon: <ShoppingCart className="size-3.5" />,
  },
  {
    value: "PAGE_VIEW",
    label: "View Product",
    desc: "Optimizes for product page views. Good for awareness.",
    funnelStage: "Top funnel",
    icon: <Globe className="size-3.5" />,
  },
  {
    value: "LEAD",
    label: "Lead",
    desc: "Optimizes for lead generation form submissions.",
    funnelStage: "Bottom funnel",
    icon: <Target className="size-3.5" />,
  },
  {
    value: "APP_INSTALL",
    label: "App Install",
    desc: "Optimizes for app downloads and installations.",
    funnelStage: "Top funnel",
    icon: <Smartphone className="size-3.5" />,
  },
  {
    value: "IN_APP_PURCHASE",
    label: "In-App Purchase",
    desc: "Optimizes for purchase events within your app.",
    funnelStage: "Bottom funnel",
    icon: <CreditCard className="size-3.5" />,
  },
];


/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */

export function GoogleStepBudget() {
  const { campaign, setStep, updateNested } = useGoogleCampaign();
  const budget = campaign.budget;
  const aud = campaign.audience;
  const objConfig = OBJECTIVE_CONFIGS[campaign.objective.objective] ?? OBJECTIVE_CONFIGS.PERFORMANCE_MAX;
  const isPMax = campaign.objective.objective === "PERFORMANCE_MAX";
  const isSearch = campaign.objective.objective === "SEARCH";
  const isShopping = campaign.objective.objective === "SHOPPING";
  const isDemandGen = campaign.objective.objective === "DEMAND_GEN";
  const isApp = campaign.objective.objective === "APP";


  /* Auto-increase from campaign context (fallback for old drafts) */
  const autoIncrease = budget.autoIncrease ?? {
    enabled: false,
    pct: 20,
    intervalDays: 7,
    maxDailyBudget: budget.amount * 3,
  };

  /* UI state */
  const endDateRequired = budget.paymentMethod === "prepaid";
  const hasFinalUrlTextAutomation = budget.assetAutomationSettings.some(
    (entry) =>
      entry.type === "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION" &&
      entry.status === "OPTED_IN"
  );
  const aiMaxCompatibilityError = isSearch && hasFinalUrlTextAutomation && !budget.aiMaxSettings.enableAiMax;

  /* Duration calc */
  const durationDays =
    budget.startDate && budget.endDate
      ? Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000))
      : 14;

  const dailyAmount = budget.amount;

  /* Smart budget recommendation from store data */
  const [budgetRec, setBudgetRec] = useState<BudgetRecommendation | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const snapshot = await getStoreSnapshot();
        setBudgetRec(generateBudgetRecommendation(snapshot));
      } catch { /* fail silently */ }
    })();
  }, []);

  /* Suggested budget range (enhanced with store data when available) */
  const suggestedDaily = budgetRec?.dailyBudget ?? (isPMax ? 200 : isShopping ? 150 : isDemandGen ? 250 : 150);
  const suggestedBid = isPMax ? { min: 15, max: 30 } : isShopping ? { min: 5, max: 20 } : isDemandGen ? { min: 20, max: 40 } : { min: budgetRec?.targetCpa ? Math.max(5, budgetRec.targetCpa - 5) : 10, max: budgetRec?.targetCpa ? budgetRec.targetCpa + 5 : 25 };

  /* Budget strength */
  const goalMultiplier = isPMax ? 1.2 : 1;
  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: Math.round(50 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(150 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(300 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(500 * goalMultiplier), pct: 100, color: "bg-primary", textColor: "text-primary", label: "Strong" },
  ];

  const conversionGoalsForObjective = useMemo(() => {
    if (isApp) {
      return CONVERSION_GOALS.filter((g) => g.value === "APP_INSTALL" || g.value === "IN_APP_PURCHASE");
    }
    return CONVERSION_GOALS.filter(
      (g) => g.value === "PURCHASE" || g.value === "BEGIN_CHECKOUT" || g.value === "ADD_TO_CART"
    );
  }, [isApp]);
  const defaultConversionGoal: ConversionGoal = isApp ? "APP_INSTALL" : "PURCHASE";

  useEffect(() => {
    const isValid = conversionGoalsForObjective.some((g) => g.value === budget.conversionGoal);
    if (!isValid) {
      updateNested("budget", { conversionGoal: defaultConversionGoal });
    }
  }, [budget.conversionGoal, conversionGoalsForObjective, defaultConversionGoal, updateNested]);

  const effectiveBiddingStrategy: BiddingStrategy =
    isPMax && budget.biddingStrategy === "TARGET_CPA"
      ? "MAXIMIZE_CONVERSIONS"
      : isPMax && budget.biddingStrategy === "TARGET_ROAS"
        ? "MAXIMIZE_CONVERSION_VALUE"
        : budget.biddingStrategy;

  /* Filter bidding strategies by objective */
  const availableStrategies = BIDDING_STRATEGIES.filter(
    (s) =>
      s.supportedObjectives.includes(campaign.objective.objective) &&
      (!isPMax || s.value === "MAXIMIZE_CONVERSIONS" || s.value === "MAXIMIZE_CONVERSION_VALUE")
  );
  const activeStrategy = availableStrategies.find((s) => s.value === effectiveBiddingStrategy) ?? availableStrategies[0];
  const getRecommendedStrategyForGoal = (goal: ConversionGoal): BiddingStrategy => {
    const preferred: BiddingStrategy =
      goal === "PURCHASE" || goal === "IN_APP_PURCHASE"
        ? "MAXIMIZE_CONVERSION_VALUE"
        : "MAXIMIZE_CONVERSIONS";
    return availableStrategies.some((s) => s.value === preferred) ? preferred : "MAXIMIZE_CONVERSIONS";
  };

  const googleBidInputs: BidInput[] = [
    ...(activeStrategy?.showTargetCpa &&
    (effectiveBiddingStrategy === "MAXIMIZE_CONVERSIONS" || effectiveBiddingStrategy === "TARGET_CPA")
      ? [
          {
            label: `Target Cost per Purchase (CPA) ${effectiveBiddingStrategy === "MAXIMIZE_CONVERSIONS" ? "(Optional)" : "(Required)"}`,
            desc:
              effectiveBiddingStrategy === "MAXIMIZE_CONVERSIONS"
                ? "Leave empty to let Google optimize freely, or set a target to control costs. Setting a target may limit volume."
                : "Set your target cost per acquisition. Google will optimize bids to meet this target on average.",
            value: budget.targetCpa || undefined,
            onChange: (v: number) => updateNested("budget", { targetCpa: Math.max(0, v) }),
            suggestedRange: isPMax ? undefined : suggestedBid,
            prefix: "SAR",
            min: 0.01,
            step: 1,
            tip: "Start without CPA for initial learning, then add a target once data is stable.",
          },
        ]
      : []),
    ...(activeStrategy?.showTargetRoas &&
    (effectiveBiddingStrategy === "MAXIMIZE_CONVERSION_VALUE" || effectiveBiddingStrategy === "TARGET_ROAS")
      ? [
          {
            label: `Target ROAS ${effectiveBiddingStrategy === "MAXIMIZE_CONVERSION_VALUE" ? "(Optional)" : "(Required)"}`,
            desc:
              effectiveBiddingStrategy === "MAXIMIZE_CONVERSION_VALUE"
                ? "Leave empty to maximize total revenue, or set a target ROAS to balance volume and profitability."
                : "Set your target return on ad spend. Google will optimize bids to achieve this ROAS.",
            value: budget.targetRoas || 400,
            onChange: (v: number) => updateNested("budget", { targetRoas: Math.max(0, v) }),
            suffix: "%",
            min: 100,
            step: 50,
            tip: "Recommended: 200%-500%. Very high ROAS targets can reduce delivery.",
          },
        ]
      : []),
    ...(effectiveBiddingStrategy === "MANUAL_CPC"
      ? [
          {
            label: "Default Max CPC Bid",
            desc: "Set the maximum you're willing to pay per click. Individual product group bids can be set in the Product Groups step.",
            value: budget.maxCpcBid || undefined,
            onChange: (v: number) => updateNested("budget", { maxCpcBid: Math.max(0, v) }),
            suggestedRange: { min: 0.5, max: 3 },
            prefix: "SAR",
            min: 0.01,
            step: 0.5,
            tip: "Manual CPC gives full control but requires regular bid adjustments. For most merchants, Maximize Conversion Value with Target ROAS delivers better results with less effort.",
          },
        ]
      : []),
    ...(effectiveBiddingStrategy === "TARGET_CPC"
      ? [
          {
            label: "Target CPC",
            desc: "Set the average click cost you want Google to maintain.",
            value: budget.targetCpc || undefined,
            onChange: (v: number) => updateNested("budget", { targetCpc: Math.max(0, v) }),
            suggestedRange: { min: 0.5, max: 8 },
            prefix: "SAR",
            min: 0.01,
            step: 0.5,
            tip: "Good for Demand Gen when your immediate goal is qualified traffic, not direct conversions.",
          },
        ]
      : []),
  ];

  const estimatedResultLabelByGoal: Record<ConversionGoal, string> = {
    PURCHASE: "Daily purchases",
    BEGIN_CHECKOUT: "Daily checkout starts",
    ADD_TO_CART: "Daily add-to-carts",
    PAGE_VIEW: "Daily product views",
    LEAD: "Daily leads",
    SIGN_UP: "Daily sign-ups",
    CONTACT: "Daily contacts",
    APP_INSTALL: "Daily installs",
    IN_APP_PURCHASE: "Daily in-app purchases",
  };

  /* Mock estimates */
  const totalBudget = dailyAmount * durationDays;

  const estConvLow = Math.max(1, Math.round(dailyAmount / (budget.targetCpa || 50)));
  const estConvHigh = Math.round(estConvLow * 2.5);

  const hasStartDate = Boolean(budget.startDate);
  const hasEndDate = budget.endDateOptional ? true : Boolean(budget.endDate);
  const hasValidDateOrder =
    !budget.startDate || !budget.endDate ? true : budget.endDate > budget.startDate;
  const hasMinimumLearningWindow =
    budget.endDateOptional || (hasStartDate && hasEndDate && hasValidDateOrder && durationDays >= 7);
  const prepaidDateReady =
    budget.paymentMethod !== "prepaid" || (!budget.endDateOptional && Boolean(budget.endDate));

  const baseBudgetOk =
    isDemandGen && budget.demandGenBudgetMode === "TOTAL"
      ? budget.demandGenTotalAmount >= 500
      : dailyAmount >= 50;
  const dateSetupOk = hasStartDate && hasEndDate && hasValidDateOrder && hasMinimumLearningWindow;
  const canProceed = baseBudgetOk && dateSetupOk && prepaidDateReady && !aiMaxCompatibilityError;

  const budgetNextLabel = "Next";

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
            onPaymentMethodChange={(v) => updateNested("budget", { paymentMethod: v as PaymentMethod })}
            showLifetimeToggle={false}
            budgetMode="daily"
            amount={budget.amount}
            onAmountChange={(v) => updateNested("budget", { amount: v })}
            suggestedDaily={suggestedDaily}
            goalLabel={isPMax ? "Performance Max" : objConfig.label}
            platformName="Google"
            strengthTiers={strengthTiers}
            startDate={budget.startDate}
            endDate={budget.endDate}
            endDateOptional={budget.endDateOptional}
            onStartDateChange={(d) => updateNested("budget", { startDate: d })}
            onEndDateChange={(d) => updateNested("budget", { endDate: d })}
            showRunContinuously={true}
            endDateRequired={endDateRequired}
            showAutoIncrease={!isPMax}
            autoIncrease={autoIncrease}
            onAutoIncreaseChange={(ai) => updateNested("budget", { autoIncrease: ai })}
            onBulkUpdate={(updates) => updateNested("budget", updates)}
            showSmartStart={true}
          />

          {/* Launch time window (v23) intentionally hidden in UI.
              Backend can manage precise start/end times while advertisers set only dates. */}

          {isDemandGen && (
            <SectionCard>
              <div className="mb-2 flex items-center gap-2">
                <Gauge className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Demand Gen budget mode</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">v23</Badge>
                <InfoTip text="Demand Gen can run on daily budget or campaign total budget (CUSTOM period)." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Use daily budget for always-on campaigns. Use total budget only when you have a fixed campaign window and spend cap.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(["DAILY", "TOTAL"] as const).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => updateNested("budget", { demandGenBudgetMode: mode })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      budget.demandGenBudgetMode === mode
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    )}
                  >
                    {mode === "DAILY" ? "Daily budget" : "Total campaign budget"}
                  </button>
                ))}
              </div>
              {budget.demandGenBudgetMode === "TOTAL" && (
                <div className="mt-3">
                  <Label className="mb-1.5 block text-xs font-medium text-foreground">Total budget (SAR)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={budget.demandGenTotalAmount}
                    onChange={(e) =>
                      updateNested("budget", { demandGenTotalAmount: Math.max(0, Number(e.target.value || 0)) })
                    }
                    className="h-9 text-xs"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Recommended minimum for stable learning: 500 SAR total.
                  </p>
                </div>
              )}
            </SectionCard>
          )}


          {/* ======================================================= */}
          {/* SECTION 2: Conversion Goal                               */}
          {/* ======================================================= */}
          <ConversionEventCard
            title="Conversion Goal"
            events={conversionGoalsForObjective}
            selectedEvent={budget.conversionGoal}
            onEventChange={(v) => {
              const goal = v as ConversionGoal;
              const recommendedStrategy = getRecommendedStrategyForGoal(goal);
              updateNested("budget", {
                conversionGoal: goal,
                biddingStrategy: recommendedStrategy,
                ...(recommendedStrategy === "MAXIMIZE_CONVERSIONS" && budget.targetCpa <= 0
                  ? { targetCpa: 25 }
                  : {}),
                ...(recommendedStrategy === "MAXIMIZE_CONVERSION_VALUE" && budget.targetRoas <= 0
                  ? { targetRoas: 400 }
                  : {}),
              });
            }}
            infoTipText="The action you want customers to take. Purchase is recommended for e-commerce. Use Add to Cart if you have fewer than 30 purchases per month."
            tip={
              isApp
                ? "We auto-align bid strategy to your selected goal. Start with App Install, then move to In-App Purchase."
                : "We auto-align bid strategy to your selected goal. Start with Purchase, or use mid-funnel goals when volume is low."
            }
          />

          {/* ======================================================= */}
          {/* SECTION 3: Bidding Strategy (shared card)                */}
          {/* ======================================================= */}
          <BidStrategyCard
            strategies={availableStrategies}
            selectedStrategy={effectiveBiddingStrategy}
            onStrategyChange={(v) => {
              updateNested("budget", {
                biddingStrategy: v as BiddingStrategy,
                ...(v === "TARGET_CPA" && { targetCpa: budget.targetCpa || 25 }),
                ...(v === "TARGET_CPC" && { targetCpc: budget.targetCpc || 2 }),
                ...(v === "TARGET_ROAS" && { targetRoas: budget.targetRoas || 400 }),
              });
            }}
            billingContext={[
              {
                label: "Billing model",
                value:
                  effectiveBiddingStrategy === "MANUAL_CPC"
                    ? "Manual CPC"
                    : effectiveBiddingStrategy === "TARGET_CPC"
                      ? "Smart Bidding (CPC)"
                    : effectiveBiddingStrategy === "MAXIMIZE_CONVERSIONS" || effectiveBiddingStrategy === "TARGET_CPA"
                      ? "Smart Bidding (CPA)"
                      : "Smart Bidding (ROAS)",
              },
            ]}
            layout={isPMax ? "buttons" : "cards"}
            infoTipText={
              isPMax
                ? "PMax uses two core strategies: Maximize Conversions or Maximize Conversion Value. Optional CPA/ROAS targets can guide delivery."
                : isShopping
                  ? "Shopping supports Smart Bidding (recommended) or Manual CPC. Use Manual CPC for precise per-product-group control; use Smart Bidding to let Google optimize bids automatically."
                  : "Choose how Google should bid in the ad auction. Each strategy optimizes for different outcomes."
            }
            bidInputs={googleBidInputs}
          >

            {isDemandGen && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Salla Tip for Demand Gen:</span>{" "}
                  Google recommends a daily budget of at least <strong>15x your expected CPA</strong>. Start with <strong>Maximize Conversions</strong> to build data, then switch to <strong>Target CPA</strong> once you have 50+ conversions in 30 days.
                </p>
              </div>
            )}

            {isShopping && effectiveBiddingStrategy !== "MANUAL_CPC" && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Shopping bidding guide:</span>{" "}
                  Start with <strong>Manual CPC</strong> if you have fewer than 30 conversions/month for precise bid control per product group. Switch to <strong>Target ROAS</strong> once you have 50+ monthly conversions. Most Salla stores see best results with Target ROAS at 300-500%.
                </p>
              </div>
            )}

            {isSearch && (
              <div className="mt-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <div>
                    <p className="text-[11px] font-semibold text-primary">Search bidding guide for e-commerce</p>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[10px] text-muted-foreground"><strong>New store (&lt;50 conversions/month):</strong> Start with Maximize Clicks to build traffic data, then switch to Maximize Conversions.</p>
                      <p className="text-[10px] text-muted-foreground"><strong>Growing store (50-200 conversions):</strong> Use Maximize Conversions. Optionally add a Target CPA once your CPA stabilizes over 2-3 weeks.</p>
                      <p className="text-[10px] text-muted-foreground"><strong>Established store (200+ conversions):</strong> Use Target ROAS or Maximize Conversion Value for maximum revenue efficiency.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(budget.biddingStrategy === "TARGET_CPA" || budget.biddingStrategy === "TARGET_ROAS" || budget.biddingStrategy === "MAXIMIZE_CONVERSION_VALUE") && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Learning period required</p>
                    <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                      {budget.biddingStrategy === "TARGET_ROAS"
                        ? "Target ROAS needs 50+ conversions per month to optimize effectively. We recommend starting with Maximize Conversions until you have enough data, then switching to Target ROAS."
                        : budget.biddingStrategy === "TARGET_CPA"
                        ? "Target CPA needs 30+ conversions per month to optimize. Start without a target CPA to let Google learn, then add a target once your CPA stabilizes."
                        : "Maximize Conversion Value works best with 50+ conversions per month. Consider starting with Maximize Conversions if your store is new."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Sparkles className="size-3 text-amber-600" />
                      <p className="text-[10px] font-medium text-amber-700">
                        Salla Tip: Most stores need 2-4 weeks of data collection before smart bidding stabilizes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </BidStrategyCard>

          {/* ======================================================= */}
          {/* PERFORMANCE BOOST (Salla Upsell)                         */}
          {/* ======================================================= */}
          <PerformanceBoostCard
            enabled={budget.performanceBoost}
            onToggle={(checked) => updateNested("budget", { performanceBoost: checked })}
          />

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
              totalBudgetLabel={budget.endDateOptional ? "Projected ad spend (next 14 days)" : "Ad spend"}
              autoIncreaseEnabled={!isPMax && autoIncrease.enabled}
              boostEnabled={budget.performanceBoost}
              boostAmount={149}
              startDate={budget.startDate}
              endDate={budget.endDate}
            />

            {/* Estimated Results (shared) */}
            <EstimatedResultsCard
              badge={isPMax ? "Directional prototype" : "Predicted"}
              rows={[
                { label: estimatedResultLabelByGoal[budget.conversionGoal], value: `${estConvLow} - ${estConvHigh}` },
                { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
              ]}
              disclaimer="Directional prototype estimates, not a live Google forecast. Actual results vary by creative quality, competition, and conversion setup."
            />

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Budget type", value: BUDGET_TYPES.find((m) => m.value === budget.paymentMethod)?.label ?? "-" },
                { label: "End date", value: budget.endDateOptional ? "Continuous" : budget.endDate || "Not set" },
                { label: "Bid strategy", value: activeStrategy?.label ?? effectiveBiddingStrategy },
                { label: "Conversion goal", value: CONVERSION_GOALS.find((g) => g.value === budget.conversionGoal)?.label ?? "Purchase" },
                ...(!isPMax && autoIncrease.enabled ? [{ label: "Auto-increase", value: `+${autoIncrease.pct}% / ${autoIncrease.intervalDays}d` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: dailyAmount >= 50 ? "ok" as const : "warning" as const, text: dailyAmount >= 50 ? "Budget is healthy" : "Below recommended minimum" },
                {
                  label: "Dates",
                  status: dateSetupOk ? "ok" as const : "warning" as const,
                  text: dateSetupOk
                    ? budget.endDateOptional
                      ? "Start date set (continuous run)"
                      : "Valid start/end date range"
                    : "Set valid start/end dates (min 7 days for fixed runs)",
                },
                {
                  label: "Duration",
                  status: hasMinimumLearningWindow ? "ok" as const : "warning" as const,
                  text: hasMinimumLearningWindow ? "Sufficient learning time" : "Too short for optimization",
                },
                { label: "Bid strategy", status: "ok" as const, text: activeStrategy?.label ?? effectiveBiddingStrategy },
                { label: "Conversion goal", status: "ok" as const, text: CONVERSION_GOALS.find((g) => g.value === budget.conversionGoal)?.label ?? "Purchase" },
                ...(isPMax && effectiveBiddingStrategy === "MAXIMIZE_CONVERSION_VALUE"
                  ? [{
                      label: "Value tracking",
                      status: "warning" as const,
                      text: "Ensure conversion values are tracked accurately for value bidding.",
                    }]
                  : []),
                ...(isPMax ? [{ label: "URL expansion", status: (!budget.urlExpansionOptOut ? "ok" as const : "warning" as const), text: budget.urlExpansionOptOut ? "Off (limited)" : "On (recommended)" }] : []),
              ]}
            />
            <p className="px-1 text-[10px] text-muted-foreground">
              Configuration and readiness checks are internal UI checks, not live Google API validation.
            </p>

          </div>
        </div>
      </div>
      <WizardStepFooter
        onPrevious={() => setStep(1)}
        onNext={() => setStep(3)}
        previousLabel="Back"
        nextLabel={budgetNextLabel}
        nextDisabled={!canProceed}
        accent="primary"
      />
    </TooltipProvider>
  );
}
