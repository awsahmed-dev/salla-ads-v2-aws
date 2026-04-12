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
import { MousePointerClick, Eye, CheckCircle2, Info } from "lucide-react";

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
  tip,
  accent = "primary",
  infoTipText = "A wider window gives the platform more data to optimize your results.",
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
        <p className="mt-1 text-xs text-muted-foreground">
          {infoTipText}
        </p>
      </div>

      {/* Combined mode: cards */}
      {mode === "combined" && combinedOptions && onCombinedChange && (
        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {combinedOptions.map((w) => {
              const isSelected = combinedValue === w.value;
              return (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => onCombinedChange(w.value)}
                  className={cn(
                    "group flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                    isSelected
                      ? "border-[#a4ffe5] bg-[#e6fff9]"
                      : "border-border bg-card hover:border-[#a4ffe5]/60 hover:shadow-sm"
                  )}
                >
                  {/* Check/circle indicator */}
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors",
                    isSelected ? "bg-[#004956]" : "bg-muted/60"
                  )}>
                    {isSelected ? (
                      <CheckCircle2 className="size-4 text-white" />
                    ) : (
                      <MousePointerClick className="size-3.5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>
                        {w.clickWindow ?? "28 days"}
                      </span>
                      <span className="text-xs text-muted-foreground">click</span>
                      {w.viewWindow && w.viewWindow !== "None" && (
                        <>
                          <span className="text-[10px] text-muted-foreground/50">+</span>
                          <span className={cn("text-sm font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>
                            {w.viewWindow}
                          </span>
                          <span className="text-xs text-muted-foreground">view</span>
                        </>
                      )}
                      {w.viewWindow === "None" && (
                        <span className="text-xs text-muted-foreground/50">only</span>
                      )}
                    </div>

                    {/* Badge */}
                    {w.recommended && (
                      <span className="mt-1 inline-block rounded-full bg-[#004956] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                        Recommended
                      </span>
                    )}
                    {w.requiresEligibility && !w.recommended && (
                      <span className="mt-1 inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-600">
                        Advanced
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tip */}
          {tip && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2">
              <Info className="mt-0.5 size-3 shrink-0 text-[#004956]" />
              <p className="text-[11px] leading-relaxed text-[#004956]/80">{tip}</p>
            </div>
          )}
        </div>
      )}

      {/* Separate mode: dropdowns */}
      {mode === "separate" && clickOptions && viewOptions && onClickChange && onViewChange && (
        <div className="px-6 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MousePointerClick className={cn("size-3", !isCustomAccent && "text-[#004956]")} style={accentStyle} />
                Click-through
              </Label>
              <Select value={clickValue} onValueChange={onClickChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clickOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Eye className={cn("size-3", !isCustomAccent && "text-[#004956]")} style={accentStyle} />
                View-through
              </Label>
              <Select value={viewValue} onValueChange={onViewChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {tip && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/50 px-3 py-2">
              <Info className="mt-0.5 size-3 shrink-0 text-[#004956]" />
              <p className="text-[11px] leading-relaxed text-[#004956]/80">{tip}</p>
            </div>
          )}
        </div>
      )}

      {/* Goal context */}
      {goalContext && (
        <div className="mx-6 mb-4 flex items-start gap-2 rounded-lg border border-[#a4ffe5]/40 bg-[#e6fff9]/30 px-3 py-2">
          <Info className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
          <p className="text-[11px] leading-relaxed text-[#004956]/80">{goalContext}</p>
        </div>
      )}

      {children}
    </div>
  );
}
