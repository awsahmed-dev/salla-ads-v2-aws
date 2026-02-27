"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getCountryByCode } from "@/lib/locations";

/* ------------------------------------------------------------------ */
/*  Snap addressable audience per country (approximate DAU/MAU for     */
/*  ad delivery — NOT total population).                               */
/* ------------------------------------------------------------------ */

const SNAP_AUDIENCE: Record<string, number> = {
  SA: 21_000_000,
  AE: 7_500_000,
  EG: 12_000_000,
  KW: 3_200_000,
  BH: 1_200_000,
  OM: 2_800_000,
  QA: 2_000_000,
  JO: 4_500_000,
  IQ: 15_000_000,
  LB: 2_500_000,
  MA: 8_000_000,
  TN: 4_500_000,
  DZ: 9_000_000,
  PS: 1_800_000,
  YE: 3_000_000,
  LY: 1_500_000,
  SD: 4_000_000,
};

const DEFAULT_AUDIENCE = 3_000_000;

export type LocationReachAccent = "primary" | "meta" | "dv360";
export type ObjectiveType = "SALES" | "AWARENESS" | "VIDEO_VIEWS" | "ENGAGEMENT" | "APP_PROMOTION" | "WEBSITE_VISITS" | "SPONSORED_CHAT" | string;

const ACCENT_ICON: Record<LocationReachAccent, string> = {
  primary: "text-primary",
  meta: "text-[#1877F2]",
  dv360: "text-red-600",
};

/* ------------------------------------------------------------------ */
/*  Objective-based guidance                                           */
/* ------------------------------------------------------------------ */

interface SizeGuidance {
  status: "good" | "warning" | "info";
  icon: typeof TrendingUp;
  message: string;
}

function getGuidance(objective: ObjectiveType, audienceSize: number, cityCount: number): SizeGuidance {
  const isSales = objective === "SALES" || objective === "WEBSITE_VISITS";
  const isAwareness = objective === "AWARENESS" || objective === "VIDEO_VIEWS";

  if (audienceSize < 100_000) {
    return {
      status: "warning",
      icon: TrendingDown,
      message: "Very small audience — Snap may struggle to deliver your ads. Consider broadening your targeting.",
    };
  }

  if (isSales) {
    if (audienceSize > 15_000_000) {
      return {
        status: "info",
        icon: TrendingUp,
        message: "Large audience for Sales — Snap's algorithm will narrow it down, but adding interests or custom audiences helps it learn faster.",
      };
    }
    if (audienceSize > 5_000_000) {
      return {
        status: "good",
        icon: Minus,
        message: "Good audience size for Sales — enough room for Snap to optimize while staying focused.",
      };
    }
    if (audienceSize > 500_000) {
      return {
        status: "good",
        icon: Minus,
        message: cityCount > 0
          ? "Focused audience — good for city-level Sales campaigns with targeted interests."
          : "Focused audience — works well if you have strong interest or custom audience targeting.",
      };
    }
    return {
      status: "warning",
      icon: TrendingDown,
      message: "Narrow for prospecting — fine for retargeting, but if finding new buyers, consider broadening.",
    };
  }

  if (isAwareness) {
    if (audienceSize > 5_000_000) {
      return {
        status: "good",
        icon: TrendingUp,
        message: "Great reach for awareness — your ads will be seen by a large audience.",
      };
    }
    return {
      status: "info",
      icon: Minus,
      message: "Smaller audience for awareness — you'll get high frequency (same people see your ad often). Consider broadening for more reach.",
    };
  }

  if (audienceSize > 1_000_000) {
    return { status: "good", icon: Minus, message: "Healthy audience size for your objective." };
  }

  return { status: "info", icon: Minus, message: "Moderate audience — performance depends on your targeting precision." };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface LocationReachCardProps {
  countryCount: number;
  countries?: string[];
  cityCount?: number;
  /** Campaign objective from Step 0 */
  objective?: ObjectiveType;
  accent?: LocationReachAccent;
  label?: string;
  className?: string;
}

export function LocationReachCard({
  countryCount,
  countries,
  cityCount = 0,
  objective = "SALES",
  accent = "primary",
  label = "Estimated Audience",
  className,
}: LocationReachCardProps) {
  const hasLocations = countries ? countries.length > 0 : countryCount > 0;

  const baseAudience = countries
    ? countries.reduce((sum, code) => sum + (SNAP_AUDIENCE[code] ?? DEFAULT_AUDIENCE), 0)
    : countryCount * DEFAULT_AUDIENCE;

  const cityFactor = cityCount === 0 ? 1 : Math.max(0.15, 1 - cityCount * 0.08);
  const estimated = Math.round(baseAudience * cityFactor);

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(0)}K`
        : String(n);

  const guidance = getGuidance(objective, estimated, cityCount);

  const countryNames = countries
    ?.slice(0, 3)
    .map((c) => getCountryByCode(c)?.name ?? c)
    .join(", ");
  const extraCountries = (countries?.length ?? 0) - 3;

  const statusColors = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
        {/* Header */}
        <div className="flex items-center gap-2">
          <MapPin className={cn("size-4 shrink-0", ACCENT_ICON[accent])} />
          <Label className="text-sm font-semibold text-foreground">{label}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Approximate Snapchat addressable audience based on your location selection.
              The actual delivery size will depend on demographics, interests, and budget you set.
            </TooltipContent>
          </Tooltip>
        </div>

        {!hasLocations ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Select at least one location to see audience estimates.
            </p>
          </div>
        ) : (
          <>
            {/* Audience size */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-foreground">~{fmt(estimated)}</span>
              <span className="text-xs text-muted-foreground">people on Snapchat</span>
            </div>

            {/* Location summary */}
            <p className="text-[11px] text-muted-foreground">
              {countryNames}
              {extraCountries > 0 && ` +${extraCountries}`}
              {cityCount > 0 && ` · ${cityCount} ${cityCount === 1 ? "city" : "cities"}`}
            </p>

            {/* Objective-aware guidance */}
            <div className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2",
              statusColors[guidance.status]
            )}>
              <guidance.icon className="mt-0.5 size-3.5 shrink-0" />
              <p className="text-[11px] leading-relaxed">{guidance.message}</p>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Location-only estimate · Full audience size depends on demographics, interests & budget
            </p>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
