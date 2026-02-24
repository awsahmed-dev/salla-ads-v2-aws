"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MapPin, AlertCircle, Info } from "lucide-react";
import { getCountryByCode } from "@/lib/locations";

/** Rough addressable ad population per country code (GCC / MENA focus). */
const COUNTRY_REACH: Record<string, number> = {
  SA: 34_000_000,
  AE: 10_000_000,
  EG: 55_000_000,
  KW: 4_500_000,
  BH: 1_800_000,
  OM: 5_000_000,
  QA: 3_000_000,
  JO: 10_000_000,
  IQ: 40_000_000,
  LB: 5_000_000,
  MA: 20_000_000,
  TN: 10_000_000,
  DZ: 22_000_000,
  PS: 3_500_000,
  YE: 8_000_000,
  LY: 4_000_000,
  SD: 12_000_000,
};
const DEFAULT_REACH = 8_000_000;

/** Cap for bar percentage (100% = this many people). */
const CAP_FOR_BAR = 50_000_000;

export type LocationReachAccent = "primary" | "meta" | "dv360";

const ACCENT_ICON: Record<LocationReachAccent, string> = {
  primary: "text-primary",
  meta: "text-[#1877F2]",
  dv360: "text-red-600",
};

export interface LocationReachCardProps {
  /** Number of selected countries (fallback when countries array not provided). */
  countryCount: number;
  /** Optional array of country codes for country-aware reach estimates. */
  countries?: string[];
  /** Number of selected cities. When > 0, reach is scaled down (city-level = narrower). */
  cityCount?: number;
  accent?: LocationReachAccent;
  label?: string;
  className?: string;
}

/**
 * Location-only reach estimate for Step 1 (Audience).
 * Uses per-country addressable population when country codes are provided,
 * otherwise falls back to countryCount * default.
 */
export function LocationReachCard({
  countryCount,
  countries,
  cityCount = 0,
  accent = "primary",
  label = "Reach in selected locations",
  className,
}: LocationReachCardProps) {
  const hasLocations = countries ? countries.length > 0 : countryCount > 0;

  const baseReach = countries
    ? countries.reduce((sum, code) => sum + (COUNTRY_REACH[code] ?? DEFAULT_REACH), 0)
    : countryCount * DEFAULT_REACH;

  const cityMultiplier =
    cityCount === 0 ? 1 : Math.max(0.1, 1 - cityCount * 0.05);
  const estimatedReach = Math.round(baseReach * cityMultiplier);
  const estimatedMin = Math.round(estimatedReach * 0.85);
  const estimatedMax = Math.round(estimatedReach * 1.15);

  const sizePercent = Math.min(
    100,
    Math.round((estimatedReach / CAP_FOR_BAR) * 100)
  );
  const sizeLabel =
    sizePercent < 20
      ? "Very narrow"
      : sizePercent < 40
        ? "Narrow"
        : sizePercent < 65
          ? "Balanced"
          : sizePercent < 85
            ? "Broad"
            : "Very broad";
  const barColor =
    sizePercent < 20
      ? "bg-red-500"
      : sizePercent < 40
        ? "bg-amber-500"
        : sizePercent < 65
          ? "bg-emerald-500"
          : sizePercent < 85
            ? "bg-blue-500"
            : "bg-purple-500";
  const labelColor =
    sizePercent < 20
      ? "text-red-600"
      : sizePercent < 40
        ? "text-amber-600"
        : sizePercent < 65
          ? "text-emerald-600"
          : sizePercent < 85
            ? "text-blue-600"
            : "text-purple-600";

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `${(n / 1_000).toFixed(0)}K`
        : n.toString();

  const countryNames = countries
    ?.map((c) => getCountryByCode(c)?.name ?? c)
    .join(", ");

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
        <div className="flex items-center gap-2">
          <MapPin className={cn("size-4 shrink-0", ACCENT_ICON[accent])} />
          <Label className="text-sm font-semibold text-foreground">{label}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Based only on your selected countries and cities. Full audience size will depend on demographics and interests you set below.
            </TooltipContent>
          </Tooltip>
        </div>

        {!hasLocations ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Select at least one location to see reach estimates.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${sizePercent}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Narrow</span>
              <span className={cn("text-xs font-medium", labelColor)}>{sizeLabel}</span>
              <span className="text-xs text-muted-foreground">Broad</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{fmt(estimatedMin)}</span>
              <span className="text-sm text-muted-foreground">–</span>
              <span className="text-xl font-bold text-foreground">{fmt(estimatedMax)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated reach in selected locations. Refined after you set budget and targeting.
            </p>
            {countryNames && (
              <p className="truncate text-xs text-muted-foreground" title={countryNames}>
                {countryNames}
                {cityCount > 0 && ` + ${cityCount} ${cityCount === 1 ? "city" : "cities"}`}
              </p>
            )}
            {sizePercent < 20 && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <AlertCircle className="size-3 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Locations may be too narrow for effective delivery. Consider adding more countries or cities.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
