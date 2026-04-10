"use client";

import { useState } from "react";
import { WizardStepFooter, WIZARD_FOOTER_PADDING_BOTTOM } from "@/components/shared/wizard-step-footer";
import { useDV360Campaign } from "@/lib/dv360/campaign-context";
import { DV360_OBJECTIVE_CONFIGS, type DV360BiddingStrategy, type DV360PacingType, type DV360FrequencyTimeUnit, type DV360PerformanceGoalType } from "@/lib/dv360/campaign-types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  TrendingUp,
  Zap,
  Clock,
  Gauge,
  Wallet,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { FrequencyCapCard } from "@/components/shared/frequency-cap-card";
import { BudgetDurationCard } from "@/components/shared/budget-duration-card";
import { PerformanceBoostCard } from "@/components/shared/performance-boost-card";
import { BidStrategyCard } from "@/components/shared/bid-strategy-card";
import { CostSummaryCard } from "@/components/shared/cost-summary-card";
import { EstimatedResultsCard } from "@/components/shared/estimated-results-card";
import { ConfigCheckCard } from "@/components/shared/config-check-card";
import { DeliveryPacingCard } from "@/components/shared/delivery-pacing-card";
import { SectionCard } from "@/components/shared/section-card";

/* ================================================================== */
/*  DV360-specific atoms                                              */
/* ================================================================== */

function SectionTitle({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="size-4 text-red-600" />
      <Label className="text-sm font-semibold text-foreground">{title}</Label>
      {badge && <Badge variant="secondary" className="ml-auto rounded-full text-[10px]">{badge}</Badge>}
    </div>
  );
}

/* ================================================================== */
/*  Label maps                                                        */
/* ================================================================== */

const BIDDING_LABELS: Record<string, string> = {
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPV: "Manual CPV",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPM: "Manual CPM",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM: "Target CPM",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPA: "Target CPA",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_ROAS: "Target ROAS",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_LIFT: "Maximize Brand Lift",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS: "Maximize Conversions",
};

const BIDDING_DESCRIPTIONS: Record<string, string> = {
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPV: "Set the max amount you'll pay per video view.",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MANUAL_CPM: "Set the max amount you'll pay per 1,000 impressions.",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPM: "DV360 automatically adjusts bids to achieve your target CPM.",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_CPA: "DV360 optimizes bids to get conversions at your target cost per action.",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_TARGET_ROAS: "DV360 optimizes bids to achieve your target return on ad spend.",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_LIFT: "DV360 automatically maximizes brand lift and recall.",
  YOUTUBE_AND_PARTNERS_BIDDING_STRATEGY_TYPE_MAXIMIZE_CONVERSIONS: "DV360 automatically maximizes conversion volume within your budget.",
};

const PACING_LABELS: Record<string, string> = {
  PACING_TYPE_EVEN: "Even",
  PACING_TYPE_AHEAD: "Ahead",
  PACING_TYPE_ASAP: "ASAP",
};

const PACING_DESCRIPTIONS: Record<string, string> = {
  PACING_TYPE_EVEN: "Spend budget evenly throughout the flight. Recommended for most campaigns.",
  PACING_TYPE_AHEAD: "Spend budget faster at the start. Good for time-sensitive campaigns.",
  PACING_TYPE_ASAP: "Spend budget as quickly as possible. Use for urgent, short campaigns.",
};

const PERF_GOAL_LABELS: Record<string, string> = {
  PERFORMANCE_GOAL_TYPE_CPM: "CPM (Cost per 1,000 impressions)",
  PERFORMANCE_GOAL_TYPE_CPC: "CPC (Cost per click)",
  PERFORMANCE_GOAL_TYPE_CPA: "CPA (Cost per action)",
  PERFORMANCE_GOAL_TYPE_CPIAVC: "CPV (Cost per view)",
  PERFORMANCE_GOAL_TYPE_CTR: "CTR (Click-through rate)",
  PERFORMANCE_GOAL_TYPE_VIEWABILITY: "Viewability (%)",
  PERFORMANCE_GOAL_TYPE_VTR: "VTR (View-through rate)",
  PERFORMANCE_GOAL_TYPE_VIDEO_COMPLETION_RATE: "VCR (Video completion rate)",
};

const FREQ_LABELS: Record<string, string> = {
  TIME_UNIT_DAYS: "Per day",
  TIME_UNIT_WEEKS: "Per week",
  TIME_UNIT_MONTHS: "Per month",
  TIME_UNIT_LIFETIME: "Lifetime",
  TIME_UNIT_HOURS: "Per hour",
  TIME_UNIT_MINUTES: "Per minute",
};

const FREQ_SUMMARY_LABELS: Record<string, string> = {
  TIME_UNIT_DAYS: "day",
  TIME_UNIT_WEEKS: "week",
  TIME_UNIT_MONTHS: "month",
  TIME_UNIT_LIFETIME: "lifetime",
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export function DV360StepBudget() {
  const { campaign, setStep, updateNested } = useDV360Campaign();
  const b = campaign.budget;
  const obj = campaign.objective;
  const config = DV360_OBJECTIVE_CONFIGS[obj.objective];
  const isAwareness = obj.objective === "AWARENESS";
  const isConsideration = obj.objective === "CONSIDERATION";
  const isConversion = obj.objective === "CONVERSION";
  const isPerformance = obj.objective === "PERFORMANCE";

  const [showPerformanceGoal, setShowPerformanceGoal] = useState(!!b.performanceGoalAmount);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const durationDays = (() => {
    if (!b.startDate || !b.endDate) return 30;
    const diff = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
    return Math.max(1, Math.round(diff / 86400000));
  })();

  const dailyBudget = Math.round(b.budgetAmount / durationDays);

  const strengthTiers = [
    { min: 0, pct: 10, color: "bg-red-400", textColor: "text-red-600", label: "Very Low" },
    { min: 30, pct: 30, color: "bg-orange-400", textColor: "text-orange-600", label: "Limited" },
    { min: 100, pct: 55, color: "bg-yellow-400", textColor: "text-yellow-600", label: "Moderate" },
    { min: 250, pct: 75, color: "bg-emerald-400", textColor: "text-emerald-600", label: "Good" },
    { min: 500, pct: 100, color: "bg-red-600", textColor: "text-red-600", label: "Strong" },
  ];

  const update = (partial: Partial<typeof b>) => updateNested("budget", partial);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]", WIZARD_FOOTER_PADDING_BOTTOM)}>

        {/* ============ MAIN COLUMN ============ */}
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-foreground">Budget & Bidding</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set your campaign budget, pacing, frequency, and bidding strategy for YouTube ads.
            </p>
          </div>

          {/* ---- Campaign Budget (shared card) ---- */}
          <BudgetDurationCard
            budgetTypes={[]}
            budgetMode="lifetime"
            amount={b.budgetAmount}
            onAmountChange={(v) => update({ budgetAmount: v })}
            minAmount={100}
            platformName="DV360"
            strengthTiers={strengthTiers}
            startDate={b.startDate}
            endDate={b.endDate}
            endDateOptional={false}
            onStartDateChange={(d) => update({ startDate: d })}
            onEndDateChange={(d) => update({ endDate: d })}
            showRunContinuously={false}
            endDateRequired={true}
            showAutoIncrease={false}
            showLifetimeToggle={false}
          />

          {/* ---- Bidding Strategy ---- */}
          <BidStrategyCard
            strategies={config.allowedBiddingStrategies.map((strategy) => ({
              value: strategy,
              label: BIDDING_LABELS[strategy] ?? strategy,
              desc: BIDDING_DESCRIPTIONS[strategy] ?? "",
            }))}
            selectedStrategy={b.biddingStrategy}
            onStrategyChange={(v) => update({ biddingStrategy: v as DV360BiddingStrategy })}
            layout="cards"
            infoTipText="Choose how DV360 bids in auctions. Maps to youtubeAndPartnersBiddingStrategy."
            bidInputs={
              b.biddingStrategy.includes("TARGET_CPM") ||
              b.biddingStrategy.includes("TARGET_CPA") ||
              b.biddingStrategy.includes("MANUAL_CPV") ||
              b.biddingStrategy.includes("MANUAL_CPM") ||
              b.biddingStrategy.includes("TARGET_ROAS")
                ? [
                    {
                      label: b.biddingStrategy.includes("CPM")
                        ? "Target CPM (SAR)"
                        : b.biddingStrategy.includes("CPV")
                          ? "Target CPV (SAR)"
                          : b.biddingStrategy.includes("CPA")
                            ? "Target CPA (SAR)"
                            : "Target ROAS (%)",
                      desc: b.biddingStrategy.includes("CPM")
                        ? "The target cost per 1,000 impressions in SAR."
                        : b.biddingStrategy.includes("CPV")
                          ? "The maximum cost per view in SAR."
                          : b.biddingStrategy.includes("CPA")
                            ? "The target cost per conversion action in SAR."
                            : "The target return on ad spend as a percentage.",
                      prefix: b.biddingStrategy.includes("ROAS") ? undefined : "SAR",
                      suffix: b.biddingStrategy.includes("ROAS") ? "%" : undefined,
                      value:
                        b.biddingStrategy.includes("CPM")
                          ? (b.targetCpm ?? undefined)
                          : b.biddingStrategy.includes("CPV")
                            ? (b.targetCpv ?? undefined)
                            : b.biddingStrategy.includes("CPA")
                              ? (b.targetCpa ?? undefined)
                              : (b.targetRoas ?? undefined),
                      onChange: (val: number) => {
                        const v = val || null;
                        if (b.biddingStrategy.includes("CPM")) update({ targetCpm: v });
                        else if (b.biddingStrategy.includes("CPV")) update({ targetCpv: v });
                        else if (b.biddingStrategy.includes("CPA")) update({ targetCpa: v });
                        else update({ targetRoas: v });
                      },
                      min: 0,
                      step: b.biddingStrategy.includes("CPV") ? 0.01 : 1,
                    },
                  ]
                : undefined
            }
          />

          {/* ---- Performance Goal ---- */}
          <SectionCard>
            <SectionTitle icon={TrendingUp} title="Performance Goal" badge="Insertion Order" />
            <p className="mb-4 text-xs text-muted-foreground">
              Set the KPI that DV360 will optimize toward. Maps to <code className="rounded bg-muted px-1 text-[10px]">performanceGoal</code>.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="mb-1.5 text-xs text-muted-foreground">Goal Type</Label>
                <Select
                  value={b.performanceGoalType}
                  onValueChange={(v) => update({ performanceGoalType: v as DV360PerformanceGoalType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.allowedPerformanceGoals.map((g) => (
                      <SelectItem key={g} value={g}>{PERF_GOAL_LABELS[g] || g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={showPerformanceGoal}
                  onCheckedChange={setShowPerformanceGoal}
                />
                <span className="text-xs text-muted-foreground">Set specific target value</span>
              </div>

              {showPerformanceGoal && (
                <div>
                  <Label className="mb-1.5 text-xs text-muted-foreground">Target Value (SAR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">SAR</span>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={b.performanceGoalAmount ?? ""}
                      onChange={(e) => update({ performanceGoalAmount: Number(e.target.value) || null })}
                      className="pl-12"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Maps to performanceGoal.performanceGoalAmountMicros (value * 1,000,000)
                  </p>
                </div>
              )}
            </div>
          </SectionCard>


          {/* ---- Advanced Settings ---- */}
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
                  <p className="mt-1 text-xs text-muted-foreground">Pacing Strategy, Frequency Cap</p>
                </div>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className={cn("flex flex-col gap-4 rounded-b-2xl px-2 pb-2", showAdvanced && "bg-muted/50")}>
          {/* ---- Pacing ---- */}
          <DeliveryPacingCard
            title="Pacing Strategy"
            layout="radio"
            apiBadge="Insertion Order"
            options={[
              { value: "PACING_TYPE_EVEN", label: "Even", desc: "Spend budget evenly throughout the flight. Recommended for most campaigns.", recommended: true },
              { value: "PACING_TYPE_AHEAD", label: "Ahead", desc: "Spend budget faster at the start. Good for time-sensitive campaigns." },
              { value: "PACING_TYPE_ASAP", label: "ASAP", desc: "Spend budget as quickly as possible. Use for urgent, short campaigns." },
            ]}
            selectedPacing={b.pacing}
            onPacingChange={(v) => update({ pacing: v as DV360PacingType })}
            infoTipText="Controls how quickly DV360 spends your budget. Maps to pacing.pacingType."
            accent="#dc2626"
          />

          {/* ---- Frequency Cap (API: frequencyCap) ---- */}
          <FrequencyCapCard
            enabled={b.frequencyCap.enabled}
            onEnabledChange={(checked) =>
              update({ frequencyCap: { ...b.frequencyCap, enabled: checked } })
            }
            maxImpressions={b.frequencyCap.maxImpressions}
            onMaxImpressionsChange={(v) =>
              update({ frequencyCap: { ...b.frequencyCap, maxImpressions: v } })
            }
            minImpressions={1}
            maxImpressionsMax={100}
            timeWindowValue={b.frequencyCap.timeUnit}
            timeWindowOptions={(
              [
                "TIME_UNIT_DAYS",
                "TIME_UNIT_WEEKS",
                "TIME_UNIT_MONTHS",
                "TIME_UNIT_LIFETIME",
              ] as DV360FrequencyTimeUnit[]
            ).map((u) => ({ value: u, label: FREQ_LABELS[u] }))}
            onTimeWindowChange={(v) =>
              update({
                frequencyCap: {
                  ...b.frequencyCap,
                  timeUnit: v as DV360FrequencyTimeUnit,
                },
              })
            }
            timeWindowSummaryLabel={FREQ_SUMMARY_LABELS[b.frequencyCap.timeUnit] ?? "day"}
            summaryMode="per"
            accent="dv360"
            apiBadge="frequencyCap"
            infoTipText="Limit how often a single user sees your ads. Maps to DV360 frequencyCap."
          />

            </CollapsibleContent>
          </Collapsible>

          {/* ---- Salla Performance Boost ---- */}
          <PerformanceBoostCard
            enabled={b.performanceBoost}
            onToggle={(v) => update({ performanceBoost: v })}
          />
        </div>

        {/* ============ RIGHT SIDEBAR ============ */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="flex flex-col gap-4">

            {/* Cost Summary (shared) */}
            <CostSummaryCard
              budgetLabel="Lifetime budget"
              budgetAmount={b.budgetAmount}
              durationDays={durationDays}
              totalBudget={b.budgetAmount}
              boostEnabled={b.performanceBoost}
              boostAmount={149}
              startDate={b.startDate}
              endDate={b.endDate}
            />

            {/* Estimated Results (shared) */}
            <EstimatedResultsCard
              badge="Predicted"
              rows={[
                ...(isAwareness && b.targetCpm && b.targetCpm > 0 ? [
                  { label: "Est. Impressions", value: Math.floor((b.budgetAmount / b.targetCpm) * 1000).toLocaleString(), highlight: true },
                  { label: "Cost per 1,000", value: `SAR ${b.targetCpm.toFixed(2)}` },
                ] : []),
                ...(isConsideration && b.targetCpv && b.targetCpv > 0 ? [
                  { label: "Est. Views", value: Math.floor(b.budgetAmount / b.targetCpv).toLocaleString(), highlight: true },
                  { label: "Cost per View", value: `SAR ${b.targetCpv.toFixed(2)}` },
                ] : []),
                ...(isConversion && b.targetCpa && b.targetCpa > 0 ? [
                  { label: "Est. Conversions", value: Math.floor(b.budgetAmount / b.targetCpa).toLocaleString(), highlight: true },
                  { label: "Cost per Action", value: `SAR ${b.targetCpa.toFixed(0)}` },
                ] : []),
                ...(isPerformance && b.targetRoas && b.targetRoas > 0 ? [
                  { label: "Target ROAS", value: `${b.targetRoas}%` },
                  { label: "Est. Revenue", value: `SAR ${Math.round(b.budgetAmount * b.targetRoas / 100).toLocaleString()}`, highlight: true },
                ] : []),
                ...(isPerformance && b.targetCpa && b.targetCpa > 0 ? [
                  { label: "Est. Conversions", value: Math.floor(b.budgetAmount / b.targetCpa).toLocaleString() },
                ] : []),
                { label: "Daily average", value: `SAR ${dailyBudget.toLocaleString()}` },
                { label: "Flight duration", value: `${durationDays} days` },
              ]}
              disclaimer="Estimates are approximate for YouTube/DV360 ads in Saudi Arabia. Actual results depend on ad quality, audience, and competition."
            />

            {/* Configuration + Delivery (shared) */}
            <ConfigCheckCard
              configRows={[
                { label: "Pacing", value: PACING_LABELS[b.pacing] },
                { label: "Bidding", value: BIDDING_LABELS[b.biddingStrategy] || "-" },
                { label: "Perf. goal", value: b.performanceGoalType.split("_").slice(-2).join(" ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()) },
                ...(b.frequencyCap.enabled ? [{ label: "Freq. cap", value: `${b.frequencyCap.maxImpressions} ${FREQ_LABELS[b.frequencyCap.timeUnit]?.toLowerCase()}` }] : []),
              ]}
              checkItems={[
                { label: "Budget", status: b.budgetAmount >= 500 ? "ok" as const : "warning" as const, text: b.budgetAmount >= 500 ? "Budget is healthy" : "Below recommended minimum" },
                { label: "Duration", status: durationDays >= 7 ? "ok" as const : "warning" as const, text: durationDays >= 7 ? "Sufficient learning time" : "Too short for optimization" },
                { label: "Bidding", status: "ok" as const, text: BIDDING_LABELS[b.biddingStrategy] || "Set" },
                { label: "Freq. cap", status: b.frequencyCap.enabled ? "ok" as const : "warning" as const, text: b.frequencyCap.enabled ? "Active" : "Not set (recommended)" },
              ]}
            />

            {/* Benchmarks (consolidated - objective-specific) */}
            {(isAwareness || isConsideration || isConversion || isPerformance) && (
              <div className={cn(
                "rounded-xl border p-4",
                isAwareness ? "border-red-200/50 bg-red-50/30 dark:border-red-800/30 dark:bg-red-950/10"
                : isConsideration ? "border-blue-200/50 bg-blue-50/30 dark:border-blue-800/30 dark:bg-blue-950/10"
                : isConversion ? "border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10"
                : "border-orange-200/50 bg-orange-50/30 dark:border-orange-800/30 dark:bg-orange-950/10"
              )}>
                <div className="mb-2 flex items-center gap-1.5">
                  <Gauge className={cn("size-3.5", isAwareness ? "text-red-600" : isConsideration ? "text-blue-600" : isConversion ? "text-emerald-600" : "text-orange-600")} />
                  <p className={cn("text-xs font-semibold", isAwareness ? "text-red-800 dark:text-red-300" : isConsideration ? "text-blue-800 dark:text-blue-300" : isConversion ? "text-emerald-800 dark:text-emerald-300" : "text-orange-800 dark:text-orange-300")}>
                    {isAwareness ? "CPM Benchmarks (KSA)" : isConsideration ? "CPV Benchmarks (KSA)" : isConversion ? "CPA Benchmarks (KSA)" : "Performance Benchmarks (KSA)"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(isAwareness ? [
                    { label: "Skippable In-Stream", range: "SAR 8-20" },
                    { label: "Non-Skippable (15s)", range: "SAR 15-35" },
                    { label: "Bumper (6s)", range: "SAR 5-15" },
                    { label: "Avg. Reach Rate", range: "60%-80%" },
                  ] : isConsideration ? [
                    { label: "Skippable In-Stream", range: "SAR 0.04-0.12" },
                    { label: "In-Feed Discovery", range: "SAR 0.08-0.20" },
                    { label: "YouTube Shorts", range: "SAR 0.02-0.08" },
                    { label: "Avg. VTR (KSA)", range: "25%-40%" },
                  ] : isConversion ? [
                    { label: "E-Commerce", range: "SAR 15-50" },
                    { label: "Lead Generation", range: "SAR 10-35" },
                    { label: "App Installs", range: "SAR 5-20" },
                    { label: "Sign-ups", range: "SAR 8-25" },
                  ] : [
                    { label: "Avg. ROAS (E-Comm)", range: "300%-600%" },
                    { label: "Avg. CPA", range: "SAR 12-40" },
                    { label: "Multi-Format Lift", range: "+15-30% conv." },
                    { label: "Learning Phase", range: "7-14 days" },
                  ]).map((bench) => (
                    <div key={bench.label} className="rounded-md bg-background px-2 py-1.5 dark:bg-card">
                      <p className="text-[9px] text-muted-foreground">{bench.label}</p>
                      <p className="text-[11px] font-semibold text-foreground">{bench.range}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[9px] text-muted-foreground">
                  Benchmarks are approximate for YouTube ads in Saudi Arabia. Actual performance varies by audience, format, and industry.
                </p>
              </div>
            )}

            {/* Salla Tips */}
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/10">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Salla Tips</p>
                  <ul className="mt-1 flex flex-col gap-1 text-[10px] text-amber-700 dark:text-amber-400">
                    {isAwareness && <li>Target CPM bidding delivers the best reach at the lowest cost.</li>}
                    {isAwareness && <li>Set target frequency to 3-5 per week to balance recall and ad fatigue.</li>}
                    {isConsideration && <li>Manual CPV is best for controlling view costs (SAR 0.03-0.15 avg. in KSA).</li>}
                    {isConsideration && <li>VTR goal works best with In-Feed + Skippable formats.</li>}
                    {isConversion && <li>Start with Maximize Conversions. Switch to Target CPA after 50+ conversions.</li>}
                    {isConversion && <li>Ensure Floodlight tags fire on confirmation pages for accurate tracking.</li>}
                    {isPerformance && <li>Performance campaigns need 7-14 days to learn. Avoid changes during this period.</li>}
                    {isPerformance && <li>Provide at least 3 video assets (horizontal, vertical, square) for best AI optimization.</li>}
                    <li>Even pacing is recommended for campaigns longer than 7 days.</li>
                    <li>Set a frequency cap to prevent ad fatigue.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Estimates are approximate and based on DV360 API. Actual results depend on ad quality, competition, and audience engagement.
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
        accent="dv360"
      />
    </TooltipProvider>
  );
}
