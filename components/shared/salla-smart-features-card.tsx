"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Clock, Sparkles } from "lucide-react";
import { PURCHASER_PRESETS, SALLA_CATEGORIES } from "@/lib/salla-smart-features";

export type SallaSmartFeaturesAccent = "primary" | "meta" | "dv360";

const ACCENT = {
  primary: {
    card: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/50 dark:bg-emerald-950/30",
    badge: "bg-emerald-600",
    section: "border-emerald-200/60 dark:border-emerald-800/40",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    switch: "data-[state=checked]:bg-emerald-600",
    selected: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    focus: "focus:ring-emerald-500",
  },
  meta: {
    card: "border-[#1877F2]/20 bg-[#1877F2]/5 dark:border-[#1877F2]/30 dark:bg-[#1877F2]/10",
    badge: "bg-[#1877F2]",
    section: "border-[#1877F2]/20 dark:border-[#1877F2]/30",
    iconBg: "bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/20",
    switch: "data-[state=checked]:bg-[#1877F2]",
    selected: "border-[#1877F2] bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/20",
    focus: "focus:ring-[#1877F2]",
  },
  dv360: {
    card: "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/30",
    badge: "bg-red-600",
    section: "border-red-200/60 dark:border-red-800/40",
    iconBg: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    switch: "data-[state=checked]:bg-red-600",
    selected: "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200",
    focus: "focus:ring-red-500",
  },
} as const;

export interface SallaSmartFeaturesCardProps {
  excludeRecentPurchasers: boolean;
  onExcludeRecentPurchasersChange: (v: boolean) => void;
  excludeRecentPurchasersDays: number;
  onExcludeRecentPurchasersDaysChange: (days: number) => void;
  lookalikeEnabled: boolean;
  onLookalikeEnabledChange: (v: boolean) => void;
  sallaAudienceCategory: string;
  onSallaAudienceCategoryChange: (v: string) => void;
  accent?: SallaSmartFeaturesAccent;
  /** When false, only Lookalike Audiences (Smart) is shown. Default true. */
  showExcludePurchasers?: boolean;
  /** When false, only Exclude Recent Purchasers is shown. Default true. */
  showLookalike?: boolean;
}

export function SallaSmartFeaturesCard({
  excludeRecentPurchasers,
  onExcludeRecentPurchasersChange,
  excludeRecentPurchasersDays,
  onExcludeRecentPurchasersDaysChange,
  lookalikeEnabled,
  onLookalikeEnabledChange,
  sallaAudienceCategory,
  onSallaAudienceCategoryChange,
  accent = "primary",
  showExcludePurchasers = true,
  showLookalike = true,
}: SallaSmartFeaturesCardProps) {
  const s = ACCENT[accent];
  const validDays = PURCHASER_PRESETS.map((x) => x.days);
  const defaultDays = 30;
  const isSelected = (days: number) =>
    excludeRecentPurchasersDays === days ||
    (!validDays.includes(excludeRecentPurchasersDays) && days === defaultDays);

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-5",
        s.card
      )}
      role="region"
      aria-labelledby="salla-smart-features-heading"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg text-white shadow-sm",
            s.badge
          )}
        >
          <Store className="size-5" aria-hidden />
        </div>
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <h2
            id="salla-smart-features-heading"
            className="text-base font-bold text-foreground"
          >
            Salla Smart Features
          </h2>
          <Badge
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium text-white shadow-sm",
              s.badge
            )}
          >
            Powered by Salla
          </Badge>
        </div>
      </div>

      {showExcludePurchasers && (
        <section
          className={cn(
            "rounded-xl border bg-white p-4 shadow-sm dark:bg-background/80",
            s.section
          )}
          aria-labelledby="exclude-purchasers-heading"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    s.iconBg
                  )}
                >
                  <Clock className="size-4" aria-hidden />
                </div>
                <h3
                  id="exclude-purchasers-heading"
                  className="text-sm font-semibold text-foreground"
                >
                  Exclude Recent Purchasers
                </h3>
                <Badge className="shrink-0 rounded-md bg-amber-500 px-1.5 py-0 text-[10px] font-medium text-white">
                  new
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Exclude customers who made a purchase within the selected time period. This option is recommended when you want to expand your reach and focus on acquiring new customers.
              </p>
            </div>
            <Switch
              checked={excludeRecentPurchasers}
              onCheckedChange={onExcludeRecentPurchasersChange}
              className={cn("shrink-0", s.switch)}
              aria-label="Exclude recent purchasers"
            />
          </div>
          {excludeRecentPurchasers && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-2">
                {PURCHASER_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => onExcludeRecentPurchasersDaysChange(p.days)}
                    className={cn(
                      "rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2",
                      s.focus,
                      isSelected(p.days)
                        ? s.selected
                        : "border-border bg-white text-foreground hover:opacity-90 dark:bg-muted/20"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {showLookalike && (
      <section
        className={cn(
          "mt-4 rounded-xl border bg-white p-4 shadow-sm dark:bg-background/80",
          s.section
        )}
        aria-labelledby="lookalike-heading"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  s.iconBg
                )}
              >
                <Sparkles className="size-4" aria-hidden />
              </div>
              <h3
                id="lookalike-heading"
                className="text-sm font-semibold text-foreground"
              >
                Lookalike Audiences (Smart)
              </h3>
              <Badge className="shrink-0 rounded-md bg-amber-500 px-1.5 py-0 text-[10px] font-medium text-white">
                new
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reach new potential customers who are similar to your existing customers using Salla Ads' smart algorithms.
            </p>
          </div>
          <Switch
            checked={lookalikeEnabled}
            onCheckedChange={onLookalikeEnabledChange}
            className={cn("shrink-0", s.switch)}
            aria-label="Enable lookalike audiences"
          />
        </div>
        {lookalikeEnabled && (
          <div className="mt-4 pt-4 border-t border-border">
            <Select
              value={sallaAudienceCategory}
              onValueChange={onSallaAudienceCategoryChange}
            >
              <SelectTrigger
                id="salla-category-select"
                className="h-10 w-full border-border bg-white text-sm dark:bg-muted/20"
              >
                <SelectValue placeholder="Choose the audience that best matches your products." />
              </SelectTrigger>
              <SelectContent>
                {SALLA_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
