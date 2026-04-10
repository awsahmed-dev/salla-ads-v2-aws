"use client";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PURCHASER_PRESETS, SALLA_CATEGORIES } from "@/lib/salla-smart-features";

export type SallaSmartFeaturesAccent = "primary" | "meta" | "dv360";

export interface SallaSmartFeaturesCardProps {
  excludeRecentPurchasers: boolean;
  onExcludeRecentPurchasersChange: (v: boolean) => void;
  excludeRecentPurchasersDays: number;
  onExcludeRecentPurchasersDaysChange: (days: number) => void;
  lookalikeEnabled: boolean;
  onLookalikeEnabledChange: (v: boolean) => void;
  sallaAudienceCategory: string;
  onSallaAudienceCategoryChange: (v: string) => void;
  /** Smart Targeting toggle state */
  smartTargetingEnabled?: boolean;
  onSmartTargetingChange?: (v: boolean) => void;
  /** Whether Smart Targeting is blocked (e.g. requires both expansion options) */
  smartTargetingDisabled?: boolean;
  accent?: SallaSmartFeaturesAccent;
  showExcludePurchasers?: boolean;
  showLookalike?: boolean;
}

function NewBadge() {
  return (
    <span className="rounded-full bg-gradient-to-r from-[#ffd8c2] to-[#ffaf83] px-2 py-0.5 text-xs text-[#883000]">
      New
    </span>
  );
}

function RecommendedBadge() {
  return (
    <span className="rounded-full bg-gradient-to-r from-[#ffd8c2] to-[#ffaf83] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#883000]">
      Recommended
    </span>
  );
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
  smartTargetingEnabled = false,
  onSmartTargetingChange,
  smartTargetingDisabled = false,
  showExcludePurchasers = true,
  showLookalike = true,
}: SallaSmartFeaturesCardProps) {
  const validDays = PURCHASER_PRESETS.map((x) => x.days);
  const defaultDays = 30;
  const isSelected = (days: number) =>
    excludeRecentPurchasersDays === days ||
    (!validDays.includes(excludeRecentPurchasersDays) && days === defaultDays);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-bold text-foreground">
          Salla Smart Features ✨
        </h3>
      </div>

      {/* Exclude Recent Buyers */}
      {showExcludePurchasers && (
        <div className="px-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Exclude Recent Buyers
                </p>
                <NewBadge />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Exclude recent customers to focus your budget on reaching new audiences.
              </p>
            </div>
            <Switch
              checked={excludeRecentPurchasers}
              onCheckedChange={onExcludeRecentPurchasersChange}
            />
          </div>
          {excludeRecentPurchasers && (
            <div className="mt-4 flex gap-2">
              {PURCHASER_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => onExcludeRecentPurchasersDaysChange(p.days)}
                  className={cn(
                    "rounded-lg border px-5 py-2.5 text-xs font-medium transition-all",
                    isSelected(p.days)
                      ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956]"
                      : "border-border bg-card text-foreground hover:border-border/80"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lookalike Audiences */}
      {showLookalike && (
        <div className="px-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  Lookalike Audiences (Smart)
                </p>
                <NewBadge />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Target new audiences similar to your current customers using Salla&apos;s ad algorithms.
              </p>
            </div>
            <Switch
              checked={lookalikeEnabled}
              onCheckedChange={onLookalikeEnabledChange}
            />
          </div>
          {lookalikeEnabled && (
            <div className="mt-4">
              <Select
                value={sallaAudienceCategory}
                onValueChange={onSallaAudienceCategoryChange}
              >
                <SelectTrigger className="h-10 w-full text-sm">
                  <SelectValue placeholder="Select the category closest to your products" />
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
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border/40" />

      {/* Smart Targeting */}
      <div className={cn("flex items-center justify-between px-6 py-5", smartTargetingDisabled && "opacity-50")}>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-foreground">Smart Targeting</p>
            <RecommendedBadge />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Expand beyond gender and age limits to maximize conversions. Requires both expansion options enabled.
          </p>
        </div>
        <Switch
          checked={smartTargetingEnabled}
          onCheckedChange={onSmartTargetingChange}
          disabled={smartTargetingDisabled}
        />
      </div>
    </div>
  );
}
