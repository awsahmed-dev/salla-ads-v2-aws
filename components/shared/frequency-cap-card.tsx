"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Users, AlertCircle } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";

export type FrequencyCapAccent = "primary" | "meta" | "dv360";

const ACCENT = {
  primary: {
    icon: "text-primary",
    summaryBg: "bg-primary/5",
    summaryText: "text-primary",
    summaryIcon: "text-primary",
  },
  meta: {
    icon: "text-[#1877F2]",
    summaryBg: "bg-[#1877F2]/5",
    summaryText: "text-[#1877F2]",
    summaryIcon: "text-[#1877F2]",
  },
  dv360: {
    icon: "text-red-600",
    summaryBg: "bg-red-600/5",
    summaryText: "text-red-600",
    summaryIcon: "text-red-600",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Preset type                                                        */
/* ------------------------------------------------------------------ */

export interface FrequencyPreset {
  id: string;
  /** Number of impressions (e.g. 2, 4, 3, 6) */
  count: number;
  /** The time window value passed to onTimeWindowChange when selected */
  timeWindowValue: string;
  /** Display label for the time window (e.g. "7 days", "3 days") */
  timeWindowLabel: string;
  /** Short hint shown below the count (e.g. "Less fatigue", "Flash sales") */
  hint: string;
  /** Whether this preset is the recommended default */
  recommended?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface FrequencyCapCardProps {
  /** Whether frequency cap is enabled */
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  /** Max impressions per user (1-maxImpressionsMax) */
  maxImpressions: number;
  onMaxImpressionsChange: (v: number) => void;
  minImpressions?: number;
  maxImpressionsMax?: number;
  /** Current time window value (e.g. "48" for 48h, "7" for 7 days) */
  timeWindowValue: string;
  /** Options for the time window dropdown */
  timeWindowOptions: { value: string; label: string }[];
  onTimeWindowChange: (value: string) => void;
  /** Label for summary line, e.g. "2 days", "7 days", "1 day", or "day"/"week" for per-unit */
  timeWindowSummaryLabel: string;
  /** Summary sentence: "every X" (e.g. every 2 days) or "per X" (e.g. per day). Default "every". */
  summaryMode?: "every" | "per";
  /** Visual accent for icon and summary box */
  accent?: FrequencyCapAccent;
  /** Show warning about same ad format (Snap: required when using frequency cap) */
  showFormatWarning?: boolean;
  /** Tooltip next to title */
  infoTipText?: string;
  /** Optional API field badge text */
  apiBadge?: string;
  /** Optional tip below the dynamic summary (e.g. low/balanced/high frequency) */
  summaryTip?: React.ReactNode;
  /** When true, hide the enable/disable switch (card is always "on", e.g. TikTok Reach) */
  hideToggle?: boolean;
  /** Optional className for the card wrapper */
  className?: string;
  learnMoreTrigger?: React.ReactNode;
  /** Preset cards — when provided, renders a clickable grid instead of slider+dropdown */
  presets?: FrequencyPreset[];
  /** Called when a preset is clicked — use to batch-update both count and time window in one state update */
  onPresetSelect?: (count: number, timeWindowValue: string) => void;
  /** Additional content rendered at the bottom when enabled (e.g. mixed-format errors) */
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FrequencyCapCard({
  enabled,
  onEnabledChange,
  maxImpressions,
  onMaxImpressionsChange,
  minImpressions = 1,
  maxImpressionsMax = 20,
  timeWindowValue,
  timeWindowOptions,
  onTimeWindowChange,
  timeWindowSummaryLabel,
  summaryMode = "every",
  accent = "primary",
  showFormatWarning = false,
  infoTipText,
  apiBadge,
  summaryTip,
  hideToggle = false,
  className,
  learnMoreTrigger,
  presets,
  onPresetSelect,
  children,
}: FrequencyCapCardProps) {
  const style = ACCENT[accent];
  const isActive = enabled || hideToggle;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              isActive ? style.summaryBg : "bg-muted/50",
              isActive ? style.icon : "text-muted-foreground"
            )}
          >
            <ShieldCheck className="size-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-semibold text-foreground">
              Frequency Cap
            </Label>
            {apiBadge && (
              <span className="rounded bg-muted px-1.5 py-0 text-xs font-mono text-muted-foreground">
                {apiBadge}
              </span>
            )}
            {infoTipText && <InfoTip text={infoTipText} />}
            {learnMoreTrigger}
          </div>
        </div>
        {!hideToggle && (
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            className="shrink-0"
          />
        )}
      </div>

      <p className="mt-1.5 text-sm text-muted-foreground">
        {isActive
          ? "Limit how often one person sees your ad. Prevents fatigue and improves conversion efficiency."
          : "No limit on how many times a user sees your ad. Enable to control ad frequency."}
      </p>

      {isActive && (
        <div className="mt-4 space-y-3">

          {/* ---- Preset cards mode ---- */}
          {presets && presets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {presets.map((preset) => {
                const isSelected =
                  maxImpressions === preset.count &&
                  timeWindowValue === preset.timeWindowValue;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (onPresetSelect) {
                        onPresetSelect(preset.count, preset.timeWindowValue);
                      } else {
                        onMaxImpressionsChange(preset.count);
                        onTimeWindowChange(preset.timeWindowValue);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center rounded-xl border py-3 transition-all",
                      isSelected
                        ? cn("border-current shadow-sm", style.summaryBg, style.summaryText)
                        : "border-border bg-background hover:border-current/40"
                    )}
                  >
                    <span
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        isSelected ? style.summaryText : "text-foreground"
                      )}
                    >
                      {preset.count}x
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {preset.timeWindowLabel}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        isSelected
                          ? cn(style.summaryBg, style.summaryText)
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {preset.recommended && !isSelected ? "\u2605 " : ""}
                      {preset.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* ---- Slider + dropdown mode ---- */
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Label className="mb-1.5 block text-xs font-medium text-foreground">
                    Max impressions per user
                  </Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[Math.max(minImpressions, Math.min(maxImpressionsMax, maxImpressions))]}
                      min={minImpressions}
                      max={maxImpressionsMax}
                      step={1}
                      onValueChange={([v]) =>
                        onMaxImpressionsChange(Math.max(minImpressions, Math.min(maxImpressionsMax, v ?? minImpressions)))
                      }
                      className="flex-1"
                    />
                    <span className="w-9 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
                      {maxImpressions}
                    </span>
                  </div>
                </div>
                <div className="w-full sm:w-36">
                  <Label className="mb-1.5 block text-xs font-medium text-foreground">
                    Per time window
                  </Label>
                  <Select
                    value={timeWindowValue}
                    onValueChange={onTimeWindowChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeWindowOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ---- Summary bar ---- */}
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg px-3 py-2.5",
              style.summaryBg
            )}
          >
            <Users className={cn("mt-0.5 size-4 shrink-0", style.summaryIcon)} />
            <p className={cn("text-sm font-medium", style.summaryText)}>
              Each person sees your ad up to{" "}
              <span className="font-bold">{maxImpressions}x</span>{" "}
              {summaryMode === "per" ? "per " : "every "}
              <span className="font-bold">{timeWindowSummaryLabel}</span>
            </p>
          </div>

          {summaryTip && (
            <div className="text-xs text-muted-foreground">{summaryTip}</div>
          )}

          {showFormatWarning && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-950/30">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                Frequency capping requires all ads to use the same format. If you
                mix formats, disable this setting.
              </p>
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
}
