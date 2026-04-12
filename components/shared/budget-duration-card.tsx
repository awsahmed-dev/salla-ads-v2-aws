"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CalendarDays,
  Wallet,
  Banknote,
  TrendingUp,
  Sparkles,
  Info,
} from "lucide-react";

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

export interface BudgetTypeOption {
  value: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

export interface AutoIncreaseState {
  enabled: boolean;
  mode: "schedule" | "performance";
  /* Schedule mode */
  pct: number;
  intervalDays: number;
  maxDailyBudget: number;
  /* Performance (ROAS) mode */
  scaleUpRoas: number;
  scaleUpPct: number;
  scaleDownRoas: number;
  scaleDownPct: number;
}

export interface BudgetDurationCardProps {
  budgetTypes?: BudgetTypeOption[];
  paymentMethod?: string;
  onPaymentMethodChange?: (value: string) => void;
  showLifetimeToggle?: boolean;
  budgetMode: "daily" | "lifetime";
  onBudgetModeChange?: (mode: "daily" | "lifetime") => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  minAmount?: number;
  maxAmount?: number;
  suggestedDaily?: number;
  goalLabel?: string;
  platformName?: string;
  strengthTiers: { min: number; color: string; textColor: string; label: string }[];
  startDate: string;
  endDate: string;
  endDateOptional: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onEndDateOptionalChange?: (checked: boolean) => void;
  showRunContinuously?: boolean;
  endDateRequired?: boolean;
  minCampaignDays?: number;
  showAutoIncrease?: boolean;
  autoIncrease?: AutoIncreaseState;
  onAutoIncreaseChange?: (state: AutoIncreaseState) => void;
  showSmartStart?: boolean;
  onBulkUpdate?: (updates: Record<string, unknown>) => void;
}

/* ================================================================ */
/*  Helpers                                                          */
/* ================================================================ */

function computeEarliestGoLive(): { date: string; time: string; label: string; sameDayPossible: boolean } {
  const now = new Date();
  const saudiOffset = 3 * 60;
  const saudiMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + saudiOffset;
  const saudiHour = Math.floor(((saudiMinutes % 1440) + 1440) % 1440 / 60);

  const REVIEW_HOURS = 8;
  const OPS_START = 9;
  const OPS_END = 23;

  let goLiveDate = new Date(now);
  let goLiveHour: number;

  if (saudiHour < OPS_END - REVIEW_HOURS) {
    goLiveHour = Math.max(saudiHour + REVIEW_HOURS, OPS_START + REVIEW_HOURS);
    if (goLiveHour > OPS_END) {
      goLiveDate.setDate(goLiveDate.getDate() + 1);
      goLiveHour = OPS_START + REVIEW_HOURS;
    }
  } else {
    goLiveDate.setDate(goLiveDate.getDate() + 1);
    goLiveHour = OPS_START + REVIEW_HOURS;
  }

  const sameDayPossible = goLiveDate.toDateString() === now.toDateString();
  const dateStr = goLiveDate.toISOString().split("T")[0];
  const timeStr = `${goLiveHour.toString().padStart(2, "0")}:00`;

  let label: string;
  if (sameDayPossible) {
    label = `Today by ${goLiveHour > 12 ? goLiveHour - 12 : goLiveHour}:00 ${goLiveHour >= 12 ? "PM" : "AM"} AST`;
  } else {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    label = `${dayNames[goLiveDate.getDay()]}, ${monthNames[goLiveDate.getMonth()]} ${goLiveDate.getDate()} by ${goLiveHour > 12 ? goLiveHour - 12 : goLiveHour}:00 ${goLiveHour >= 12 ? "PM" : "AM"} AST`;
  }

  return { date: dateStr, time: timeStr, label, sameDayPossible };
}

/** Strength bar colors from lightest to darkest green */
const STRENGTH_BAR_COLORS = [
  "bg-[#d6f8f0]",
  "bg-[#baf3e6]",
  "bg-[#96edd9]",
  "bg-[#73e7cc]",
];

/* ================================================================ */
/*  Component                                                        */
/* ================================================================ */

export function BudgetDurationCard({
  budgetTypes = [],
  paymentMethod = "pay_as_you_go",
  onPaymentMethodChange,
  showLifetimeToggle = false,
  budgetMode = "daily",
  onBudgetModeChange,
  amount,
  onAmountChange,
  minAmount = 150,
  maxAmount = 500000,
  suggestedDaily,
  goalLabel = "actions",
  platformName = "the platform",
  strengthTiers,
  startDate,
  endDate,
  endDateOptional,
  onStartDateChange,
  onEndDateChange,
  onEndDateOptionalChange,
  showRunContinuously = true,
  endDateRequired = false,
  minCampaignDays = 7,
  showAutoIncrease = true,
  autoIncrease,
  onAutoIncreaseChange,
  showSmartStart = false,
  onBulkUpdate,
}: BudgetDurationCardProps) {
  const MIN_CAMPAIGN_DAYS = minCampaignDays;
  const ai = autoIncrease ?? { enabled: false, mode: "schedule" as const, pct: 20, intervalDays: 7, maxDailyBudget: amount * 3, scaleUpRoas: 3, scaleUpPct: 20, scaleDownRoas: 1.5, scaleDownPct: 10 };
  const autoIncreaseAvailable = showAutoIncrease && budgetMode === "daily";

  const durationDays =
    startDate && endDate
      ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
      : 14;

  const dailyAmount = budgetMode === "daily" ? amount : Math.round(amount / Math.max(1, durationDays));
  const currentMin = minAmount;
  const earliestGoLive = showSmartStart ? computeEarliestGoLive() : null;
  const currentTier = [...strengthTiers].reverse().find((t) => dailyAmount >= t.min) ?? strengthTiers[0];
  const tierIndex = strengthTiers.indexOf(currentTier);

  const minEndDate = (() => {
    if (!startDate) return new Date().toISOString().split("T")[0];
    const d = new Date(startDate);
    d.setDate(d.getDate() + MIN_CAMPAIGN_DAYS);
    return d.toISOString().split("T")[0];
  })();

  const applyPreset = (days: number) => {
    const start = earliestGoLive?.date ?? new Date().toISOString().split("T")[0];
    const startD = new Date(start);
    const end = new Date(startD);
    end.setDate(startD.getDate() + days);
    onStartDateChange(start);
    onEndDateChange(end.toISOString().split("T")[0]);
  };

  const isPreset = (days: number) => durationDays === days;
  const [customMode, setCustomMode] = useState(false);
  const [salaryBoostEnabled, setSalaryBoostEnabled] = useState(false);

  /* Auto-increase computations */
  const previewDays = endDateOptional ? 30 : durationDays;
  const autoIncreasePreview = (ai.enabled && autoIncreaseAvailable && (ai.mode ?? "schedule") === "schedule")
    ? Array.from({ length: Math.floor(previewDays / ai.intervalDays) }, (_, i) => {
        const day = (i + 1) * ai.intervalDays;
        const uncapped = Math.round(dailyAmount * Math.pow(1 + ai.pct / 100, i + 1));
        return { day, budget: Math.min(uncapped, ai.maxDailyBudget) };
      })
    : [];

  const projectedTotalSpend = (() => {
    if (!ai.enabled || !autoIncreaseAvailable || (ai.mode ?? "schedule") !== "schedule") return budgetMode === "daily" ? dailyAmount * previewDays : amount;
    let total = 0;
    let currentDaily = dailyAmount;
    for (let d = 1; d <= previewDays; d++) {
      total += Math.min(currentDaily, ai.maxDailyBudget);
      const stepIndex = Math.floor(d / ai.intervalDays);
      if (d % ai.intervalDays === 0 && d < previewDays) {
        currentDaily = Math.round(dailyAmount * Math.pow(1 + ai.pct / 100, stepIndex));
      }
    }
    return total;
  })();

  const finalAutoIncreaseDailyBudget = autoIncreasePreview.length > 0
    ? autoIncreasePreview[autoIncreasePreview.length - 1].budget
    : dailyAmount;

  const updateAI = (partial: Partial<AutoIncreaseState>) => {
    onAutoIncreaseChange?.({ ...ai, ...partial });
  };

  const handlePaymentMethodChange = (value: string) => {
    onPaymentMethodChange?.(value);
    if (value === "prepaid" && onBulkUpdate) {
      const updates: Record<string, unknown> = { endDateOptional: false };
      if (budgetMode === "lifetime") {
        updates.type = "daily";
        updates.amount = Math.max(minAmount, Math.round(amount / Math.max(1, durationDays)));
      }
      onBulkUpdate(updates);
    }
  };

  const handleRunContinuouslyChange = (checked: boolean) => {
    if (onBulkUpdate) {
      const updates: Record<string, unknown> = {
        endDateOptional: checked,
        ...(checked && { endDate: "" }),
      };
      if (checked && budgetMode === "lifetime") {
        updates.type = "daily";
        updates.amount = Math.max(minAmount, Math.round(amount / Math.max(1, durationDays)));
      }
      /* Auto-increase is now allowed for ongoing campaigns — no longer disabled */
      onBulkUpdate(updates);
    } else {
      onEndDateOptionalChange?.(checked);
    }
  };

  const handleLifetimeToggle = (mode: "daily" | "lifetime") => {
    if (mode === budgetMode) return;
    if (mode === "lifetime" && onBulkUpdate) {
      onBulkUpdate({
        type: "lifetime",
        amount: dailyAmount * durationDays,
        endDateOptional: false,
      });
      if (ai.enabled) onAutoIncreaseChange?.({ ...ai, enabled: false });
    } else if (mode === "daily" && onBulkUpdate) {
      onBulkUpdate({
        type: "daily",
        amount: Math.max(minAmount, Math.round(amount / Math.max(1, durationDays))),
      });
    }
    onBudgetModeChange?.(mode);
  };

  const vatAmount = projectedTotalSpend * 0.15;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* ── Header ── */}
      <div className="px-6 py-5">
        <h3 className="text-base font-bold text-foreground">
          Budget &amp; Ad Duration
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Set your spend, schedule, and expansion strategy.
        </p>
      </div>

      {/* ── 1. Payment Method ── */}
      {budgetTypes.length > 0 && (
        <div className="px-6 pb-5">
          <p className="mb-2 text-sm font-medium text-foreground">
            Payment Method
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {budgetTypes.map((m) => {
              const active = paymentMethod === m.value;
              const isPAYG = m.value === "pay_as_you_go";
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handlePaymentMethodChange(m.value)}
                  className={cn(
                    "flex flex-1 items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all",
                    active
                      ? "border-[#a4ffe5] bg-[#e6fff9]"
                      : "border-border bg-card hover:border-border/80"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      active ? "bg-[#a4ffe5]" : "bg-muted/60"
                    )}
                  >
                    {isPAYG ? (
                      <Wallet className={cn("size-5", active ? "text-[#004956]" : "text-muted-foreground")} />
                    ) : (
                      <Banknote className={cn("size-5", active ? "text-[#004956]" : "text-muted-foreground")} />
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "text-sm font-medium",
                      active ? "text-[#004956]" : "text-foreground"
                    )}>
                      {m.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {paymentMethod === "prepaid" && (
            <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex flex-col gap-2.5">
                {/* Upfront charge */}
                {startDate && endDate && durationDays >= 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Upfront charge</span>
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      SAR {(dailyAmount * durationDays).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="h-px bg-border/40" />
                {/* Key points */}
                <div className="flex flex-col gap-1.5">
                  <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <CalendarDays className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    Prepaid campaigns require a fixed end date
                  </p>
                  <p className="flex items-start gap-2 text-[11px] text-muted-foreground">
                    <Wallet className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    Full budget is charged when the campaign launches
                  </p>
                  <p className="flex items-start gap-2 text-[11px] text-[#004956]">
                    <Banknote className="mt-0.5 size-3 shrink-0 text-[#004956]" />
                    <span>If you stop early, <span className="font-semibold">unspent budget is automatically refunded</span> to your account</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="h-px bg-border/40" />

      {/* ── 2. Campaign Duration ── */}
      <div className="px-6 py-5">
        <p className="mb-4 text-sm font-medium text-foreground">
          Campaign Duration
        </p>

        {!endDateRequired && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {[
              { days: -1, label: "Ongoing" },
              { days: 14, label: "2 Weeks" },
              { days: 30, label: "1 Month" },
              { days: 0, label: "Custom" },
            ].map((preset) => {
              const active = preset.days === -1
                ? endDateOptional
                : preset.days === 0
                  ? !endDateOptional && (customMode || (!isPreset(14) && !isPreset(30)))
                  : !endDateOptional && !customMode && isPreset(preset.days);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    if (preset.days === -1) {
                      // Ongoing — no end date
                      setCustomMode(false);
                      handleRunContinuouslyChange(true);
                    } else if (preset.days > 0) {
                      setCustomMode(false);
                      if (endDateOptional) handleRunContinuouslyChange(false);
                      applyPreset(preset.days);
                    } else {
                      setCustomMode(true);
                      if (endDateOptional) handleRunContinuouslyChange(false);
                    }
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-[#e6fff9] text-[#004956] border border-[#a4ffe5]"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  )}
                >
                  {preset.label}
                  {preset.days === -1 && (
                    <span className="ml-1 text-[9px] font-bold uppercase text-[#004956]/60">Best</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Learning-phase nudge */}
        {endDateOptional && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2">
            <Sparkles className="mt-0.5 size-3 shrink-0 text-[#004956]" />
            <p className="text-[11px] leading-relaxed text-[#004956]/80">
              <span className="font-semibold text-[#004956]">Great choice.</span> Ongoing campaigns stay in the learning phase longer, resulting in up to 40% lower cost per result.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Start Date */}
          <div className="flex-1">
            <Label className="mb-2 block text-sm text-foreground">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const newStart = e.target.value;
                  onStartDateChange(newStart);
                  const newMinEnd = new Date(newStart);
                  newMinEnd.setDate(newMinEnd.getDate() + MIN_CAMPAIGN_DAYS);
                  const newMinEndStr = newMinEnd.toISOString().split("T")[0];
                  if (endDate && endDate < newMinEndStr) {
                    onEndDateChange(newMinEndStr);
                  }
                }}
                className="h-10 pl-10"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Label className="text-sm text-foreground">End Date</Label>
              {!endDateRequired && (
                <span className="text-xs text-muted-foreground">(Optional)</span>
              )}
            </div>
            {!endDateOptional ? (
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  min={minEndDate}
                  onChange={(e) => {
                    const picked = e.target.value;
                    onEndDateChange(picked < minEndDate ? minEndDate : picked);
                  }}
                  className="h-10 pl-10"
                />
              </div>
            ) : (
              <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-muted/30 px-3">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Until manually paused</span>
              </div>
            )}
          </div>
        </div>

        {startDate && endDate && endDate > startDate && durationDays >= MIN_CAMPAIGN_DAYS && (
          <p className="mt-1.5 text-xs text-muted-foreground">{durationDays} days</p>
        )}
        {startDate && endDate && endDate <= startDate && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="size-3 shrink-0" />
            End date must be after start date.
          </p>
        )}
        {startDate && endDate && endDate > startDate && durationDays > 0 && durationDays < MIN_CAMPAIGN_DAYS && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="size-3 shrink-0" />
            Minimum {MIN_CAMPAIGN_DAYS} days required for {platformName} to optimize.
          </p>
        )}

        {showSmartStart && startDate && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <div className="size-2 shrink-0 rounded-full bg-amber-500" />
            <p className="text-xs text-muted-foreground">
              Your campaign will go live after <span className="font-semibold text-foreground">Salla review</span> and <span className="font-semibold text-foreground">platform approval</span>
            </p>
          </div>
        )}
      </div>

      {/* ── 3. Daily Budget ── */}
      <div className="px-6 pb-5">
        {showLifetimeToggle && paymentMethod === "pay_as_you_go" && (
          <div className="mb-3 inline-flex rounded-lg bg-muted/50 p-0.5">
            {(["daily", "lifetime"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleLifetimeToggle(t)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-semibold transition-all",
                  budgetMode === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "daily" ? "Daily" : "Lifetime"}
              </button>
            ))}
          </div>
        )}

        <Label className="mb-2 block text-sm font-medium text-foreground">
          {budgetMode === "daily" ? "Daily Budget" : "Lifetime Budget"}
          <span className="text-red-500"> *</span>
        </Label>

        <div className="relative">
          <Input
            type="number"
            min={currentMin}
            max={maxAmount}
            value={amount || ""}
            onChange={(e) => onAmountChange(e.target.value === "" ? 0 : Math.min(maxAmount, Number(e.target.value)))}
            onBlur={() => { if (amount < currentMin) onAmountChange(currentMin); }}
            className="h-10 pr-10 text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            SAR
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          {budgetMode === "daily"
            ? <>Min {currentMin}/day{suggestedDaily ? <> &bull; Recommended <span className="font-semibold text-foreground">{suggestedDaily}</span></> : null}</>
            : <>Min SAR {currentMin} &bull; ~<span className="font-semibold text-foreground">SAR {dailyAmount}/day</span> over {durationDays}d</>
          }
        </p>

        {/* Strength bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-0.5 rounded-lg border-2 border-white">
            {STRENGTH_BAR_COLORS.map((color, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 w-6 rounded-lg",
                  i <= tierIndex ? color : "bg-muted/30"
                )}
              />
            ))}
          </div>
          <span className="rounded-full bg-[#e4faf5] px-2 py-0.5 text-xs font-medium text-[#004d5a]">
            {currentTier.label}
          </span>
          <p className="text-xs text-muted-foreground">
            {tierIndex >= strengthTiers.length - 1
              ? "A higher budget delivers high-impact reach and keeps you ahead of competitors."
              : tierIndex >= strengthTiers.length - 2
                ? "Good budget level — strong delivery expected."
                : "Consider increasing your budget for better reach."}
          </p>
        </div>

        {budgetMode === "daily" && (
          <p className="mt-2 text-xs text-muted-foreground">
            {endDateOptional ? (
              <>Est. monthly: <span className="font-semibold text-foreground">SAR {(dailyAmount * 30).toLocaleString()}</span>/month</>
            ) : endDate ? (
              <>
                Est. total: <span className="font-semibold text-foreground">SAR {(ai.enabled && autoIncreaseAvailable && (ai.mode ?? "schedule") === "schedule" ? projectedTotalSpend : dailyAmount * durationDays).toLocaleString()}</span> over {durationDays}d
                {ai.enabled && autoIncreaseAvailable && (ai.mode ?? "schedule") === "schedule" && (
                  <span className="ml-1 text-[#004956]">(incl. auto-increase)</span>
                )}
              </>
            ) : null}
          </p>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-border/40" />

      {/* ── 4. Salary Week Boost ── */}
      {endDateOptional && budgetMode === "daily" && (
        <div>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6fff9]">
                  <TrendingUp className="size-4 text-[#004956]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Salary Week Boost</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    Automatically increase budget during peak purchasing days (25th–5th of each month) and reduce mid-month spend.
                  </p>
                </div>
              </div>
              <Switch
                checked={salaryBoostEnabled}
                onCheckedChange={setSalaryBoostEnabled}
              />
            </div>

            {salaryBoostEnabled && (
              <div className="mt-4 rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/30 p-4">
                <div className="flex items-center gap-6">
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-[#004956]">2×</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Salary week</p>
                    <p className="text-[10px] text-muted-foreground">25th – 5th</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex-1 text-center">
                    <p className="text-lg font-bold text-muted-foreground">1×</p>
                    <p className="text-[10px] font-medium text-muted-foreground">Regular</p>
                    <p className="text-[10px] text-muted-foreground">6th – 24th</p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-white px-3 py-2">
                  <Info className="mt-0.5 size-3 shrink-0 text-[#004956]" />
                  <p className="text-[10px] leading-relaxed text-muted-foreground">
                    Your daily budget of <span className="font-semibold text-foreground">SAR {dailyAmount.toLocaleString()}</span> will increase to <span className="font-semibold text-[#004956]">SAR {(dailyAmount * 2).toLocaleString()}</span> during salary week. The campaign stays active all month — no need to stop and restart.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border/40" />
        </div>
      )}

      {/* ── 5. Auto-Increase Budget ── */}
      {showAutoIncrease && (
        <div>
          <div
            className="flex w-full cursor-pointer items-center justify-between px-6 py-5"
            onClick={() => {
              if (autoIncreaseAvailable) updateAI({ enabled: !ai.enabled });
            }}
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                Auto-Increase Budget
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Gradually scale your daily budget over time
              </p>
            </div>
            {autoIncreaseAvailable ? (
              <Switch
                checked={ai.enabled}
                onCheckedChange={(checked) => {
                  const updates: Partial<AutoIncreaseState> = { enabled: checked };
                  // Auto-set safety cap to 3× daily when first enabled
                  if (checked && ai.maxDailyBudget <= dailyAmount) {
                    updates.maxDailyBudget = dailyAmount * 3;
                  }
                  updateAI(updates);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Switch checked={false} disabled />
            )}
          </div>

          {!autoIncreaseAvailable && (
            <p className="px-6 -mt-3 pb-4 text-xs text-muted-foreground">
              Switch to Daily budget to enable.
            </p>
          )}

          {ai.enabled && autoIncreaseAvailable && (
            <div className="px-6 pb-5">
              {/* Mode toggle: By Schedule | By Performance */}
              <div className="mb-4 inline-flex rounded-lg bg-muted/50 p-0.5">
                {([
                  { value: "schedule" as const, label: "By Schedule", icon: CalendarDays },
                  { value: "performance" as const, label: "By Performance", icon: TrendingUp },
                ] as const).map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => updateAI({ mode: tab.value })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                      (ai.mode ?? "schedule") === tab.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="size-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Schedule mode ── */}
              {(ai.mode ?? "schedule") === "schedule" && (
                <>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-2/3">
                      <Label className="mb-2 block text-xs font-medium text-foreground">Increase every:</Label>
                      <Select
                        value={ai.intervalDays.toString()}
                        onValueChange={(v) => updateAI({ intervalDays: Number(v) })}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="5">5 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="mb-2 block text-xs font-medium text-foreground">Increase by</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min={5}
                          max={100}
                          step={5}
                          value={ai.pct || ""}
                          onChange={(e) => updateAI({ pct: e.target.value === "" ? 0 : Math.min(100, Number(e.target.value)) })}
                          onBlur={() => { if (ai.pct < 5) updateAI({ pct: 5 }); }}
                          className="h-10 pr-8 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary table */}
                  {autoIncreasePreview.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">Day 1</span>
                        <span className="text-xs font-medium tabular-nums text-foreground">SAR {dailyAmount.toFixed(2)}</span>
                      </div>
                      {autoIncreasePreview.slice(0, 3).map((step) => (
                        <div key={step.day} className="flex items-center justify-between">
                          <span className="text-xs text-foreground">Day {step.day}</span>
                          <span className="text-xs font-medium tabular-nums text-foreground">SAR {step.budget.toFixed(2)}</span>
                        </div>
                      ))}
                      {!endDateOptional && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground">VAT</span>
                            <span className="text-xs font-medium tabular-nums text-foreground">SAR {vatAmount.toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-border/40" />
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground">Estimated Total</span>
                            <span className="text-xs font-bold tabular-nums text-foreground">SAR {(projectedTotalSpend + vatAmount).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {(ai.pct >= 50 || finalAutoIncreaseDailyBudget > dailyAmount * 5) && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="size-3 shrink-0" />
                      Spend may reach SAR {finalAutoIncreaseDailyBudget.toLocaleString()}/day. Monitor and adjust as needed.
                    </p>
                  )}
                </>
              )}

              {/* ── Performance (ROAS) mode ── */}
              {(ai.mode ?? "schedule") === "performance" && (
                <>
                  <div className="rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/30 p-4">
                    <div className="flex items-start gap-2 mb-4">
                      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                      <p className="text-[11px] leading-relaxed text-[#004956]/80">
                        Budget adjusts automatically based on your campaign&apos;s return on ad spend. Scale up when performing well, pull back when not.
                      </p>
                    </div>

                    {/* Scale UP */}
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-foreground">📈 Scale up when ROAS exceeds</p>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              step={0.5}
                              value={ai.scaleUpRoas || ""}
                              onChange={(e) => updateAI({ scaleUpRoas: e.target.value === "" ? 0 : Number(e.target.value) })}
                              onBlur={() => { if ((ai.scaleUpRoas ?? 0) < 1) updateAI({ scaleUpRoas: 1 }); }}
                              className="h-10 pr-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">ROAS threshold</p>
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              type="number"
                              min={5}
                              max={100}
                              step={5}
                              value={ai.scaleUpPct || ""}
                              onChange={(e) => updateAI({ scaleUpPct: e.target.value === "" ? 0 : Math.min(100, Number(e.target.value)) })}
                              onBlur={() => { if ((ai.scaleUpPct ?? 0) < 5) updateAI({ scaleUpPct: 5 }); }}
                              className="h-10 pr-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">Increase by</p>
                        </div>
                      </div>
                    </div>

                    {/* Scale DOWN */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-foreground">📉 Scale down when ROAS drops below</p>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              type="number"
                              min={0.5}
                              max={10}
                              step={0.5}
                              value={ai.scaleDownRoas || ""}
                              onChange={(e) => updateAI({ scaleDownRoas: e.target.value === "" ? 0 : Number(e.target.value) })}
                              onBlur={() => { if ((ai.scaleDownRoas ?? 0) < 0.5) updateAI({ scaleDownRoas: 0.5 }); }}
                              className="h-10 pr-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">ROAS threshold</p>
                        </div>
                        <div className="flex-1">
                          <div className="relative">
                            <Input
                              type="number"
                              min={5}
                              max={50}
                              step={5}
                              value={ai.scaleDownPct || ""}
                              onChange={(e) => updateAI({ scaleDownPct: e.target.value === "" ? 0 : Math.min(50, Number(e.target.value)) })}
                              onBlur={() => { if ((ai.scaleDownPct ?? 0) < 5) updateAI({ scaleDownPct: 5 }); }}
                              className="h-10 pr-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">Decrease by</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Example */}
                  <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2.5">
                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Example:</span> With SAR {dailyAmount} daily budget — if ROAS is {ai.scaleUpRoas ?? 3}× or higher, budget increases to <span className="font-semibold text-[#004956]">SAR {Math.round(dailyAmount * (1 + (ai.scaleUpPct ?? 20) / 100))}</span>. If ROAS drops below {ai.scaleDownRoas ?? 1.5}×, budget decreases to <span className="font-semibold text-foreground">SAR {Math.round(dailyAmount * (1 - (ai.scaleDownPct ?? 10) / 100))}</span>.
                    </p>
                  </div>
                </>
              )}

              {/* Safety Cap — shared by both modes */}
              <div className="mt-4">
                <Label className="mb-2 block text-xs font-medium text-foreground">
                  Safety Cap (Daily Maximum) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={dailyAmount}
                    max={500000}
                    value={ai.maxDailyBudget || ""}
                    onChange={(e) => updateAI({ maxDailyBudget: e.target.value === "" ? 0 : Math.min(500000, Number(e.target.value)) })}
                    onBlur={() => { if (ai.maxDailyBudget < dailyAmount) updateAI({ maxDailyBudget: dailyAmount }); }}
                    className="h-10 pr-10 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">SAR</span>
                </div>
                {ai.maxDailyBudget > 0 && ai.maxDailyBudget <= dailyAmount && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600">
                    <AlertCircle className="size-3 shrink-0" />
                    Cap is equal to your daily budget — auto-increase will have no effect. Set it higher (e.g. SAR {(dailyAmount * 3).toLocaleString()}).
                  </p>
                )}
                {(ai.maxDailyBudget === 0 || ai.maxDailyBudget > dailyAmount) && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Budget will never exceed this amount per day, regardless of scaling mode.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
