"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Info,
  TrendingUp,
  Rocket,
  Target,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Snap addressable audience per country                              */
/* ------------------------------------------------------------------ */

const SNAP_AUDIENCE: Record<string, number> = {
  SA: 21_000_000, AE: 7_500_000, EG: 12_000_000, KW: 3_200_000,
  BH: 1_200_000, OM: 2_800_000, QA: 2_000_000, JO: 4_500_000,
  IQ: 15_000_000, LB: 2_500_000, MA: 8_000_000, TN: 4_500_000,
  DZ: 9_000_000, PS: 1_800_000, YE: 3_000_000, LY: 1_500_000,
  SD: 4_000_000,
};

/* ------------------------------------------------------------------ */
/*  Audience size estimation                                           */
/* ------------------------------------------------------------------ */

function estimateAudience(p: {
  countries: string[];
  cityCount: number;
  genderCount: number;
  ageMin: number;
  ageMax: number;
  interestCount: number;
  customAudienceCount: number;
  interestExpansion: boolean;
  smartTargeting: boolean;
}): number {
  let base = p.countries.reduce(
    (s, c) => s + (SNAP_AUDIENCE[c] ?? 3_000_000), 0
  );

  if (p.cityCount > 0) base *= Math.max(0.15, 1 - p.cityCount * 0.07);
  if (p.genderCount === 1) base *= 0.52;

  const ageSpan = Math.min(p.ageMax, 65) - Math.max(p.ageMin, 13);
  base *= Math.max(0.1, ageSpan / 52);

  if (p.interestCount > 0 && p.interestCount <= 3) base *= 0.35;
  else if (p.interestCount > 3 && p.interestCount <= 8) base *= 0.50;
  else if (p.interestCount > 8) base *= 0.60;

  if (p.customAudienceCount > 0) base *= 0.25;
  if (p.interestExpansion && p.interestCount > 0) base *= 1.3;
  if (p.smartTargeting) base *= 1.4;

  return Math.round(Math.max(10_000, base));
}

/* ------------------------------------------------------------------ */
/*  Estimated daily reach & results from budget                        */
/* ------------------------------------------------------------------ */

function estimateMetrics(dailyBudget: number, audienceSize: number, objective: string) {
  const isSales = objective === "SALES" || objective === "WEBSITE_VISITS";

  const cpmBase = isSales ? 18 : 12;
  const cpm = cpmBase + Math.random() * 4;
  const dailyImpressions = Math.round((dailyBudget / cpm) * 1000);
  const dailyReach = Math.round(dailyImpressions * 0.7);
  const reachPercent = Math.min(99, (dailyReach / audienceSize) * 100);

  const conversionRate = isSales ? 0.012 : 0.025;
  const dailyClicks = Math.round(dailyImpressions * 0.018);
  const dailyConversions = isSales ? Math.max(0, Math.round(dailyClicks * conversionRate)) : 0;

  const nextTierBudget = dailyBudget < 300 ? 300
    : dailyBudget < 500 ? 500
    : dailyBudget < 1000 ? 1000
    : dailyBudget < 2000 ? 2000
    : dailyBudget * 1.5;

  const nextImpressions = Math.round((nextTierBudget / cpm) * 1000);
  const nextReach = Math.round(nextImpressions * 0.7);
  const nextConversions = isSales ? Math.max(0, Math.round(nextImpressions * 0.018 * conversionRate)) : 0;
  const reachGainPercent = Math.round(((nextReach - dailyReach) / dailyReach) * 100);

  return {
    dailyImpressions,
    dailyReach,
    dailyClicks,
    dailyConversions,
    reachPercent,
    nextTierBudget: Math.round(nextTierBudget),
    nextReach,
    nextConversions,
    reachGainPercent,
  };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface AudienceBudgetFitCardProps {
  countries: string[];
  cityCount: number;
  genderCount: number;
  ageMin: number;
  ageMax: number;
  interestCount: number;
  customAudienceCount: number;
  interestExpansion: boolean;
  smartTargeting: boolean;
  dailyBudget: number;
  objective: string;
  className?: string;
}

export function AudienceBudgetFitCard({
  countries,
  cityCount,
  genderCount,
  ageMin,
  ageMax,
  interestCount,
  customAudienceCount,
  interestExpansion,
  smartTargeting,
  dailyBudget,
  objective,
  className,
}: AudienceBudgetFitCardProps) {
  const isSales = objective === "SALES" || objective === "WEBSITE_VISITS";

  const audienceSize = useMemo(() => estimateAudience({
    countries, cityCount, genderCount, ageMin, ageMax,
    interestCount, customAudienceCount, interestExpansion, smartTargeting,
  }), [countries, cityCount, genderCount, ageMin, ageMax, interestCount, customAudienceCount, interestExpansion, smartTargeting]);

  const m = useMemo(
    () => estimateMetrics(dailyBudget, audienceSize, objective),
    [dailyBudget, audienceSize, objective]
  );

  const reachBarPercent = Math.min(100, Math.round(m.reachPercent));
  const barColor = reachBarPercent < 5 ? "bg-red-400" :
    reachBarPercent < 15 ? "bg-amber-400" :
    reachBarPercent < 40 ? "bg-emerald-500" :
    "bg-blue-500";

  const hasCountries = countries.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Target className="size-4 shrink-0 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Audience Reach</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Estimated daily reach based on your targeting and budget.
              Higher budget = more people see your ads = faster results.
            </TooltipContent>
          </Tooltip>
        </div>

        {!hasCountries ? (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3">
              <Target className="size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Set your audience in Step 1 to see reach estimates.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Main metrics */}
            <div className="px-4 pb-3">
              {/* Audience pool */}
              <p className="text-[11px] text-muted-foreground mb-1">
                Your audience: <strong className="text-foreground">{fmt(audienceSize)}</strong> people
              </p>

              {/* Daily reach bar */}
              <div className="mb-1">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">Daily reach</span>
                  <span className="text-sm font-bold text-foreground">{fmt(m.dailyReach)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", barColor)}
                    style={{ width: `${Math.max(2, reachBarPercent)}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  Reaching {reachBarPercent < 1 ? "<1" : reachBarPercent.toFixed(1)}% of your audience daily
                </p>
              </div>

              {/* Quick stats */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">{fmt(m.dailyImpressions)}</p>
                  <p className="text-[9px] text-muted-foreground">Impressions/day</p>
                </div>
                {isSales ? (
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                    <p className="text-lg font-bold text-foreground">{m.dailyConversions}</p>
                    <p className="text-[9px] text-muted-foreground">Est. purchases/day</p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                    <p className="text-lg font-bold text-foreground">{fmt(m.dailyClicks)}</p>
                    <p className="text-[9px] text-muted-foreground">Est. clicks/day</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upsell / encourage more spend */}
            <div className="border-t border-border bg-gradient-to-b from-primary/[0.03] to-primary/[0.08] px-4 py-3">
              <div className="flex items-start gap-2">
                <Rocket className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    Reach {m.reachGainPercent}% more people
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                    {isSales ? (
                      <>
                        At <strong className="text-foreground">SAR {m.nextTierBudget.toLocaleString()}/day</strong> you could
                        reach <strong className="text-foreground">{fmt(m.nextReach)}</strong> people and
                        get ~<strong className="text-foreground">{m.nextConversions} purchases/day</strong>
                      </>
                    ) : (
                      <>
                        At <strong className="text-foreground">SAR {m.nextTierBudget.toLocaleString()}/day</strong> you could
                        reach <strong className="text-foreground">{fmt(m.nextReach)}</strong> people daily
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Visual comparison */}
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-right text-[9px] text-muted-foreground">Current</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary/40" style={{ width: `${Math.max(5, (dailyBudget / m.nextTierBudget) * 100)}%` }} />
                  </div>
                  <span className="w-14 text-[9px] font-medium text-muted-foreground">SAR {dailyBudget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-right text-[9px] text-primary font-medium">Upgrade</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: "100%" }} />
                  </div>
                  <span className="w-14 text-[9px] font-bold text-primary">SAR {m.nextTierBudget.toLocaleString()}</span>
                </div>
              </div>

              {reachBarPercent < 5 && (
                <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
                  <TrendingUp className="mt-0.5 size-3 shrink-0 text-amber-600" />
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Your current budget reaches less than 5% of your audience. Increasing budget will help Snap find buyers faster and lower your cost per purchase over time.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
