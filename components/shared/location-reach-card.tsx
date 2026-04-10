"use client";

import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { getCountryByCode, type SelectedCity } from "@/lib/locations";
import { LocationMapPreview } from "@/components/shared/location-map-preview";

const SNAP_AUDIENCE: Record<string, number> = {
  SA: 21_000_000, AE: 7_500_000, EG: 12_000_000, KW: 3_200_000,
  BH: 1_200_000, OM: 2_800_000, QA: 2_000_000, JO: 4_500_000,
  IQ: 15_000_000, LB: 2_500_000, MA: 8_000_000, TN: 4_500_000,
  DZ: 9_000_000, PS: 1_800_000, YE: 3_000_000, LY: 1_500_000,
  SD: 4_000_000,
};
const DEFAULT_AUDIENCE = 3_000_000;

export type LocationReachAccent = "primary" | "meta" | "dv360";
export type ObjectiveType = "SALES" | "AWARENESS" | "VIDEO_VIEWS" | "ENGAGEMENT" | "APP_PROMOTION" | "WEBSITE_VISITS" | "SPONSORED_CHAT" | string;

function getGuidanceMessage(objective: ObjectiveType, audienceSize: number): string {
  const isSales = objective === "SALES" || objective === "WEBSITE_VISITS";
  if (audienceSize < 100_000) return "Very small audience — consider broadening your targeting.";
  if (isSales && audienceSize > 15_000_000)
    return "Large sales audience — Snapchat's algorithm will narrow it, but adding interests or custom audiences helps it learn faster.";
  if (isSales && audienceSize > 5_000_000)
    return "Good audience size for Sales — enough room for Snapchat to optimize while staying focused.";
  if (isSales) return "Focused audience — good for targeted campaigns with strong interest or custom audience targeting.";
  if (audienceSize > 5_000_000) return "Great reach — your ads will be seen by a large audience.";
  return "Moderate audience — performance depends on your targeting precision.";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export interface LocationReachCardProps {
  countryCount: number;
  countries?: string[];
  cityCount?: number;
  cities?: SelectedCity[];
  objective?: ObjectiveType;
  accent?: LocationReachAccent;
  label?: string;
  className?: string;
}

export function LocationReachCard({
  countryCount,
  countries,
  cityCount = 0,
  cities = [],
  objective = "SALES",
  className,
}: LocationReachCardProps) {
  const hasLocations = countries ? countries.length > 0 : countryCount > 0;

  const baseAudience = countries
    ? countries.reduce((sum, code) => sum + (SNAP_AUDIENCE[code] ?? DEFAULT_AUDIENCE), 0)
    : countryCount * DEFAULT_AUDIENCE;

  const cityFactor = cityCount === 0 ? 1 : Math.max(0.15, 1 - cityCount * 0.08);
  const estimatedHigh = Math.round(baseAudience * cityFactor);
  const estimatedLow = Math.round(estimatedHigh * 0.4);

  const guidance = hasLocations ? getGuidanceMessage(objective, estimatedHigh) : "";

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card", className)}>
      {/* Map preview */}
      <LocationMapPreview
        countryCodes={countries ?? []}
        cities={cities}
      />

      {/* Audience estimate */}
      <div className="p-6">
        <div className="mb-3">
          <p className="text-sm font-medium text-foreground">
            Available Audience Size <span className="text-muted-foreground">*</span>
          </p>
          {hasLocations ? (
            <p className="text-2xl font-bold text-foreground">
              {fmt(estimatedLow)} - {fmt(estimatedHigh)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Select a location to see estimates</p>
          )}
        </div>

        {hasLocations && guidance && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-50 px-6 py-4">
            <TrendingUp className="mt-0.5 size-4.5 shrink-0 text-blue-600" />
            <p className="flex-1 text-sm text-blue-800">{guidance}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground opacity-90">
          *Audience size depends on targeting and may change based on budget settings.
        </p>
      </div>
    </div>
  );
}
