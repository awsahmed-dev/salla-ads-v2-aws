"use client";

/**
 * AudienceSizeEstimateCard — live delivery-pool estimate.
 *
 * Purpose
 * -------
 * Every ad-platform's API combines audience filters by INTERSECTION:
 * location ∩ age ∩ gender ∩ language ∩ interests ∩ custom audiences.
 * That means every filter the merchant adds NARROWS delivery — but
 * the UI doesn't show it. Merchants pick 3 interests + a custom list
 * and don't realize they just cut their reach 90%.
 *
 * This card fixes that invisibility. It shows a live directional
 * estimate that shrinks as the merchant adds filters, with a
 * breakdown of which filters are doing the most narrowing.
 *
 * Honesty note
 * ------------
 * The numbers are HEURISTICS. Not a real ad-platform API call. This
 * is a UX signal — "your targeting is getting narrow" — not a
 * delivery forecast. The actual platform APIs (Meta reach_estimate,
 * TikTok audience_size, Google campaign_forecast) can back this in
 * production; today we use a formula that's directionally correct.
 */

import { Users, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/shared/section-card";
import { InfoTip } from "@/components/shared/info-tip";
import { Badge } from "@/components/ui/badge";

export interface AudienceEstimateInput {
  /** Number of countries targeted (0 = unset). */
  countryCount: number;
  /** Number of cities targeted (0 = "whole country" mode). */
  cityCount: number;
  /** Number of age bands the merchant kept selected. Total bands = 6. */
  ageBandCount: number;
  /** True when gender is "All" (both). False when narrowed to one. */
  genderAll: boolean;
  /** Number of languages the merchant selected (0 = all languages). */
  languageCount: number;
  /** Number of interest categories the merchant picked (0 = broad). */
  interestCount: number;
  /** Number of custom audiences INCLUDED. Non-empty forces a hard cap
   *  on delivery equal to the smallest included list's size. */
  customAudienceIncludeCount: number;
  /** Approximate size of the smallest included custom list, when the
   *  merchant has included at least one. Used as the hard delivery cap. */
  smallestIncludedListSize?: number;
  /** Number of custom audiences EXCLUDED. Each excluded list drops
   *  delivery by ~5% (heuristic, based on typical overlap). */
  customAudienceExcludeCount: number;
}

export interface AudienceEstimateResult {
  size: number;
  label: string;
  color: string;
  pct: number;
  narrowings: { label: string; impact: string }[];
}

/**
 * Compute a directional audience-size estimate.
 *
 * Base pool assumption
 * --------------------
 * For KSA-first stores: ~34M internet-connected users. When 0 countries
 * are picked the estimate is "not set" (no pool). Multi-country roughly
 * adds up baselines (with de-dupe discount).
 */
export function computeAudienceEstimate(input: AudienceEstimateInput): AudienceEstimateResult {
  const {
    countryCount, cityCount, ageBandCount, genderAll,
    languageCount, interestCount,
    customAudienceIncludeCount, smallestIncludedListSize,
    customAudienceExcludeCount,
  } = input;

  if (countryCount === 0) {
    return {
      size: 0,
      label: "Not set",
      color: "text-muted-foreground",
      pct: 0,
      narrowings: [{ label: "Pick a location", impact: "" }],
    };
  }

  // Base country pool — KSA-centric baseline; scales with country count.
  const perCountryBaseline = 34_000_000;
  let pool = perCountryBaseline * countryCount;

  const narrowings: { label: string; impact: string }[] = [];

  // City targeting shrinks pool (typical major KSA city ~ 5–10% of country).
  if (cityCount > 0) {
    const cityFactor = Math.min(0.35, cityCount * 0.10);
    const before = pool;
    pool = Math.round(pool * cityFactor);
    narrowings.push({ label: `${cityCount} ${cityCount === 1 ? "city" : "cities"}`, impact: `−${Math.round((1 - pool / before) * 100)}%` });
  }

  // Age bands (6 total). Missing bands shrink proportionally.
  if (ageBandCount > 0 && ageBandCount < 6) {
    const factor = ageBandCount / 6;
    const before = pool;
    pool = Math.round(pool * factor);
    narrowings.push({ label: `${ageBandCount}/6 age bands`, impact: `−${Math.round((1 - factor) * 100)}%` });
  }

  // Gender narrowing.
  if (!genderAll) {
    const before = pool;
    pool = Math.round(pool * 0.5);
    narrowings.push({ label: "Gender narrowed", impact: "−50%" });
  }

  // Language: 0 = broad, 1 = single lang, 2 = both major.
  if (languageCount === 1) {
    const before = pool;
    pool = Math.round(pool * 0.85);
    narrowings.push({ label: "Single language", impact: "−15%" });
  }

  // Interest categories — each roughly halves reach up to ~85% narrowing.
  if (interestCount > 0) {
    const factor = Math.max(0.15, Math.pow(0.6, interestCount));
    const before = pool;
    pool = Math.round(pool * factor);
    narrowings.push({
      label: `${interestCount} interest${interestCount > 1 ? "s" : ""}`,
      impact: `−${Math.round((1 - factor) * 100)}%`,
    });
  }

  // Custom audience INCLUDE = hard cap on delivery.
  if (customAudienceIncludeCount > 0 && smallestIncludedListSize) {
    const before = pool;
    pool = Math.min(pool, smallestIncludedListSize);
    if (pool < before) {
      narrowings.push({
        label: `${customAudienceIncludeCount} custom ${customAudienceIncludeCount === 1 ? "list" : "lists"} included`,
        impact: `cap ${formatShort(smallestIncludedListSize)}`,
      });
    }
  }

  // Custom audience EXCLUDE — each drops delivery ~5%.
  if (customAudienceExcludeCount > 0) {
    const factor = Math.pow(0.95, customAudienceExcludeCount);
    const before = pool;
    pool = Math.round(pool * factor);
    narrowings.push({
      label: `${customAudienceExcludeCount} custom excluded`,
      impact: `−${Math.round((1 - factor) * 100)}%`,
    });
  }

  // Label + progress bar based on delivery-pool healthiness.
  let label: string;
  let color: string;
  let pct: number;
  if (pool < 5_000) {
    label = "Very narrow";
    color = "text-red-600";
    pct = 8;
  } else if (pool < 50_000) {
    label = "Narrow";
    color = "text-amber-600";
    pct = 25;
  } else if (pool < 500_000) {
    label = "Moderate";
    color = "text-emerald-600";
    pct = 55;
  } else if (pool < 5_000_000) {
    label = "Healthy";
    color = "text-emerald-600";
    pct = 78;
  } else {
    label = "Broad";
    color = "text-primary";
    pct = 95;
  }

  return { size: Math.max(0, pool), label, color, pct, narrowings };
}

function formatShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export interface AudienceSizeEstimateCardProps {
  input: AudienceEstimateInput;
  /** Accent color. Falls back to primary. */
  accent?: "primary";
  className?: string;
}

export function AudienceSizeEstimateCard({ input, className }: AudienceSizeEstimateCardProps) {
  const result = computeAudienceEstimate(input);
  const displaySize = result.size === 0 ? "—" : formatShort(result.size);

  return (
    <SectionCard className={cn("p-4", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Users className="size-3.5 text-primary" />
        <p className="text-xs font-bold text-foreground">Estimated audience</p>
        <InfoTip text="Directional estimate based on your filters. Every filter you add narrows the delivery pool by intersection — the real audience is where ALL your filters overlap. Actual delivery depends on the ad platform's live inventory." />
      </div>

      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-foreground">{displaySize}</span>
        <span className={cn("text-xs font-semibold", result.color)}>{result.label}</span>
      </div>

      {/* Reach bar */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            result.pct >= 55 ? "bg-emerald-500" : result.pct >= 25 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${result.pct}%` }}
        />
      </div>

      {/* Narrowing breakdown — shows the merchant which filters are
          shrinking their pool the most. */}
      {result.narrowings.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <TrendingDown className="size-3" />
            What's narrowing your reach
          </p>
          {result.narrowings.slice(0, 5).map((n, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">{n.label}</span>
              {n.impact && (
                <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[9px] font-semibold tabular-nums">
                  {n.impact}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Honesty footnote — this is a heuristic, not a live API call. */}
      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted/30 px-2 py-1.5">
        <Info className="mt-0.5 size-2.5 shrink-0 text-muted-foreground" />
        <p className="text-[9px] leading-tight text-muted-foreground">
          Directional estimate — actual reach depends on the ad platform's live inventory and bidding.
        </p>
      </div>
    </SectionCard>
  );
}
