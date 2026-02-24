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
} from "lucide-react";

const ORIGINAL_PRICE = 199;
const CURRENT_PRICE = 149;
const SAVINGS = ORIGINAL_PRICE - CURRENT_PRICE;
const DISCOUNT_PCT = Math.round((SAVINGS / ORIGINAL_PRICE) * 100);

const BOOST_FEATURES = [
  {
    icon: Rocket,
    title: "3-Day Launch Boost",
    desc: "Extra ad credit injected during the critical first 72 hours",
  },
  {
    icon: BarChart3,
    title: "Smart Optimization",
    desc: "AI-driven bid & audience adjustments in real time",
  },
  {
    icon: Shield,
    title: "Priority Review",
    desc: "Fast-tracked ad approval so your campaign goes live sooner",
  },
  {
    icon: Sparkles,
    title: "Creative Enhancement",
    desc: "Auto-optimized headlines, thumbnails & ad copy for higher CTR",
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
      {/* Subtle gradient glow when active */}
      {enabled && (
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/[0.06] blur-3xl" />
      )}

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
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
                Save {DISCOUNT_PCT}%
              </Badge>
              {enabled && (
                <Badge className="rounded-full border-0 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="mr-0.5 size-3" />
                  Active
                </Badge>
              )}
            </div>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              Supercharge your campaign with Salla&apos;s AI optimization --
              extra ad credit, smart bidding, and priority review during the
              first 3 days.
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
          "mt-4 grid grid-cols-2 gap-2.5 transition-all",
          enabled ? "opacity-100" : "opacity-60"
        )}
      >
        {BOOST_FEATURES.map((feat) => (
          <div
            key={feat.title}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
              enabled
                ? "border-primary/15 bg-primary/[0.03]"
                : "border-border/40 bg-muted/20"
            )}
          >
            <feat.icon
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                enabled ? "text-primary" : "text-muted-foreground"
              )}
            />
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                {feat.title}
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                {feat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom info bar */}
      <div className="mt-3.5 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Info className="size-3" />
          <span>
            Charged only when enabled &middot; No recurring fees &middot;
            Cancel anytime before launch
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-[10px] font-semibold text-primary hover:underline"
            >
              Learn more
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            Salla Performance Boost adds SAR {CURRENT_PRICE} ad credit to your
            campaign during the first 3 days. Our AI continuously optimizes bids,
            audiences, and creative elements. You&apos;re only charged if you
            keep it enabled at launch.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
