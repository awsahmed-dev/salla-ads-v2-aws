"use client";

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
  Calendar,
  CreditCard,
  AlertCircle,
  CalendarClock,
  ArrowUpRight,
  Wallet,
  Sparkles,
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

  /* ── Generic updater for complex state transitions ── */
  onBulkUpdate?: (updates: Record<string, unknown>) => void;
}

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
  minAmount = 20,
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

  const currentMin = budgetMode === "daily" ? minAmount : Math.max(minAmount, 100);

  const currentTier = [...strengthTiers].reverse().find((t) => dailyAmount >= t.min) ?? strengthTiers[0];

  const minEndDate = (() => {
    if (!startDate) return new Date().toISOString().split("T")[0];
    const d = new Date(startDate);
    d.setDate(d.getDate() + MIN_CAMPAIGN_DAYS);
    return d.toISOString().split("T")[0];
  })();

  const applyPreset = (days: number) => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + days);
    onStartDateChange(today.toISOString().split("T")[0]);
    onEndDateChange(end.toISOString().split("T")[0]);
  };

  const isPreset = (days: number) => durationDays === days;

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
        <div className={cn("grid gap-2.5", budgetTypes.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
          {budgetTypes.map((m) => {
            const active = paymentMethod === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handlePaymentMethodChange(m.value)}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-transparent bg-muted/40 hover:border-primary/20 hover:bg-muted/60"
                )}
              >
                <div className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground shadow-sm"
                )}>
                  {m.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>
                    {m.label}
                  </span>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.desc}</p>
                </div>
                {active && (
                  <div className="absolute -right-px -top-px flex size-5 items-center justify-center rounded-bl-lg rounded-tr-xl bg-primary">
                    <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {paymentMethod === "prepaid" && (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2">
            <AlertCircle className="size-3.5 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700">Prepaid requires an end date. The full budget will be charged upfront.</p>
          </div>
        )}
      </div>
      )}

      <div className="h-px bg-border/60" />

      {/* ── 2. Budget Amount ── */}
      <div className="mt-5 mb-5">
        {showLifetimeToggle && paymentMethod === "pay_as_you_go" && (
          <div className="mb-4 inline-flex rounded-lg bg-muted/50 p-0.5">
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

        <Label className="mb-1 block text-xs font-medium text-foreground">
          {budgetMode === "daily" ? "Daily Budget" : "Lifetime Budget"}
        </Label>
        <p className="mb-2.5 text-xs text-muted-foreground">
          {budgetMode === "daily"
            ? "The maximum amount you want to spend each day."
            : `The total budget for the entire campaign. ${platformName} distributes it across the duration.`}
        </p>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/60">SAR</span>
          <Input
            type="number"
            min={currentMin}
            max={maxAmount}
            value={amount}
            onChange={(e) => onAmountChange(Math.max(currentMin, Math.min(maxAmount, Number(e.target.value))))}
            className="h-12 pl-12 text-lg font-semibold tabular-nums"
          />
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {budgetMode === "daily"
              ? <>Min SAR {currentMin}/day{suggestedDaily ? <> &middot; Recommended <span className="font-semibold text-foreground">SAR {suggestedDaily}</span> for {goalLabel}</> : null}</>
              : <>Min SAR {currentMin} &middot; ~<span className="font-semibold text-foreground">SAR {dailyAmount}/day</span> over {durationDays} days</>
            }
          </p>
          {budgetMode === "daily" && suggestedDaily && amount !== suggestedDaily && (
            <button
              type="button"
              onClick={() => onAmountChange(suggestedDaily)}
              className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              Use recommended
            </button>
          )}
        </div>

        {budgetMode === "daily" && !endDateOptional && endDate && (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <Wallet className="size-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Est. total: <span className="font-semibold text-foreground">SAR {(ai.enabled && autoIncreaseAvailable ? projectedTotalSpend : dailyAmount * durationDays).toLocaleString()}</span> over {durationDays} days
              {ai.enabled && autoIncreaseAvailable && (
                <span className="ml-1 text-primary">(incl. auto-increase)</span>
              )}
            </p>
          </div>
        )}

        {/* Strength bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-xs font-semibold", currentTier.textColor)}>{currentTier.label}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">SAR {dailyAmount}/day</span>
          </div>
          <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
            {strengthTiers.map((tier, i) => (
              <div
                key={i}
                className={cn("flex-1 rounded-full transition-all", dailyAmount >= tier.min ? tier.color : "bg-muted")}
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {dailyAmount >= 500
              ? `Strong budget. Outperforms competitors in the ${platformName} auction.`
              : dailyAmount >= 150
                ? "Good start. A higher budget helps compete more effectively."
                : "Consider increasing -- the algorithm needs enough data to optimize."}
          </p>
        </div>
      </div>

      <div className="h-px bg-border/60" />

      {/* ── 3. Duration ── */}
      <div className="mt-5 mb-4">
        <Label className="mb-2.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</Label>

        {showRunContinuously && !endDateRequired && (
          <div className={cn(
            "mb-3 flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
            endDateOptional ? "border-primary/30 bg-primary/5" : "border-border/60 bg-background"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                endDateOptional ? "bg-primary/10" : "bg-muted/60"
              )}>
                <CalendarClock className={cn("size-4", endDateOptional ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Run continuously</p>
                <p className="text-[11px] text-muted-foreground">No end date -- runs until paused or budget depleted.</p>
              </div>
            </div>
            <Switch
              checked={endDateOptional}
              onCheckedChange={handleRunContinuouslyChange}
            />
          </div>
        )}

        {!endDateOptional && (
          <div className="mb-3 flex gap-1.5">
            {[
              { days: 7, label: "1 Week" },
              { days: 14, label: "2 Weeks" },
              { days: 30, label: "1 Month" },
              { days: 0, label: "Custom" },
            ].map((preset) => {
              const active = preset.days === 0
                ? !isPreset(7) && !isPreset(14) && !isPreset(30)
                : isPreset(preset.days);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    if (preset.days > 0) applyPreset(preset.days);
                    else {
                      onStartDateChange(new Date().toISOString().split("T")[0]);
                      onEndDateChange("");
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
            <Label className="mb-1.5 block text-xs text-muted-foreground">Start</Label>
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
              className="h-10"
            />
          </div>
          {!endDateOptional && (
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs text-muted-foreground">
                End {endDateRequired && <span className="text-red-500">*</span>}
              </Label>
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
          )}
          {endDateOptional && (
            <div className="flex flex-1 items-end pb-0.5">
              <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3">
                <CalendarClock className="size-3.5 text-primary/60" />
                <span className="text-xs font-medium text-primary/70">Ongoing</span>
              </div>
            </div>
          )}
        </div>

        {startDate && endDate && endDate > startDate && durationDays >= MIN_CAMPAIGN_DAYS && (
          <div className="mt-2 flex items-center gap-1.5">
            <Calendar className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{durationDays} days</span>
          </div>
        )}

        {startDate && endDate && endDate <= startDate && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertCircle className="size-3.5 shrink-0 text-red-600" />
            <p className="text-xs text-red-700">End date must be after start date.</p>
          </div>
        )}
        {startDate && endDate && endDate > startDate && durationDays > 0 && durationDays < MIN_CAMPAIGN_DAYS && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            <p className="text-xs leading-relaxed text-red-700">
              Minimum {MIN_CAMPAIGN_DAYS} days required. {platformName} needs enough time to optimize delivery.
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
            "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
            ai.enabled ? "border-primary/30 bg-primary/5" : "border-border/60 bg-background"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                ai.enabled ? "bg-primary/10" : "bg-muted/60"
              )}>
                <ArrowUpRight className={cn("size-4", ai.enabled ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-foreground">Budget Auto-Increase</p>
                  <Badge className="rounded-full border-0 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary">Salla</Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {ai.enabled
                    ? `+${ai.pct}% every ${ai.intervalDays} days, up to SAR ${ai.maxDailyBudget.toLocaleString()}/day`
                    : "Scale winning campaigns gradually as results come in."}
                </p>
              </div>
            </div>
            <Switch
              checked={ai.enabled}
              onCheckedChange={(checked) => updateAI({ enabled: checked })}
            />
          </div>

          {ai.enabled && (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-muted/30 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Label className="mb-2 block text-xs font-medium text-foreground">Increase by</Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[ai.pct]}
                        min={5}
                        max={100}
                        step={5}
                        onValueChange={([v]) => updateAI({ pct: v })}
                        className="flex-1"
                      />
                      <span className="w-14 rounded-md bg-background px-2 py-1 text-center text-sm font-bold tabular-nums text-foreground shadow-sm">{ai.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-36">
                    <Label className="mb-2 block text-xs font-medium text-foreground">Every</Label>
                    <Select
                      value={ai.intervalDays.toString()}
                      onValueChange={(v) => updateAI({ intervalDays: Number(v) })}
                    >
                      <SelectTrigger className="h-9 bg-background shadow-sm">
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

                <div className="mt-4 flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="mb-1.5 block text-xs font-medium text-foreground">Safety cap</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">SAR</span>
                      <Input
                        type="number"
                        min={dailyAmount}
                        max={500000}
                        value={ai.maxDailyBudget}
                        onChange={(e) => updateAI({ maxDailyBudget: Math.max(dailyAmount, Math.min(500000, Number(e.target.value))) })}
                        className="h-9 bg-background pl-11 text-sm shadow-sm"
                      />
                    </div>
                  </div>
                  <p className="pb-2 text-[11px] text-muted-foreground">max daily budget</p>
                </div>
              </div>

              {autoIncreasePreview.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <div className="flex items-center justify-between bg-muted/30 px-4 py-2">
                    <span className="text-xs font-semibold text-foreground">Schedule Preview</span>
                    <span className="text-[10px] text-muted-foreground">{autoIncreasePreview.length + 1} periods</span>
                  </div>
                  <div className="flex max-h-36 flex-col divide-y divide-border/40 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-muted-foreground/40" />
                        <span className="text-xs text-muted-foreground">Day 1</span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-foreground">SAR {dailyAmount.toLocaleString()}/day</span>
                    </div>
                    {autoIncreasePreview.map((step) => {
                      const capped = step.budget >= ai.maxDailyBudget;
                      return (
                        <div key={step.day} className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("size-1.5 rounded-full", capped ? "bg-amber-500" : "bg-primary")} />
                            <span className={cn("text-xs", capped ? "text-amber-700" : "text-muted-foreground")}>Day {step.day}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ArrowUpRight className={cn("size-3", capped ? "text-amber-500" : "text-primary")} />
                            <span className={cn("text-xs font-semibold tabular-nums", capped ? "text-amber-700" : "text-primary")}>
                              SAR {step.budget.toLocaleString()}/day
                            </span>
                            {capped && <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium text-amber-700">CAP</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-primary/5 px-4 py-2.5">
                    <span className="text-xs font-semibold text-foreground">Projected total</span>
                    <span className="text-sm font-bold tabular-nums text-primary">SAR {projectedTotalSpend.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {(ai.pct >= 50 || finalAutoIncreaseDailyBudget > dailyAmount * 5) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-relaxed text-amber-700">
                    Spend will reach up to <span className="font-semibold">SAR {finalAutoIncreaseDailyBudget.toLocaleString()}/day</span>. Monitor performance and adjust if needed.
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-emerald-50/50 px-3 py-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                <p className="text-xs leading-relaxed text-emerald-700">
                  <span className="font-semibold">Tip:</span> Start with 10-20% every 7 days. Only enable after 3-5 days of positive results.
                </p>
              </div>
            </div>
          )}
        </>
        ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border/60 px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50">
            <ArrowUpRight className="size-4 text-muted-foreground/50" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground/70">Budget Auto-Increase</p>
              <Badge className="rounded-full border-0 bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground/60">Salla</Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {budgetMode === "lifetime"
                ? "Switch to Daily budget to enable auto-increase."
                : "Set a fixed end date to enable auto-increase."}
            </p>
          </div>
        </div>
        )}
      </div>
      )}
    </div>
  );
}
