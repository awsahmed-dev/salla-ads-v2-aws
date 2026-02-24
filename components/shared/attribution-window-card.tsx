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
import { Clock, MousePointerClick, Eye, Sparkles } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

interface CombinedOption {
  value: string;
  label: string;
  desc?: string;
  recommended?: boolean;
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
  children,
}: AttributionWindowCardProps) {
  const isCustomAccent = accent.startsWith("#");
  const accentStyle = isCustomAccent ? { color: accent } : undefined;

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
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
        <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      )}

      {mode === "combined" && combinedOptions && onCombinedChange && (
        <div className="flex flex-col gap-2">
          {combinedOptions.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => onCombinedChange(w.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                combinedValue === w.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              )}
            >
              <div
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  combinedValue === w.value
                    ? "border-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {combinedValue === w.value && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {w.label}
                  </span>
                  {w.recommended && (
                    <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[8px] font-medium text-emerald-700">
                      Recommended
                    </Badge>
                  )}
                </div>
                {w.desc && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {w.desc}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {mode === "separate" &&
        clickOptions &&
        viewOptions &&
        onClickChange &&
        onViewChange && (
          <div className="grid grid-cols-2 gap-4">
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
