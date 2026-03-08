"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Zap,
  Info,
  Rocket,
  Shield,
  BarChart3,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

const ORIGINAL_PRICE = 500;
const CURRENT_PRICE = 299;
const DISCOUNT_PCT = Math.round(((ORIGINAL_PRICE - CURRENT_PRICE) / ORIGINAL_PRICE) * 100);

const BOOST_FEATURES = [
  {
    icon: Rocket,
    title: "3-Day Human + AI Monitoring",
    desc: "A specialist and Salla's AI monitor your campaign for the first 72 hours",
  },
  {
    icon: BarChart3,
    title: "Smart Bid Tuning",
    desc: "AI reviews bids regularly, specialist approves adjustments",
  },
  {
    icon: Shield,
    title: "Priority Review",
    desc: "Your ads are prioritized in the approval queue",
  },
  {
    icon: Sparkles,
    title: "AI Creative Enhancement",
    desc: "AI-generated headline and copy suggestions tested for performance",
  },
  {
    icon: TrendingUp,
    title: "Audience Insights Report",
    desc: "See which audiences perform best for your campaign",
  },
  {
    icon: RefreshCw,
    title: "Refund if Disapproved",
    desc: "Full SAR 299 back if Snapchat rejects your ad",
  },
];

interface PerformanceBoostCardProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function PerformanceBoostCard({
  enabled,
  onToggle,
}: PerformanceBoostCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-5 transition-all duration-300",
        enabled
          ? "border-primary/40 bg-gradient-to-br from-primary/[0.04] via-primary/[0.02] to-transparent shadow-md shadow-primary/5"
          : "border-border/60 bg-card hover:border-border"
      )}
    >
      {enabled && (
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/[0.06] blur-3xl" />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              enabled
                ? "bg-primary/15 shadow-sm shadow-primary/10"
                : "bg-muted/60"
            )}
          >
            <Zap
              className={cn(
                "size-5 transition-colors",
                enabled ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Salla Performance Boost
              </h3>
              <Badge
                className={cn(
                  "rounded-full border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  enabled
                    ? "bg-primary/15 text-primary"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                {DISCOUNT_PCT}% off
              </Badge>
              {enabled && (
                <Badge className="rounded-full border-0 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="mr-0.5 size-3" />
                  Added
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Human specialist + AI working together on your campaign for 3 days.
            </p>
          </div>
        </div>

        {/* Price + toggle */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-xs font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                {ORIGINAL_PRICE}
              </span>
              <span
                className={cn(
                  "text-lg font-extrabold tabular-nums tracking-tight",
                  enabled ? "text-primary" : "text-foreground"
                )}
              >
                {CURRENT_PRICE}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                SAR
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">one-time</p>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>

      {/* Feature grid */}
      <div
        className={cn(
          "mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 transition-all",
          enabled ? "opacity-100" : "opacity-60"
        )}
      >
        {BOOST_FEATURES.map((feat) => (
          <div
            key={feat.title}
            className={cn(
              "rounded-lg border px-3 py-2.5 transition-colors",
              enabled
                ? "border-primary/15 bg-primary/[0.03]"
                : "border-border/40 bg-muted/20"
            )}
          >
            <feat.icon
              className={cn(
                "mb-1.5 size-3.5",
                enabled ? "text-primary" : "text-muted-foreground"
              )}
            />
            <p className="text-[11px] font-semibold leading-tight text-foreground">
              {feat.title}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Trust bar */}
      <div className="mt-3.5 flex items-center justify-between rounded-lg bg-muted/30 px-3.5 py-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            One-time
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Cancel before launch
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Refund if disapproved
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
            >
              <Info className="size-3" />
              Details
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed">
            <p className="font-semibold">When you enable Boost:</p>
            <ol className="mt-1 list-inside list-decimal space-y-0.5 text-muted-foreground">
              <li>A specialist + AI monitor your campaign for 3 days</li>
              <li>AI tunes bids, specialist reviews and approves</li>
              <li>Your ads get priority in the review queue</li>
              <li>AI generates creative suggestions + audience report</li>
            </ol>
            <p className="mt-2 text-[11px] font-medium text-emerald-600">
              Full SAR {CURRENT_PRICE} refund if your ad is disapproved.
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Powered by Salla Ads — not a Snapchat feature.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
