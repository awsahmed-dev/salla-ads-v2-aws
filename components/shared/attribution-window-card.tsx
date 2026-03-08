"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Clock, MousePointerClick, Eye, Sparkles, ArrowRight } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface CombinedOption {
  value: string;
  label: string;
  desc?: string;
  recommended?: boolean;
  clickWindow?: string;
  viewWindow?: string;
  requiresEligibility?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

interface AttributionWindowCardProps {
  mode: "combined" | "separate";
  combinedOptions?: CombinedOption[];
  combinedValue?: string;
  onCombinedChange?: (v: string) => void;
  clickOptions?: SelectOption[];
  viewOptions?: SelectOption[];
  clickValue?: string;
  viewValue?: string;
  onClickChange?: (v: string) => void;
  onViewChange?: (v: string) => void;
  subtitle?: string;
  tip?: string;
  accent?: string;
  apiBadge?: string;
  icon?: React.ReactNode;
  infoTipText?: string;
  goalContext?: string;
  children?: React.ReactNode;
}

export function AttributionWindowCard({
  mode,
  combinedOptions,
  combinedValue,
  onCombinedChange,
  clickOptions,
  viewOptions,
  clickValue,
  viewValue,
  onClickChange,
  onViewChange,
  subtitle,
  tip,
  accent = "primary",
  apiBadge,
  icon,
  infoTipText = "How long after seeing your ad should results be counted?",
  goalContext,
  children,
}: AttributionWindowCardProps) {
  const isCustomAccent = accent.startsWith("#");
  const accentStyle = isCustomAccent ? { color: accent } : undefined;

  const selectedOption = combinedOptions?.find((o) => o.value === combinedValue);

  return (
    <SectionCard>
      <div className="mb-3 flex items-center gap-2">
        {icon ?? (
          <Clock
            className={cn("size-4", !isCustomAccent && "text-primary")}
            style={accentStyle}
          />
        )}
        <Label className="text-sm font-semibold text-foreground">
          Attribution Window
        </Label>
        {apiBadge && (
          <Badge
            variant="secondary"
            className="rounded-full px-1.5 py-0 text-[10px] font-normal"
          >
            {apiBadge}
          </Badge>
        )}
        <InfoTip text={infoTipText} />
      </div>

      {subtitle && (
        <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
      )}

      {/* Click vs View explainer */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <MousePointerClick className="size-3 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">Click-through</span>
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            User <span className="font-medium text-foreground">swipes up</span> on your ad, then buys later
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Eye className="size-3 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">View-through</span>
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            User <span className="font-medium text-foreground">sees</span> your ad (no click), then buys later
          </p>
        </div>
      </div>

      {mode === "combined" && combinedOptions && onCombinedChange && (
        <div className="flex flex-col gap-2">
          {combinedOptions.map((w) => {
            const isSelected = combinedValue === w.value;
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => onCombinedChange(w.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected
                      ? "border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && (
                    <div className="size-2 rounded-full bg-primary" />
                  )}
                </div>
                  <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                      {w.label}
                    </span>
                    {w.recommended && (
                      <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[8px] font-medium text-emerald-700">
                        Recommended
                      </Badge>
                    )}
                    {w.requiresEligibility && (
                      <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-1.5 py-0 text-[8px] font-medium text-amber-600">
                        Pixel dependent
                      </Badge>
                    )}
                  </div>
                  {w.desc && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {w.desc}
                    </p>
                  )}
                  {/* Click / View window breakdown */}
                  {(w.clickWindow || w.viewWindow) && (
                    <div className="mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px]">
                        <MousePointerClick className="size-2.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{w.clickWindow ?? "—"}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Eye className="size-2.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{w.viewWindow ?? "—"}</span>
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {mode === "separate" &&
        clickOptions &&
        viewOptions &&
        onClickChange &&
        onViewChange && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MousePointerClick
                  className={cn("size-3", !isCustomAccent && "text-primary")}
                  style={accentStyle}
                />
                Click-through
              </Label>
              <Select value={clickValue} onValueChange={onClickChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clickOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Conversions counted after a click
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Eye
                  className={cn("size-3", !isCustomAccent && "text-primary")}
                  style={accentStyle}
                />
                View-through
              </Label>
              <Select value={viewValue} onValueChange={onViewChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Conversions counted after a view only
              </p>
            </div>
          </div>
        )}

      {/* Selected option visual summary */}
      {mode === "combined" && selectedOption && (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-primary">How it works:</span>
            <span className="text-foreground">User sees your ad</span>
            <ArrowRight className="size-3 text-muted-foreground" />
            {selectedOption.viewWindow && selectedOption.viewWindow !== "None" ? (
              <span className="text-foreground">
                Buys within <span className="font-semibold">{selectedOption.clickWindow}</span> (click) or <span className="font-semibold">{selectedOption.viewWindow}</span> (view)
              </span>
            ) : (
              <span className="text-foreground">
                Swipes up, then buys within <span className="font-semibold">{selectedOption.clickWindow}</span>
              </span>
            )}
            <ArrowRight className="size-3 text-muted-foreground" />
            <span className="font-semibold text-emerald-600">Counted</span>
          </div>
        </div>
      )}

      {/* Goal-specific context */}
      {goalContext && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <InfoTip text="" className="hidden" />
          <div className="flex size-4 shrink-0 items-center justify-center">
            <svg viewBox="0 0 16 16" className="size-3.5 text-blue-600" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm2 8H6v-1h1.5V7H6V6h2.5v4H10v1z" />
            </svg>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-700">
            {goalContext}
          </p>
        </div>
      )}

      {tip && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-relaxed text-emerald-700">
            <span className="font-semibold">Salla Tip:</span> {tip}
          </p>
        </div>
      )}

      {children}
    </SectionCard>
  );
}
