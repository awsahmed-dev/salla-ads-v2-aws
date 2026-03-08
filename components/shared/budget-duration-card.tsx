"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  AlertCircle,
  CalendarClock,
  ArrowUpRight,
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
  /* ── Budget type (Pay-as-you-go / Prepaid) ── */
  /** Pass empty array or omit to hide the budget type selector (e.g. DV360) */
  budgetTypes?: BudgetTypeOption[];
  paymentMethod?: string;
  onPaymentMethodChange?: (value: string) => void;

  /* ── Daily / Lifetime toggle ── */
  /** Whether to show the daily/lifetime segmented control (only Snapchat pay-as-you-go) */
  showLifetimeToggle?: boolean;
  budgetMode: "daily" | "lifetime";
  onBudgetModeChange?: (mode: "daily" | "lifetime") => void;

  /* ── Budget amount ── */
  amount: number;
  onAmountChange: (amount: number) => void;
  minAmount?: number;
  maxAmount?: number;
  suggestedDaily?: number;
  goalLabel?: string;
  /** Platform name for copy (e.g. "Snap", "TikTok", "DV360") */
  platformName?: string;

  /* ── Strength tiers ── */
  strengthTiers: { min: number; color: string; textColor: string; label: string }[];

  /* ── Duration ── */
  startDate: string;
  endDate: string;
  endDateOptional: boolean;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onEndDateOptionalChange?: (checked: boolean) => void;
  /** Whether to show the "Run continuously" toggle */
  showRunContinuously?: boolean;
  /** Whether end date is always required (e.g. prepaid or lifetime) */
  endDateRequired?: boolean;
  minCampaignDays?: number;

  /* ── Auto-increase ── */
  showAutoIncrease?: boolean;
  autoIncrease?: AutoIncreaseState;
  onAutoIncreaseChange?: (state: AutoIncreaseState) => void;

  /* ── Smart start time ── */
  /** Show smart start time with review queue awareness (Salla Ads feature) */
  showSmartStart?: boolean;

  /* ── Generic updater for complex state transitions ── */
  onBulkUpdate?: (updates: Record<string, unknown>) => void;
}

/* ================================================================ */
/*  Component                                                        */
/* ================================================================ */

/**
 * Compute the earliest go-live date/time given Saudi Arabia business hours.
 * Review takes ~8 hours and the Salla Ads operations team works 9 AM - 11 PM AST (UTC+3).
 */
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
    // Submitted early enough — can go live same day
    goLiveHour = Math.max(saudiHour + REVIEW_HOURS, OPS_START + REVIEW_HOURS);
    if (goLiveHour > OPS_END) {
      // Spills into next day
      goLiveDate.setDate(goLiveDate.getDate() + 1);
      goLiveHour = OPS_START + REVIEW_HOURS;
    }
  } else {
    // Too late today — review starts next morning
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
  const autoIncreaseAvailable = showAutoIncrease && budgetMode === "daily" && !endDateOptional;

  const durationDays =
    startDate && endDate
      ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
      : 14;

  const dailyAmount = budgetMode === "daily" ? amount : Math.round(amount / Math.max(1, durationDays));

  const currentMin = minAmount;

  const earliestGoLive = showSmartStart ? computeEarliestGoLive() : null;

  const currentTier = [...strengthTiers].reverse().find((t) => dailyAmount >= t.min) ?? strengthTiers[0];

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

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      {/* ── Card header ── */}
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <DollarSign className="size-4 text-primary" />
        </div>
        <div>
          <Label className="text-sm font-semibold text-foreground">Budget & Duration</Label>
          <p className="text-xs text-muted-foreground">Configure your spend, schedule, and scaling strategy.</p>
        </div>
      </div>

      {/* ── 1. Budget Type ── */}
      {budgetTypes.length > 0 && (
      <div className="mb-5">
        <Label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget Type</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {budgetTypes.map((m) => {
            const active = paymentMethod === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handlePaymentMethodChange(m.value)}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-background hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                  active ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
                )}>
                  {m.icon}
                </div>
                <div className="min-w-0">
                  <span className={cn("text-xs font-semibold leading-tight", active ? "text-primary" : "text-foreground")}>
                    {m.label}
                  </span>
                  <p className="text-[10px] leading-snug text-muted-foreground">{m.desc}</p>
                </div>
                {active && (
                  <div className="absolute -right-px -top-px flex size-4 items-center justify-center rounded-bl-md rounded-tr-lg bg-primary">
                    <svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
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

      <div className="h-px bg-border/60" />

      {/* ── 2. Budget Amount ── */}
      <div className="mt-5 mb-5">
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

        <Label className="mb-1.5 block text-xs font-medium text-foreground">
          {budgetMode === "daily" ? "Daily Budget" : "Lifetime Budget"}
        </Label>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/60">SAR</span>
            <Input
              type="number"
              min={currentMin}
              max={maxAmount}
              value={amount}
              onChange={(e) => onAmountChange(Math.max(currentMin, Math.min(maxAmount, Number(e.target.value))))}
              className="h-11 pl-12 text-lg font-semibold tabular-nums"
            />
          </div>
          <span className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            currentTier.textColor,
            currentTier.textColor.includes("red") && "border-red-200 bg-red-50",
            currentTier.textColor.includes("orange") && "border-orange-200 bg-orange-50",
            currentTier.textColor.includes("yellow") && "border-yellow-200 bg-yellow-50",
            currentTier.textColor.includes("emerald") && "border-emerald-200 bg-emerald-50",
            currentTier.textColor.includes("primary") && "border-primary/20 bg-primary/10",
          )}>
            {currentTier.label}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <p>
            {budgetMode === "daily"
              ? <>Min SAR {currentMin}/day{suggestedDaily ? <> · Rec. <span className="font-semibold text-foreground">SAR {suggestedDaily}</span></> : null}</>
              : <>Min SAR {currentMin} · ~<span className="font-semibold text-foreground">SAR {dailyAmount}/day</span> over {durationDays}d</>
            }
          </p>
          {budgetMode === "daily" && suggestedDaily && amount !== suggestedDaily && (
            <button
              type="button"
              onClick={() => onAmountChange(suggestedDaily)}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Use recommended
            </button>
          )}
        </div>

        {budgetMode === "daily" && !endDateOptional && endDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Est. total: <span className="font-semibold text-foreground">SAR {(ai.enabled && autoIncreaseAvailable ? projectedTotalSpend : dailyAmount * durationDays).toLocaleString()}</span> over {durationDays}d
            {ai.enabled && autoIncreaseAvailable && (
              <span className="ml-1 text-primary">(incl. auto-increase)</span>
            )}
          </p>
        )}
      </div>

      <div className="h-px bg-border/60" />

      {/* ── 3. Duration ── */}
      <div className="mt-5 mb-4">
        <div className="mb-2.5 flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</Label>
          <span className="text-[10px] text-muted-foreground">AST (UTC+3)</span>
        </div>

        {!endDateOptional && (
          <div className="mb-3 flex gap-1.5">
            {[
              { days: 7, label: "1 Week" },
              { days: 14, label: "2 Weeks" },
              { days: 30, label: "1 Month" },
              { days: 0, label: "Custom" },
            ].map((preset) => {
              const active = preset.days === 0
                ? customMode || (!isPreset(7) && !isPreset(14) && !isPreset(30))
                : !customMode && isPreset(preset.days);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    if (preset.days > 0) {
                      setCustomMode(false);
                      applyPreset(preset.days);
                    } else {
                      setCustomMode(true);
                    }
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Start date</Label>
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
              className="h-10"
            />
          </div>
          {!endDateOptional ? (
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  End date {endDateRequired && <span className="text-red-500">*</span>}
                </Label>
                {showRunContinuously && !endDateRequired && (
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={endDateOptional}
                      onChange={(e) => handleRunContinuouslyChange(e.target.checked)}
                      className="size-3 rounded border-muted-foreground/40 text-primary accent-primary"
                    />
                    <span className="text-[11px] text-muted-foreground">No end date</span>
                  </label>
                )}
              </div>
              <Input
                type="date"
                value={endDate}
                min={minEndDate}
                onChange={(e) => {
                  const picked = e.target.value;
                  onEndDateChange(picked < minEndDate ? minEndDate : picked);
                }}
                className="h-10"
              />
            </div>
          ) : (
            <div className="flex-1">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">End date</Label>
                {showRunContinuously && !endDateRequired && (
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={endDateOptional}
                      onChange={(e) => handleRunContinuouslyChange(e.target.checked)}
                      className="size-3 rounded border-muted-foreground/40 text-primary accent-primary"
                    />
                    <span className="text-[11px] text-muted-foreground">No end date</span>
                  </label>
                )}
              </div>
              <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3">
                <CalendarClock className="size-3.5 text-primary/60" />
                <span className="text-xs font-medium text-primary/70">Ongoing — runs until paused</span>
              </div>
            </div>
          )}
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

        {/* ── Smart Start: Estimated Go-Live (only for same-day / earliest start) ── */}
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

      <div className="h-px bg-border/60" />

      {/* ── 4. Budget Auto-Increase ── */}
      {showAutoIncrease && (
      <div className="mt-5">
        {autoIncreaseAvailable ? (
        <>
          <div className={cn(
            "flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors",
            ai.enabled ? "border-primary/30 bg-primary/5" : "border-border/60 bg-background"
          )}>
            <div className="flex items-center gap-2.5">
              <ArrowUpRight className={cn("size-4", ai.enabled ? "text-primary" : "text-muted-foreground")} />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground">Budget Auto-Increase</p>
                  <Badge className="rounded-full border-0 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary">Salla</Badge>
                </div>
                {ai.enabled && (
                  <p className="text-[11px] text-muted-foreground">
                    +{ai.pct}% every {ai.intervalDays}d · cap SAR {ai.maxDailyBudget.toLocaleString()}/day
                  </p>
                )}
              </div>
            </div>
            <Switch
              checked={ai.enabled}
              onCheckedChange={(checked) => updateAI({ enabled: checked })}
            />
          </div>

          {ai.enabled && (
            <div className="mt-2.5 rounded-lg bg-muted/30 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Label className="mb-1.5 block text-[11px] font-medium text-foreground">Increase by</Label>
                  <div className="flex items-center gap-2.5">
                    <Slider
                      value={[ai.pct]}
                      min={5}
                      max={100}
                      step={5}
                      onValueChange={([v]) => updateAI({ pct: v })}
                      className="flex-1"
                    />
                    <span className="w-12 rounded-md bg-background px-2 py-0.5 text-center text-xs font-bold tabular-nums text-foreground shadow-sm">{ai.pct}%</span>
                  </div>
                </div>
                <div className="w-full sm:w-32">
                  <Label className="mb-1.5 block text-[11px] font-medium text-foreground">Every</Label>
                  <Select
                    value={ai.intervalDays.toString()}
                    onValueChange={(v) => updateAI({ intervalDays: Number(v) })}
                  >
                    <SelectTrigger className="h-8 bg-background text-xs shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 flex items-end gap-2.5">
                <div className="flex-1">
                  <Label className="mb-1 block text-[11px] font-medium text-foreground">Safety cap (max daily)</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">SAR</span>
                    <Input
                      type="number"
                      min={dailyAmount}
                      max={500000}
                      value={ai.maxDailyBudget}
                      onChange={(e) => updateAI({ maxDailyBudget: Math.max(dailyAmount, Math.min(500000, Number(e.target.value))) })}
                      className="h-8 bg-background pl-10 text-xs shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Compact schedule preview */}
              {autoIncreasePreview.length > 0 && (
                <div className="mt-3 space-y-0.5">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-muted-foreground">Day 1</span>
                    <span className="text-[11px] font-semibold tabular-nums text-foreground">SAR {dailyAmount.toLocaleString()}/day</span>
                  </div>
                  {autoIncreasePreview.slice(0, 3).map((step) => {
                    const capped = step.budget >= ai.maxDailyBudget;
                    return (
                      <div key={step.day} className="flex items-center justify-between py-1">
                        <span className={cn("text-[11px]", capped ? "text-amber-600" : "text-muted-foreground")}>Day {step.day}</span>
                        <span className={cn("text-[11px] font-semibold tabular-nums", capped ? "text-amber-600" : "text-primary")}>
                          SAR {step.budget.toLocaleString()}/day{capped ? " (cap)" : ""}
                        </span>
                      </div>
                    );
                  })}
                  {autoIncreasePreview.length > 3 && (
                    <p className="py-0.5 text-center text-[10px] text-muted-foreground/60">+{autoIncreasePreview.length - 3} more periods</p>
                  )}
                  <div className="flex items-center justify-between border-t border-border/40 pt-1.5">
                    <span className="text-[11px] font-semibold text-foreground">Projected total</span>
                    <span className="text-xs font-bold tabular-nums text-primary">SAR {projectedTotalSpend.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {(ai.pct >= 50 || finalAutoIncreaseDailyBudget > dailyAmount * 5) && (
                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-600">
                  <AlertCircle className="size-3 shrink-0" />
                  Spend may reach SAR {finalAutoIncreaseDailyBudget.toLocaleString()}/day. Monitor and adjust as needed.
                </p>
              )}
            </div>
          )}
        </>
        ) : (
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/60 px-3 py-2.5">
          <ArrowUpRight className="size-4 text-muted-foreground/50" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground/70">Budget Auto-Increase</p>
              <Badge className="rounded-full border-0 bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground/60">Salla</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {budgetMode === "lifetime"
                ? "Switch to Daily budget to enable."
                : "Set a fixed end date to enable."}
            </p>
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
}
