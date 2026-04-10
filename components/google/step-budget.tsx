"use client";

import { useEffect, useMemo, useState } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/google/campaign-types";
import { generateBudgetRecommendation, getStoreSnapshot, type BudgetRecommendation } from "@/lib/google/search-ai-generator";
import type { BiddingStrategy, ConversionGoal, PaymentMethod, AssetAutomationType, AssetAutomationStatus, AssetAutomationEntry } from "@/lib/google/campaign-types";
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
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
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
  ChevronDown,
  ChevronRight,
  Sparkles,
  Settings2,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Link2,
  Globe,
  Shield,
  CheckCircle2,
  Receipt,
  Smartphone,
  X,
  Plus,
  Bot,
  Brain,
  ImagePlus,
  Video,
  FileText,
  AlertTriangle,
  Type,
  Clock3,
  MousePointerClick,
} from "lucide-react";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { AdSchedulingCard } from "@/components/shared/ad-scheduling-card";
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

function SectionPriorityHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">
          {step}
        </Badge>
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showScheduling, setShowScheduling] = useState(budget.schedule === "custom");
  const [newBrandIncl, setNewBrandIncl] = useState("");
  const [newBrandExcl, setNewBrandExcl] = useState("");
  const [newUrlIncl, setNewUrlIncl] = useState("");
  const [termExclusionInput, setTermExclusionInput] = useState("");
  const [messagingRestrictionInput, setMessagingRestrictionInput] = useState("");
  const [showPmaxAutomationDetails, setShowPmaxAutomationDetails] = useState(false);
  const [pmaxAutomationMode, setPmaxAutomationMode] = useState<"RECOMMENDED" | "CONSERVATIVE" | "MANUAL">(() => {
    if (!isPMax) return "RECOMMENDED";
    const defaults: AssetAutomationType[] = [
      "TEXT_ASSET_AUTOMATION",
      "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION",
      "GENERATE_IMAGE_EXTRACTION",
      "GENERATE_IMAGE_ENHANCEMENT",
      "GENERATE_ENHANCED_YOUTUBE_VIDEOS",
    ];
    const onCount = defaults.filter((type) => {
      const entry = budget.assetAutomationSettings.find((e: AssetAutomationEntry) => e.type === type);
      return (entry?.status ?? "OPTED_IN") === "OPTED_IN";
    }).length;
    if (onCount === defaults.length) return "RECOMMENDED";
    return "MANUAL";
  });

  const endDateRequired = budget.paymentMethod === "prepaid";
  const hasCustomSearchSchedule = isSearch && aud.adScheduleEntries.length > 0;
  const scheduleSummaryLabel = isSearch
    ? hasCustomSearchSchedule
      ? "Custom hours"
      : "24/7"
    : showScheduling
      ? "Custom hours"
      : "24/7";
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
          <SectionPriorityHeader
            step="1"
            title="Campaign budget setup (required)"
            description="Set daily budget, run dates, and base campaign spend controls first."
          />

          {/* Smart Budget Recommendation from Store Data */}
          {budgetRec && (
            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.03] to-primary/[0.06] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="size-4.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">Smart Budget Recommendation</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px]">{budgetRec.storeMaturity === "new" ? "New Store" : budgetRec.storeMaturity === "growing" ? "Growing Store" : "Established Store"}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{budgetRec.reasoning}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                    onClick={() => {
                      updateNested("budget", { amount: budgetRec.dailyBudget, biddingStrategy: budgetRec.biddingStrategy as BiddingStrategy });
                    }}
                  >
                    Apply: SAR {budgetRec.dailyBudget}/day + {budgetRec.biddingStrategy === "TARGET_SPEND" ? "Maximize Clicks" : budgetRec.biddingStrategy === "MAXIMIZE_CONVERSIONS" ? "Maximize Conversions" : "Target ROAS"}
                  </button>
                </div>
              </div>
            </div>
          )}

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

          <SectionPriorityHeader
            step="2"
            title="Optimization target (required)"
            description="Tell Google what to optimize for, then choose bidding strategy."
          />

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

          <SectionPriorityHeader
            step="3"
            title="Performance controls (recommended)"
            description="Use objective-specific optimizations to improve delivery quality and scaling."
          />

          {/* ======================================================= */}
          {/* SECTION 4: PMax Settings (URL expansion, Brand)          */}
          {/* ======================================================= */}
          {isPMax && (
            <SectionCard>
              <div className="mb-1 flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Performance Max Optimization</Label>
                <InfoTip text="Core PMax controls that impact delivery and asset generation. Keep defaults unless you have a clear reason to restrict behavior." />
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Keep this section simple: set URL behavior, brand usage, and automation level.
              </p>

              {/* URL Expansion */}
              <div className="mb-3 flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-3">
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    !budget.urlExpansionOptOut ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Link2 className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Final URL Expansion</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      Allow Google to send traffic to better-matching pages on your site.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={!budget.urlExpansionOptOut}
                  onCheckedChange={(checked) => updateNested("budget", { urlExpansionOptOut: !checked })}
                />
              </div>

              {!budget.urlExpansionOptOut && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-relaxed text-emerald-700">
                    Recommended for most stores to help Google find better converting landing pages.
                  </p>
                </div>
              )}

              {budget.urlExpansionOptOut && (
                <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                  URL expansion is off. Delivery is limited to your explicit final URLs.
                </p>
              )}

              {/* Brand Guidelines */}
              <div className="mb-3 flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-3">
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    budget.brandGuidelinesEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Shield className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Brand Guidelines</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                      Let Google use your brand assets when generating creative variations.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={budget.brandGuidelinesEnabled}
                  onCheckedChange={(checked) => updateNested("budget", { brandGuidelinesEnabled: checked })}
                />
              </div>
              <p className="mb-3 text-[10px] text-muted-foreground">
                Important: Google may enforce brand guidelines behavior for PMax based on campaign lifecycle. Treat this as a long-term setting and confirm backend handling before launch.
              </p>

              {(() => {
                const PMAX_AUTOMATION_TYPES: { type: AssetAutomationType; label: string; desc: string; icon: React.ReactNode }[] = [
                  { type: "TEXT_ASSET_AUTOMATION", label: "Text", desc: "Auto-generate ad text", icon: <Type className="size-3.5" /> },
                  { type: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", label: "Final URL text", desc: "Generate text for expanded URLs", icon: <FileText className="size-3.5" /> },
                  { type: "GENERATE_IMAGE_EXTRACTION", label: "Image extraction", desc: "Pull relevant images from pages", icon: <ImagePlus className="size-3.5" /> },
                  { type: "GENERATE_IMAGE_ENHANCEMENT", label: "Image enhancement", desc: "Enhance uploaded images", icon: <ImagePlus className="size-3.5" /> },
                  { type: "GENERATE_ENHANCED_YOUTUBE_VIDEOS", label: "Video enhancement", desc: "Create placement-ready video variations", icon: <Video className="size-3.5" /> },
                ];

                const getStatus = (type: AssetAutomationType): AssetAutomationStatus => {
                  const entry = budget.assetAutomationSettings.find((e: AssetAutomationEntry) => e.type === type);
                  return entry?.status ?? "OPTED_IN";
                };

                const setPreset = (mode: "RECOMMENDED" | "CONSERVATIVE" | "MANUAL") => {
                  setPmaxAutomationMode(mode);
                  if (mode === "MANUAL") return;
                  const statuses: Record<AssetAutomationType, AssetAutomationStatus> = {
                    TEXT_ASSET_AUTOMATION: "OPTED_IN",
                    FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION: "OPTED_IN",
                    GENERATE_IMAGE_EXTRACTION: mode === "CONSERVATIVE" ? "OPTED_OUT" : "OPTED_IN",
                    GENERATE_IMAGE_ENHANCEMENT: "OPTED_IN",
                    GENERATE_ENHANCED_YOUTUBE_VIDEOS: mode === "CONSERVATIVE" ? "OPTED_OUT" : "OPTED_IN",
                  };
                  updateNested("budget", {
                    assetAutomationSettings: PMAX_AUTOMATION_TYPES.map((item) => ({
                      type: item.type,
                      status: statuses[item.type],
                    })),
                  });
                };

                const toggleAutomation = (type: AssetAutomationType) => {
                  const current = getStatus(type);
                  const next: AssetAutomationStatus = current === "OPTED_IN" ? "OPTED_OUT" : "OPTED_IN";
                  const existing = budget.assetAutomationSettings.filter((e: AssetAutomationEntry) => e.type !== type);
                  setPmaxAutomationMode("MANUAL");
                  updateNested("budget", { assetAutomationSettings: [...existing, { type, status: next }] });
                };

                const onCount = PMAX_AUTOMATION_TYPES.filter((item) => getStatus(item.type) === "OPTED_IN").length;
                const modeExplainer =
                  pmaxAutomationMode === "RECOMMENDED"
                    ? "Best for most stores: full automation to test more combinations and usually scale faster."
                    : pmaxAutomationMode === "CONSERVATIVE"
                      ? "More control: keeps core automation on while limiting aggressive creative expansion."
                      : "Advanced mode: you control each automation toggle manually.";

                return (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs font-semibold text-foreground">AI Automation Mode</Label>
                        <InfoTip text="Preset modes apply recommended automation combinations. You can switch to Custom settings any time." />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{onCount}/{PMAX_AUTOMATION_TYPES.length} on</span>
                    </div>
                    <div className="mb-2 grid grid-cols-3 gap-2">
                      {([
                        { value: "RECOMMENDED" as const, label: "Best performance", sub: "Recommended" },
                        { value: "CONSERVATIVE" as const, label: "More control", sub: "Less automation" },
                        { value: "MANUAL" as const, label: "Custom settings", sub: "Advanced" },
                      ]).map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setPreset(mode.value)}
                          className={cn(
                            "rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors",
                            pmaxAutomationMode === mode.value
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-background text-foreground hover:border-primary/40"
                          )}
                        >
                          <span className="block text-[10px] font-semibold">{mode.label}</span>
                          <span className="block text-[9px] text-muted-foreground">{mode.sub}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      {pmaxAutomationMode === "RECOMMENDED" && (
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px]">Most stores should start here</Badge>
                      )}
                      <p className="text-[10px] text-muted-foreground">{modeExplainer}</p>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">URL: {!budget.urlExpansionOptOut ? "On" : "Off"}</Badge>
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">Brand: {budget.brandGuidelinesEnabled ? "On" : "Off"}</Badge>
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px]">Automation: {onCount}/5 On</Badge>
                    </div>
                    <p className="mb-2 text-[10px] text-muted-foreground">
                      These settings are optional. Start with Best performance, then customize only if you need stricter brand control.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPmaxAutomationDetails((v) => !v)}
                      className="text-[11px] font-medium text-primary underline"
                    >
                      {showPmaxAutomationDetails ? "Hide manual customization" : "Customize automation details"}
                    </button>
                    {showPmaxAutomationDetails && (
                      <div className="mt-2 flex flex-col gap-2">
                        {PMAX_AUTOMATION_TYPES.map((item) => {
                          const isOn = getStatus(item.type) === "OPTED_IN";
                          return (
                            <div key={item.type} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", isOn ? "border-primary/20 bg-primary/[0.03]" : "border-border bg-background")}>
                              <div className={cn("flex size-6 shrink-0 items-center justify-center rounded", isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                {item.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground">{item.label}</p>
                                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                              </div>
                              <Switch checked={isOn} onCheckedChange={() => toggleAutomation(item.type)} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </SectionCard>
          )}

          {/* ======================================================= */}
          {/* AI ASSET AUTOMATION (PMax + Search)                      */}
          {/* ======================================================= */}
          {isSearch && (() => {
            const SEARCH_AUTOMATION_TYPES: { type: AssetAutomationType; label: string; desc: string; icon: React.ReactNode }[] = [
              { type: "TEXT_ASSET_AUTOMATION", label: "Text Asset Automation", desc: "Let Google AI create additional headline and description variations from your landing page content.", icon: <Type className="size-3.5" /> },
              { type: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", label: "Final URL Text Automation", desc: "Generate text assets optimized for expanded landing page destinations.", icon: <FileText className="size-3.5" /> },
              { type: "GENERATE_IMAGE_ENHANCEMENT", label: "Image Enhancement", desc: "AI-enhance images used in search ad extensions for better visual quality.", icon: <ImagePlus className="size-3.5" /> },
            ];
            const automationTypes = SEARCH_AUTOMATION_TYPES;
            const getStatus = (type: AssetAutomationType): AssetAutomationStatus => {
              const entry = budget.assetAutomationSettings.find((e: AssetAutomationEntry) => e.type === type);
              return entry?.status ?? "OPTED_IN";
            };
            const toggleAutomation = (type: AssetAutomationType) => {
              const current = getStatus(type);
              const next: AssetAutomationStatus = current === "OPTED_IN" ? "OPTED_OUT" : "OPTED_IN";
              const existing = budget.assetAutomationSettings.filter((e: AssetAutomationEntry) => e.type !== type);
              updateNested("budget", { assetAutomationSettings: [...existing, { type, status: next }] });
            };

            return (
              <SectionCard className="border-primary/20 bg-primary/[0.02]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <Brain className="size-4 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">AI Asset Automation</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Control how Google AI generates and enhances your search assets.
                    </p>
                  </div>
                  <InfoTip text="Maps to Campaign.asset_automation_settings in the Google Ads API. Each setting can be OPTED_IN or OPTED_OUT. When opted in, Google AI will automatically create or enhance the corresponding asset type." />
                </div>

                <div className="flex flex-col gap-2">
                  {automationTypes.map((item) => {
                    const isOn = getStatus(item.type) === "OPTED_IN";
                    return (
                      <div key={item.type} className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all", isOn ? "border-primary/30 bg-primary/[0.03]" : "border-border bg-background")}>
                        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch checked={isOn} onCheckedChange={() => toggleAutomation(item.type)} />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-lg bg-primary/[0.05] px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold text-primary">Recommendation:</span> Keep all automation enabled for best performance. Google AI tests thousands of asset combinations to find what converts best for your audience.
                  </p>
                </div>
                {aiMaxCompatibilityError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    <p className="text-[10px] text-amber-700">
                      FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION requires AI Max in Search campaigns.
                    </p>
                  </div>
                )}
              </SectionCard>
            );
          })()}

          {(isPMax || isSearch) && (
            <SectionCard>
              <div className="mb-2 flex items-center gap-2">
                <Type className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Text guidelines</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">v23</Badge>
                <InfoTip text="Maps to Campaign.text_guidelines term exclusions and messaging restrictions." />
              </div>
              <div className="mb-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Use this to guide AI-written copy. Add a few brand safety rules only.
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Term exclusions:</span> blocked words.
                  {" "}
                  <span className="font-semibold text-foreground">Messaging restrictions:</span> tone/claims rules.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-foreground">Term exclusions</Label>
                  <div className="flex gap-2">
                    <Input
                      value={termExclusionInput}
                      onChange={(e) => setTermExclusionInput(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="e.g. free"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const value = termExclusionInput.trim();
                        if (!value || budget.textGuidelines.termExclusions.includes(value)) return;
                        updateNested("budget", {
                          textGuidelines: {
                            ...budget.textGuidelines,
                            termExclusions: [...budget.textGuidelines.termExclusions, value],
                          },
                        });
                        setTermExclusionInput("");
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px]"
                      onClick={() => {
                        const value = termExclusionInput.trim();
                        if (!value || budget.textGuidelines.termExclusions.includes(value)) return;
                        updateNested("budget", {
                          textGuidelines: {
                            ...budget.textGuidelines,
                            termExclusions: [...budget.textGuidelines.termExclusions, value],
                          },
                        });
                        setTermExclusionInput("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {["free", "cheap", "guaranteed", "best", "100%"].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          if (budget.textGuidelines.termExclusions.includes(example)) return;
                          updateNested("budget", {
                            textGuidelines: {
                              ...budget.textGuidelines,
                              termExclusions: [...budget.textGuidelines.termExclusions, example],
                            },
                          });
                        }}
                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        + {example}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {budget.textGuidelines.termExclusions.map((term, idx) => (
                      <Badge key={`${term}-${idx}`} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                        {term}
                        <button
                          type="button"
                          onClick={() =>
                            updateNested("budget", {
                              textGuidelines: {
                                ...budget.textGuidelines,
                                termExclusions: budget.textGuidelines.termExclusions.filter((_, i) => i !== idx),
                              },
                            })
                          }
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-foreground">Messaging restrictions</Label>
                  <div className="flex gap-2">
                    <Input
                      value={messagingRestrictionInput}
                      onChange={(e) => setMessagingRestrictionInput(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="e.g. avoid superlatives"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const value = messagingRestrictionInput.trim();
                        if (!value || budget.textGuidelines.messagingRestrictions.includes(value)) return;
                        updateNested("budget", {
                          textGuidelines: {
                            ...budget.textGuidelines,
                            messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, value],
                          },
                        });
                        setMessagingRestrictionInput("");
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[10px]"
                      onClick={() => {
                        const value = messagingRestrictionInput.trim();
                        if (!value || budget.textGuidelines.messagingRestrictions.includes(value)) return;
                        updateNested("budget", {
                          textGuidelines: {
                            ...budget.textGuidelines,
                            messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, value],
                          },
                        });
                        setMessagingRestrictionInput("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {[
                      "avoid superlatives",
                      "no medical claims",
                      "no price guarantees",
                      "keep tone professional",
                    ].map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => {
                          if (budget.textGuidelines.messagingRestrictions.includes(example)) return;
                          updateNested("budget", {
                            textGuidelines: {
                              ...budget.textGuidelines,
                              messagingRestrictions: [...budget.textGuidelines.messagingRestrictions, example],
                            },
                          });
                        }}
                        className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      >
                        + {example}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {budget.textGuidelines.messagingRestrictions.map((rule, idx) => (
                      <Badge key={`${rule}-${idx}`} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                        {rule}
                        <button
                          type="button"
                          onClick={() =>
                            updateNested("budget", {
                              textGuidelines: {
                                ...budget.textGuidelines,
                                messagingRestrictions: budget.textGuidelines.messagingRestrictions.filter((_, i) => i !== idx),
                              },
                            })
                          }
                        >
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ======================================================= */}
          {/* PERFORMANCE BOOST (Salla Upsell)                         */}
          {/* ======================================================= */}
          <PerformanceBoostCard
            enabled={budget.performanceBoost}
            onToggle={(checked) => updateNested("budget", { performanceBoost: checked })}
          />

          {/* ======================================================= */}
          {/* AI Max for Search (promoted to main flow)                 */}
          {/* ======================================================= */}
          {isSearch && (() => {
            const aiMax = budget.aiMaxSettings;

            const updateAiMax = (patch: Partial<typeof aiMax>) =>
              updateNested("budget", { aiMaxSettings: { ...aiMax, ...patch } });

            const addTag = (
              field: "brandInclusions" | "brandExclusions" | "urlInclusions",
              value: string,
              setter: (v: string) => void
            ) => {
              const trimmed = value.trim();
              if (!trimmed || aiMax[field].includes(trimmed)) return;
              updateAiMax({ [field]: [...aiMax[field], trimmed] });
              setter("");
            };
            const removeTag = (
              field: "brandInclusions" | "brandExclusions" | "urlInclusions",
              idx: number
            ) => {
              updateAiMax({ [field]: aiMax[field].filter((_: string, i: number) => i !== idx) });
            };

            return (
              <SectionCard
                className={aiMax.enableAiMax ? "border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10" : ""}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl",
                      aiMax.enableAiMax ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                    )}
                  >
                    <Bot className={cn("size-5", aiMax.enableAiMax ? "text-amber-600" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-foreground">AI Max for Search</Label>
                      <Badge className="rounded-full border-0 bg-green-100 px-1.5 py-0 text-[9px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        Recommended by Google
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Google&apos;s AI enhancement that automatically expands your keyword reach, generates ad copy variations, and routes users to the best landing page. Average improvement: 14% more conversions at similar cost.
                    </p>
                  </div>
                  <Switch
                    checked={aiMax.enableAiMax}
                    onCheckedChange={(checked) => updateAiMax({ enableAiMax: checked })}
                  />
                </div>

                {!aiMax.enableAiMax && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-[11px] text-muted-foreground">
                      When enabled, AI Max adds three powerful capabilities:
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <div className="rounded-md bg-background p-2 text-center">
                        <p className="text-[10px] font-medium">Keyword Expansion</p>
                        <p className="text-[9px] text-muted-foreground">Finds searches beyond your keywords</p>
                      </div>
                      <div className="rounded-md bg-background p-2 text-center">
                        <p className="text-[10px] font-medium">Text Customization</p>
                        <p className="text-[9px] text-muted-foreground">Auto-writes ad copy per query</p>
                      </div>
                      <div className="rounded-md bg-background p-2 text-center">
                        <p className="text-[10px] font-medium">URL Expansion</p>
                        <p className="text-[9px] text-muted-foreground">Sends users to best page</p>
                      </div>
                    </div>
                  </div>
                )}

                {aiMax.enableAiMax && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-2 rounded-lg border border-green-300/50 bg-green-50 px-3 py-2 dark:border-green-800/50 dark:bg-green-950/20">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-green-600" />
                      <p className="text-[10px] leading-relaxed text-green-800 dark:text-green-300">
                        AI Max is active. Use the controls below to set brand boundaries and URL restrictions.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Keyword Expansion", desc: "AI finds new search terms beyond your keywords" },
                        { label: "Text Customization", desc: "Auto-generates relevant ad copy per query" },
                        { label: "URL Expansion", desc: "Redirects to most relevant landing page" },
                      ].map((f) => (
                        <div
                          key={f.label}
                          className="rounded-lg border border-amber-200/50 bg-background px-2.5 py-2 dark:border-amber-800/30"
                        >
                          <p className="text-[10px] font-semibold text-foreground">{f.label}</p>
                          <p className="text-[9px] text-muted-foreground">{f.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Shield className="size-3 text-primary" /> Brand Inclusions
                        <InfoTip text="Brand names to keep your ads on-brand. Google will prioritize these brands." />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newBrandIncl}
                          onChange={(e) => setNewBrandIncl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addTag("brandInclusions", newBrandIncl, setNewBrandIncl))
                          }
                          placeholder="Your brand name"
                          className="h-8 flex-1 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => addTag("brandInclusions", newBrandIncl, setNewBrandIncl)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      {aiMax.brandInclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {aiMax.brandInclusions.map((b: string, i: number) => (
                            <Badge key={i} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                              {b}{" "}
                              <button type="button" onClick={() => removeTag("brandInclusions", i)}>
                                <X className="size-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Shield className="size-3 text-red-500" /> Brand Exclusions
                        <InfoTip text="Exclude competitor brands to avoid wasted spend on irrelevant brand terms." />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newBrandExcl}
                          onChange={(e) => setNewBrandExcl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addTag("brandExclusions", newBrandExcl, setNewBrandExcl))
                          }
                          placeholder="Competitor brand name"
                          className="h-8 flex-1 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => addTag("brandExclusions", newBrandExcl, setNewBrandExcl)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      {aiMax.brandExclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {aiMax.brandExclusions.map((b: string, i: number) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="gap-1 rounded-full border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
                            >
                              {b}{" "}
                              <button type="button" onClick={() => removeTag("brandExclusions", i)}>
                                <X className="size-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Link2 className="size-3 text-primary" /> URL Restrictions
                        <InfoTip text="Restrict URL expansion to selected URL patterns only." />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newUrlIncl}
                          onChange={(e) => setNewUrlIncl(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), addTag("urlInclusions", newUrlIncl, setNewUrlIncl))
                          }
                          placeholder="https://store.salla.sa/products/*"
                          className="h-8 flex-1 font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-[10px]"
                          onClick={() => addTag("urlInclusions", newUrlIncl, setNewUrlIncl)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      {aiMax.urlInclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {aiMax.urlInclusions.map((u: string, i: number) => (
                            <Badge key={i} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]">
                              {u}{" "}
                              <button type="button" onClick={() => removeTag("urlInclusions", i)}>
                                <X className="size-2.5" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {aiMax.urlInclusions.length === 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          No restrictions - Google can send traffic to any page on your site.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>
            );
          })()}

          {!isPMax && (
            <>
              <SectionPriorityHeader
                step="4"
                title="Advanced controls (optional)"
                description="Use only when you need tighter control over timing and automation behavior."
              />

              {/* ======================================================= */}
              {/* ADVANCED SETTINGS (Collapsible)                          */}
              {/* ======================================================= */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 className="size-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">Advanced Settings</span>
                      <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs">Optional</Badge>
                    </div>
                    {showAdvanced ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="flex flex-col gap-5 pt-5">

              {/* -- Ad Scheduling -- */}
              {!isPMax && !isSearch && (
                <AdSchedulingCard
                  enabled={showScheduling}
                  onToggle={(checked) => {
                    setShowScheduling(checked);
                    updateNested("budget", { schedule: checked ? "custom" : "all_day" });
                  }}
                  infoTipText="Choose specific days and hours when your ads should run. Maps to Google Ads AdSchedule criteria. Times are in Saudi Arabia time (AST, UTC+3)."
                />
              )}



                </CollapsibleContent>
              </Collapsible>
            </>
          )}

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
                ...(!isPMax ? [{ label: "Schedule", value: scheduleSummaryLabel }] : []),
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
