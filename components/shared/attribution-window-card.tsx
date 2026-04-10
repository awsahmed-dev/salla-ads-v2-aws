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
import { MousePointerClick, Eye, Sparkles } from "lucide-react";

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
  infoTipText = "How long after a view or click should a conversion be credited? A wider window provides more data to optimize performance.",
  goalContext,
  children,
}: AttributionWindowCardProps) {
  const isCustomAccent = accent.startsWith("#");
  const accentStyle = isCustomAccent ? { color: accent } : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-bold text-foreground">
          Attribution Window
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {infoTipText}
        </p>
      </div>

      {/* Combined mode: horizontal cards */}
      {mode === "combined" && combinedOptions && onCombinedChange && (
        <div className="px-6 pb-6">
          <div className="flex gap-6">
            {combinedOptions.map((w) => {
              const isSelected = combinedValue === w.value;
              return (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => onCombinedChange(w.value)}
                  className={cn(
                    "flex flex-1 flex-col gap-3 rounded-xl border px-5 py-4 text-left transition-all",
                    isSelected
                      ? "border-[#a4ffe5] bg-[#e6fff9]"
                      : "border-border bg-card hover:border-border/80"
                  )}
                >
                  {/* Title + recommended */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isSelected ? "text-[#004956]" : "text-foreground"
                      )}
                    >
                      {w.label}
                    </span>
                    {w.recommended && (
                      <Badge
                        className={cn(
                          "rounded-full border-0 px-1.5 py-0.5 text-[10px] font-normal",
                          isSelected
                            ? "bg-[#a4ffe5] text-[#004956]"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        Recommended
                      </Badge>
                    )}
                    {w.requiresEligibility && (
                      <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-1.5 py-0 text-[8px] font-medium text-amber-600">
                        Pixel dependent
                      </Badge>
                    )}
                  </div>

                  {/* Click/View window tags */}
                  {(w.clickWindow || w.viewWindow) && (
                    <div className="flex items-center gap-2">
                      {w.clickWindow && (
                        <span className="flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {w.clickWindow}
                          <MousePointerClick className="size-2.5" />
                        </span>
                      )}
                      <span className="text-[10px] text-foreground">+</span>
                      <span className="flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {w.viewWindow ?? "No view"}
                        <Eye className="size-2.5" />
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {w.desc && (
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      {w.desc}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend bar */}
          <div className="mt-4 flex items-center gap-4 rounded-lg bg-muted/30 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <MousePointerClick className="size-3.5" />
              Click = User swipes up, then purchases later
            </span>
            <span className="text-[10px] text-muted-foreground">&bull;</span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Eye className="size-3.5" />
              View = User sees the ad only, then purchases later
            </span>
          </div>
        </div>
      )}

      {/* Separate mode: dropdowns */}
      {mode === "separate" &&
        clickOptions &&
        viewOptions &&
        onClickChange &&
        onViewChange && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/20 p-3.5">
                <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <MousePointerClick
                    className={cn("size-3", !isCustomAccent && "text-[#004956]")}
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
                    className={cn("size-3", !isCustomAccent && "text-[#004956]")}
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
          </div>
        )}

      {/* Goal context */}
      {goalContext && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
          <svg viewBox="0 0 16 16" className="mt-0.5 size-3.5 shrink-0 text-blue-600" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a1 1 0 110 2 1 1 0 010-2zm2 8H6v-1h1.5V7H6V6h2.5v4H10v1z" />
          </svg>
          <p className="text-[11px] leading-relaxed text-blue-700">
            {goalContext}
          </p>
        </div>
      )}

      {tip && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-relaxed text-emerald-700">
            <span className="font-semibold">Salla Tip:</span> {tip}
          </p>
        </div>
      )}

      {children}
    </div>
  );
}
