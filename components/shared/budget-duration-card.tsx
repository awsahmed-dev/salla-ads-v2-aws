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
  pct: number;
  intervalDays: number;
  maxDailyBudget: number;
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
  const ai = autoIncrease ?? { enabled: false, pct: 20, intervalDays: 7, maxDailyBudget: amount * 3 };
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

  /* Auto-increase computations */
  const autoIncreasePreview = (ai.enabled && autoIncreaseAvailable)
    ? Array.from({ length: Math.floor(durationDays / ai.intervalDays) }, (_, i) => {
        const day = (i + 1) * ai.intervalDays;
        const uncapped = Math.round(dailyAmount * Math.pow(1 + ai.pct / 100, i + 1));
        return { day, budget: Math.min(uncapped, ai.maxDailyBudget) };
      })
    : [];

  const projectedTotalSpend = (() => {
    if (!ai.enabled || !autoIncreaseAvailable) return budgetMode === "daily" ? dailyAmount * durationDays : amount;
    let total = 0;
    let currentDaily = dailyAmount;
    for (let d = 1; d <= durationDays; d++) {
      total += Math.min(currentDaily, ai.maxDailyBudget);
      const stepIndex = Math.floor(d / ai.intervalDays);
      if (d % ai.intervalDays === 0 && d < durationDays) {
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
      if (checked && ai.enabled) {
        updates.autoIncrease = { ...ai, enabled: false };
      }
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
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600">
              <AlertCircle className="size-3 shrink-0" />
              Prepaid requires an end date. Full budget charged upfront.
            </p>
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
                min={earliestGoLive?.date ?? new Date().toISOString().split("T")[0]}
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
              <Label className="text-sm text-foreground">
                End Date
              </Label>
              {!endDateRequired && showRunContinuously && (
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
              <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-border bg-card px-3">
                <CalendarDays className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Until manually paused</span>
              </div>
            )}
            {/* "Run continuously" is now controlled by the Ongoing preset button above */}
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

        {showSmartStart && earliestGoLive && startDate &&
          (startDate === earliestGoLive.date || startDate === new Date().toISOString().split("T")[0]) && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <div className={cn(
              "size-2 shrink-0 rounded-full",
              earliestGoLive.sameDayPossible ? "bg-emerald-500" : "bg-amber-500"
            )} />
            <p className="text-xs text-muted-foreground">
              Go-live: <span className="font-semibold text-foreground">{earliestGoLive.label}</span> <span className="text-muted-foreground/70">(~8h review)</span>
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
            value={amount}
            onChange={(e) => onAmountChange(Math.max(currentMin, Math.min(maxAmount, Number(e.target.value))))}
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

        {budgetMode === "daily" && !endDateOptional && endDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Est. total: <span className="font-semibold text-foreground">SAR {(ai.enabled && autoIncreaseAvailable ? projectedTotalSpend : dailyAmount * durationDays).toLocaleString()}</span> over {durationDays}d
            {ai.enabled && autoIncreaseAvailable && (
              <span className="ml-1 text-[#004956]">(incl. auto-increase)</span>
            )}
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
                checked={ai.enabled && endDateOptional}
                onCheckedChange={(checked) => updateAI({ enabled: checked })}
              />
            </div>

            {ai.enabled && endDateOptional && (
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
                onCheckedChange={(checked) => updateAI({ enabled: checked })}
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
              {/* Increase every + amount */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-2/3">
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    Increase every:
                  </Label>
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
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    Increase Amount
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      step={5}
                      value={ai.pct}
                      onChange={(e) => updateAI({ pct: Math.max(5, Math.min(100, Number(e.target.value))) })}
                      className="h-10 pr-8 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety Cap — mandatory */}
              <div className="mt-4">
                <Label className="mb-2 block text-sm text-foreground">
                  Safety Cap (Daily Maximum) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={dailyAmount}
                    max={500000}
                    value={ai.maxDailyBudget}
                    onChange={(e) => updateAI({ maxDailyBudget: Math.max(dailyAmount, Math.min(500000, Number(e.target.value))) })}
                    className="h-10 pr-10 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    SAR
                  </span>
                </div>
                {endDateOptional && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Budget will increase until it reaches this cap, then stay flat. Required for ongoing campaigns.
                  </p>
                )}
              </div>

              {/* Summary table */}
              {autoIncreasePreview.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">Day 1</span>
                    <span className="text-xs font-medium tabular-nums text-foreground">
                      SAR {dailyAmount.toFixed(2)}
                    </span>
                  </div>
                  {autoIncreasePreview.slice(0, 3).map((step) => (
                    <div key={step.day} className="flex items-center justify-between">
                      <span className="text-xs text-foreground">Day {step.day}</span>
                      <span className="text-xs font-medium tabular-nums text-foreground">
                        SAR {step.budget.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">VAT</span>
                    <span className="text-xs font-medium tabular-nums text-foreground">
                      SAR {vatAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-border/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Estimated Total</span>
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      SAR {(projectedTotalSpend + vatAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {(ai.pct >= 50 || finalAutoIncreaseDailyBudget > dailyAmount * 5) && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="size-3 shrink-0" />
                  Spend may reach SAR {finalAutoIncreaseDailyBudget.toLocaleString()}/day. Monitor and adjust as needed.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
