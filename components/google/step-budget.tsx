"use client";

import { useState } from "react";
import { useGoogleCampaign } from "@/lib/google/campaign-context";
import { OBJECTIVE_CONFIGS } from "@/lib/google/campaign-types";
import type { BiddingStrategy, ConversionGoal, PaymentMethod, AssetAutomationType, AssetAutomationStatus, AssetAutomationEntry, AdScheduleEntry } from "@/lib/google/campaign-types";
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
    value: "MANUAL_CPC",
    label: "Manual CPC",
    apiLabel: "Manual CPC",
    desc: "Set your own maximum cost-per-click bids for each product group. Full control over individual bid amounts.",
    bestFor: "Best for experienced advertisers who want granular control over Shopping bids per product group.",
    icon: <Settings2 className="size-4" />,
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

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

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

  const endDateRequired = budget.paymentMethod === "prepaid";

  /* Duration calc */
  const durationDays =
    budget.startDate && budget.endDate
      ? Math.max(1, Math.ceil((new Date(budget.endDate).getTime() - new Date(budget.startDate).getTime()) / 86400000))
      : 14;

  const dailyAmount = budget.amount;

  /* Suggested budget range */
  const suggestedDaily = isPMax ? 200 : isShopping ? 150 : isDemandGen ? 250 : 150;
  const suggestedBid = isPMax ? { min: 15, max: 30 } : isShopping ? { min: 5, max: 20 } : isDemandGen ? { min: 20, max: 40 } : { min: 10, max: 25 };

  /* Budget strength */
  const goalMultiplier = isPMax ? 1.2 : 1;
  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: Math.round(50 * goalMultiplier), pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: Math.round(150 * goalMultiplier), pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: Math.round(300 * goalMultiplier), pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: Math.round(500 * goalMultiplier), pct: 100, color: "bg-primary", textColor: "text-primary", label: "Strong" },
  ];
  const currentTier = [...strengthTiers].reverse().find((t) => dailyAmount >= t.min)!;

  /* Filter bidding strategies by objective */
  const availableStrategies = BIDDING_STRATEGIES.filter((s) =>
    s.supportedObjectives.includes(campaign.objective.objective)
  );
  const activeStrategy = availableStrategies.find((s) => s.value === budget.biddingStrategy) ?? availableStrategies[0];

  const googleBidInputs: BidInput[] = [
    ...(activeStrategy?.showTargetCpa &&
    (budget.biddingStrategy === "MAXIMIZE_CONVERSIONS" || budget.biddingStrategy === "TARGET_CPA")
      ? [
          {
            label: `Target Cost per Purchase (CPA) ${budget.biddingStrategy === "MAXIMIZE_CONVERSIONS" ? "(Optional)" : "(Required)"}`,
            desc:
              budget.biddingStrategy === "MAXIMIZE_CONVERSIONS"
                ? "Leave empty to let Google optimize freely, or set a target to control costs. Setting a target may limit volume."
                : "Set your target cost per acquisition. Google will optimize bids to meet this target on average.",
            value: budget.targetCpa || undefined,
            onChange: (v: number) => updateNested("budget", { targetCpa: Math.max(0, v) }),
            suggestedRange: suggestedBid,
            prefix: "SAR",
            min: 0.01,
            step: 1,
            tip: "Start with Maximize Conversions without a CPA target for the first 2-3 weeks. This gives Google's AI enough data to learn before adding cost constraints.",
          },
        ]
      : []),
    ...(activeStrategy?.showTargetRoas &&
    (budget.biddingStrategy === "MAXIMIZE_CONVERSION_VALUE" || budget.biddingStrategy === "TARGET_ROAS")
      ? [
          {
            label: `Target ROAS ${budget.biddingStrategy === "MAXIMIZE_CONVERSION_VALUE" ? "(Optional)" : "(Required)"}`,
            desc:
              budget.biddingStrategy === "MAXIMIZE_CONVERSION_VALUE"
                ? "Leave empty to maximize total revenue, or set a target ROAS to balance volume and profitability."
                : "Set your target return on ad spend. Google will optimize bids to achieve this ROAS.",
            value: budget.targetRoas || 400,
            onChange: (v: number) => updateNested("budget", { targetRoas: Math.max(0, v) }),
            suffix: "%",
            min: 100,
            step: 50,
            tip: "Recommended: 200% - 500% for Salla stores. Set a realistic target — too high and Google will under-deliver.",
          },
        ]
      : []),
    ...(budget.biddingStrategy === "MANUAL_CPC"
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
  ];

  /* Mock estimates */
  const totalBudget = dailyAmount * durationDays;
  const totalWithBoost = totalBudget + (budget.performanceBoost ? 149 : 0);

  const estConvLow = Math.max(1, Math.round(dailyAmount / (budget.targetCpa || 50)));
  const estConvHigh = Math.round(estConvLow * 2.5);

  const canProceed = dailyAmount >= 50;

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
            onPaymentMethodChange={(v) => updateNested("budget", { paymentMethod: v })}
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
            showAutoIncrease={true}
            autoIncrease={autoIncrease}
            onAutoIncreaseChange={(ai) => updateNested("budget", { autoIncrease: ai })}
            onBulkUpdate={(updates) => updateNested("budget", updates)}
          />

          {/* ======================================================= */}
          {/* SECTION 2: Conversion Goal                               */}
          {/* ======================================================= */}
          <ConversionEventCard
            title="Conversion Goal"
            events={CONVERSION_GOALS}
            selectedEvent={budget.conversionGoal}
            onEventChange={(v) => updateNested("budget", { conversionGoal: v })}
            infoTipText="The specific e-commerce action Google will optimize for. This must match a conversion action configured in your Google Ads account via the Salla pixel."
            tip="Start with Purchase for maximum ROI. If your pixel has fewer than 30 weekly conversions, try Add to Cart first -- Google needs enough event data to optimize effectively."
          />

          {/* ======================================================= */}
          {/* SECTION 3: Bidding Strategy (shared card)                */}
          {/* ======================================================= */}
          <BidStrategyCard
            strategies={availableStrategies}
            selectedStrategy={budget.biddingStrategy}
            onStrategyChange={(v) => {
              updateNested("budget", {
                biddingStrategy: v as BiddingStrategy,
                ...(v === "TARGET_CPA" && { targetCpa: budget.targetCpa || 25 }),
                ...(v === "TARGET_ROAS" && { targetRoas: budget.targetRoas || 400 }),
              });
            }}
            billingContext={[
              {
                label: "Billing model",
                value:
                  budget.biddingStrategy === "MANUAL_CPC"
                    ? "Manual CPC"
                    : budget.biddingStrategy === "MAXIMIZE_CONVERSIONS" || budget.biddingStrategy === "TARGET_CPA"
                      ? "Smart Bidding (CPA)"
                      : "Smart Bidding (ROAS)",
              },
              {
                label: "What this means",
                value: "Google automatically adjusts bids in real-time using ML signals across all channels.",
              },
            ]}
            infoTipText={
              isPMax
                ? "PMax supports Maximize Conversions and Maximize Conversion Value as primary strategies. You can optionally set a target CPA or target ROAS to guide the algorithm."
                : isShopping
                  ? "Shopping campaigns support Smart Bidding (recommended) or Manual CPC. Smart Bidding uses Google's AI to optimize for conversions or revenue."
                  : "Choose how Google should bid in the ad auction. Each strategy optimizes for different outcomes."
            }
            bidInputs={googleBidInputs}
          >
            {budget.biddingStrategy === "MANUAL_CPC" && (
              <div className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-border bg-background px-3 py-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Enhanced CPC (eCPC)</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    Let Google adjust your manual bids up or down to maximize conversions. Recommended for Shopping campaigns.
                  </p>
                </div>
                <Switch
                  checked={budget.enhancedCpc}
                  onCheckedChange={(checked) => updateNested("budget", { enhancedCpc: checked })}
                />
              </div>
            )}

            {isDemandGen && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Salla Tip for Demand Gen:</span>{" "}
                  Google recommends a daily budget of at least <strong>15x your expected CPA</strong>. Start with <strong>Maximize Conversions</strong> to build data, then switch to <strong>Target CPA</strong> once you have 50+ conversions in 30 days.
                </p>
              </div>
            )}

            {isShopping && budget.biddingStrategy !== "MANUAL_CPC" && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2.5">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-primary">Salla Tip for best ROAS:</span>{" "}
                  Start with <strong>Maximize Conversion Value</strong> for 2-3 weeks. Once you have 15+ conversions in 30 days, switch to <strong>Target ROAS</strong> to lock in your ideal return.
                </p>
              </div>
            )}
          </BidStrategyCard>

          {/* ======================================================= */}
          {/* SECTION 4: PMax Settings (URL expansion, Brand)          */}
          {/* ======================================================= */}
          {isPMax && (
            <SectionCard>
              <div className="mb-1 flex items-center gap-2">
                <Settings2 className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Performance Max Settings</Label>
                <InfoTip text="PMax-specific controls for URL expansion and brand guidelines. These affect how Google serves your ads across all channels." />
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Fine-tune how Performance Max discovers and serves your ads across Google{"'"}s network.
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
                      Google can replace your final URL with a more relevant landing page from your website based on the user{"'"}s search query.
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
                    <span className="font-semibold">Recommended ON:</span> URL expansion lets Google discover high-performing pages on your site that you may not have thought to target.
                  </p>
                </div>
              )}

              {budget.urlExpansionOptOut && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-700">
                    URL expansion is disabled. Google will only send traffic to your specified final URLs. You may miss conversion opportunities.
                  </p>
                </div>
              )}

              {/* Brand Guidelines */}
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-3">
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
                      Apply your brand fonts, colors, and logos automatically across all ad formats. Google will use your brand assets when generating ad variations.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={budget.brandGuidelinesEnabled}
                  onCheckedChange={(checked) => updateNested("budget", { brandGuidelinesEnabled: checked })}
                />
              </div>
            </SectionCard>
          )}

          {/* ======================================================= */}
          {/* AI ASSET AUTOMATION (PMax + Search)                      */}
          {/* ======================================================= */}
          {(isPMax || isSearch) && (() => {
            const PMAX_AUTOMATION_TYPES: { type: AssetAutomationType; label: string; desc: string; icon: React.ReactNode }[] = [
              { type: "TEXT_ASSET_AUTOMATION", label: "Text Asset Automation", desc: "Google AI generates ad text from your landing pages and product data.", icon: <Type className="size-3.5" /> },
              { type: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", label: "Final URL Text Automation", desc: "Auto-generate text assets for expanded URL destinations.", icon: <FileText className="size-3.5" /> },
              { type: "GENERATE_IMAGE_EXTRACTION", label: "Image Extraction", desc: "Pull relevant images from your landing pages for ad creatives.", icon: <ImagePlus className="size-3.5" /> },
              { type: "GENERATE_IMAGE_ENHANCEMENT", label: "Image Enhancement", desc: "AI-enhance your uploaded images (crop, resize, optimize).", icon: <ImagePlus className="size-3.5" /> },
              { type: "GENERATE_ENHANCED_YOUTUBE_VIDEOS", label: "Video Enhancement", desc: "Optimize video formats, lengths, and orientations for each placement.", icon: <Video className="size-3.5" /> },
            ];
            const SEARCH_AUTOMATION_TYPES: { type: AssetAutomationType; label: string; desc: string; icon: React.ReactNode }[] = [
              { type: "TEXT_ASSET_AUTOMATION", label: "Text Asset Automation", desc: "Auto-generate text for your responsive search ads from landing pages.", icon: <Type className="size-3.5" /> },
              { type: "FINAL_URL_EXPANSION_TEXT_ASSET_AUTOMATION", label: "Final URL Text Automation", desc: "Auto-generate text assets for expanded URL destinations.", icon: <FileText className="size-3.5" /> },
              { type: "GENERATE_IMAGE_ENHANCEMENT", label: "Image Enhancement", desc: "AI-enhance images used in search ad extensions.", icon: <ImagePlus className="size-3.5" /> },
            ];
            const automationTypes = isPMax ? PMAX_AUTOMATION_TYPES : SEARCH_AUTOMATION_TYPES;
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
                      {isPMax ? "Control how Google AI generates and enhances your ad assets across all channels." : "Control how Google AI generates text and images for your search ads."}
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
              </SectionCard>
            );
          })()}

          {/* ======================================================= */}
          {/* AI MAX FOR SEARCH (Search only)                          */}
          {/* ======================================================= */}
          {isSearch && (() => {
            const aiMax = budget.aiMaxSettings;

            const updateAiMax = (patch: Partial<typeof aiMax>) => updateNested("budget", { aiMaxSettings: { ...aiMax, ...patch } });

            const addTag = (field: "brandInclusions" | "brandExclusions" | "urlInclusions", value: string, setter: (v: string) => void) => {
              const trimmed = value.trim();
              if (!trimmed || aiMax[field].includes(trimmed)) return;
              updateAiMax({ [field]: [...aiMax[field], trimmed] });
              setter("");
            };
            const removeTag = (field: "brandInclusions" | "brandExclusions" | "urlInclusions", idx: number) => {
              updateAiMax({ [field]: aiMax[field].filter((_: string, i: number) => i !== idx) });
            };

            return (
              <SectionCard className={aiMax.enableAiMax ? "border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10" : ""}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={cn("flex size-9 items-center justify-center rounded-xl", aiMax.enableAiMax ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted")}>
                    <Bot className={cn("size-5", aiMax.enableAiMax ? "text-amber-600" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-semibold text-foreground">AI Max for Search</Label>
                      <Badge className="rounded-full border-0 bg-amber-100 px-1.5 py-0 text-[9px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Beta</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Supercharge your Search campaign with AI-powered keyword expansion, final URL expansion, and text customization.
                    </p>
                  </div>
                  <Switch checked={aiMax.enableAiMax} onCheckedChange={(checked) => updateAiMax({ enableAiMax: checked })} />
                </div>

                {aiMax.enableAiMax && (
                  <div className="flex flex-col gap-4">
                    {/* Warning */}
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/20">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      <p className="text-[10px] leading-relaxed text-amber-800 dark:text-amber-300">
                        AI Max fundamentally changes how your Search campaign works. Google will automatically expand keywords, customize ad text, and redirect users to the most relevant pages. Recommended minimum budget: <span className="font-semibold">SAR 2,800/day (~$750)</span> for optimal AI learning.
                      </p>
                    </div>

                    {/* What AI Max does */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Keyword Expansion", desc: "AI finds new search terms beyond your keywords" },
                        { label: "Text Customization", desc: "Auto-generates relevant ad copy per query" },
                        { label: "URL Expansion", desc: "Redirects to most relevant landing page" },
                      ].map((f) => (
                        <div key={f.label} className="rounded-lg border border-amber-200/50 bg-background px-2.5 py-2 dark:border-amber-800/30">
                          <p className="text-[10px] font-semibold text-foreground">{f.label}</p>
                          <p className="text-[9px] text-muted-foreground">{f.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* Brand Inclusions */}
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Shield className="size-3 text-primary" /> Brand Inclusions
                        <InfoTip text="Brand names to keep your ads on-brand. Google will prioritize showing ads for these brands. Maps to BrandSuggestion in the API." />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={newBrandIncl} onChange={(e) => setNewBrandIncl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("brandInclusions", newBrandIncl, setNewBrandIncl))} placeholder="Your brand name" className="h-8 flex-1 text-xs" />
                        <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => addTag("brandInclusions", newBrandIncl, setNewBrandIncl)}><Plus className="size-3" /></Button>
                      </div>
                      {aiMax.brandInclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {aiMax.brandInclusions.map((b: string, i: number) => (
                            <Badge key={i} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 text-[10px]">
                              {b} <button type="button" onClick={() => removeTag("brandInclusions", i)}><X className="size-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Brand Exclusions */}
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Shield className="size-3 text-red-500" /> Brand Exclusions
                        <InfoTip text="Brand names to exclude. Prevents Google from showing your ads when users search for competitor brands. Important for protecting your ad spend." />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={newBrandExcl} onChange={(e) => setNewBrandExcl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("brandExclusions", newBrandExcl, setNewBrandExcl))} placeholder="Competitor brand name" className="h-8 flex-1 text-xs" />
                        <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => addTag("brandExclusions", newBrandExcl, setNewBrandExcl)}><Plus className="size-3" /></Button>
                      </div>
                      {aiMax.brandExclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {aiMax.brandExclusions.map((b: string, i: number) => (
                            <Badge key={i} variant="secondary" className="gap-1 rounded-full border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
                              {b} <button type="button" onClick={() => removeTag("brandExclusions", i)}><X className="size-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* URL Inclusions */}
                    <div>
                      <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Link2 className="size-3 text-primary" /> URL Restrictions
                        <InfoTip text="Restrict final URL expansion to specific URL patterns. If empty, Google can send traffic to any page on your site. Maps to PageFeedAsset in the API." />
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={newUrlIncl} onChange={(e) => setNewUrlIncl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag("urlInclusions", newUrlIncl, setNewUrlIncl))} placeholder="https://store.salla.sa/products/*" className="h-8 flex-1 font-mono text-xs" />
                        <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => addTag("urlInclusions", newUrlIncl, setNewUrlIncl)}><Plus className="size-3" /></Button>
                      </div>
                      {aiMax.urlInclusions.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {aiMax.urlInclusions.map((u: string, i: number) => (
                            <Badge key={i} variant="secondary" className="gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]">
                              {u} <button type="button" onClick={() => removeTag("urlInclusions", i)}><X className="size-2.5" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {aiMax.urlInclusions.length === 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">No restrictions -- Google can send traffic to any page on your site.</p>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>
            );
          })()}

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
              <AdSchedulingCard
                enabled={showScheduling}
                onToggle={(checked) => {
                  setShowScheduling(checked);
                  updateNested("budget", { schedule: checked ? "custom" : "all_day" });
                }}
                infoTipText="Choose specific days and hours when your ads should run. Maps to Google Ads AdSchedule criteria. Times are in Saudi Arabia time (AST, UTC+3)."
              />


              {/* -- Ad Schedule Entries (Search only) -- */}

          {/* ======================================================= */}
          {/* Ad Schedule (Search only) — when ads run; moved from Step 1 (Audience) */}
          {/* ======================================================= */}
          {isSearch && (
            <SectionCard>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <Label className="text-sm font-semibold text-foreground">Ad schedule</Label>
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px]">Search</Badge>
                <InfoTip text="Set specific days and hours when your ads should run. Useful for showing ads only during business hours. Maps to CampaignCriterion.ad_schedule." />
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose when your ads should appear. Leave empty to run ads all day, every day.
              </p>
              {aud.adScheduleEntries.length > 0 && (
                <div className="mb-3 flex flex-col gap-1.5">
                  {aud.adScheduleEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <span className="text-xs font-medium text-foreground">{DAY_SHORT[entry.dayOfWeek]} {String(entry.startHour).padStart(2, "0")}:00 - {String(entry.endHour).padStart(2, "0")}:00</span>
                      <button
                        type="button"
                        onClick={() => updateNested("audience", { adScheduleEntries: aud.adScheduleEntries.filter((e) => e.id !== entry.id) })}
                        className="rounded-full p-1 hover:bg-muted"
                      >
                        <X className="size-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Weekdays 9-17", days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const, start: 9, end: 17 },
                  { label: "Evenings 18-23", days: DAYS_OF_WEEK, start: 18, end: 23 },
                  { label: "Weekends only", days: ["SATURDAY", "SUNDAY"] as const, start: 0, end: 24 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const newEntries: AdScheduleEntry[] = preset.days.map((day) => ({
                        id: `sched-${Date.now()}-${day}`,
                        dayOfWeek: day,
                        startHour: preset.start,
                        endHour: preset.end,
                      }));
                      updateNested("audience", { adScheduleEntries: [...aud.adScheduleEntries, ...newEntries] });
                    }}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Plus className="mr-1 inline size-3" />{preset.label}
                  </button>
                ))}
                {aud.adScheduleEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateNested("audience", { adScheduleEntries: [] })}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {aud.adScheduleEntries.length === 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground">No schedule set — ads run 24/7.</p>
              )}
            </SectionCard>
          )}

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
              rows={[
                { label: "Daily purchases", value: `${estConvLow} - ${estConvHigh}` },
                { label: "Daily reach", value: `${fmt(dailyAmount * 40)} - ${fmt(dailyAmount * 120)}` },
                { label: "Est. cost per result", value: `SAR ${suggestedBid.min.toFixed(2)} - ${suggestedBid.max.toFixed(2)}` },
              ]}
              disclaimer="Estimates based on similar campaigns. Actual results may vary based on creative quality and competition."
            />

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Budget type", value: BUDGET_TYPES.find((m) => m.value === budget.paymentMethod)?.label ?? "-" },
                { label: "End date", value: budget.endDateOptional ? "Continuous" : budget.endDate || "Not set" },
                { label: "Bid strategy", value: activeStrategy?.label ?? budget.biddingStrategy },
                { label: "Conversion goal", value: CONVERSION_GOALS.find((g) => g.value === budget.conversionGoal)?.label ?? "Purchase" },
                { label: "Schedule", value: showScheduling ? "Custom hours" : "24/7" },
                ...(autoIncrease.enabled ? [{ label: "Auto-increase", value: `+${autoIncrease.pct}% / ${autoIncrease.intervalDays}d` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: dailyAmount >= 50 ? "ok" as const : "warning" as const, text: dailyAmount >= 50 ? "Budget is healthy" : "Below recommended minimum" },
                { label: "Duration", status: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "ok" as const : "warning" as const, text: (durationDays >= 7 || (budget.endDateOptional ?? false)) ? "Sufficient learning time" : "Too short for optimization" },
                { label: "Bid strategy", status: "ok" as const, text: activeStrategy?.label ?? budget.biddingStrategy },
                { label: "Conversion goal", status: "ok" as const, text: CONVERSION_GOALS.find((g) => g.value === budget.conversionGoal)?.label ?? "Purchase" },
                ...(isPMax ? [{ label: "URL expansion", status: (!budget.urlExpansionOptOut ? "ok" as const : "warning" as const), text: budget.urlExpansionOptOut ? "Off (limited)" : "On (recommended)" }] : []),
              ]}
            />

            {/* Disclaimer */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Estimates are approximate and based on Google Ads API. Actual results depend on ad quality, competition, and audience engagement.
              </p>
            </div>

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
