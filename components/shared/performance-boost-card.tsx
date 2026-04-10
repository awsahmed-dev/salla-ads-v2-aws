"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  SlidersHorizontal,
  UserCheck,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

const ORIGINAL_PRICE = 500;
const CURRENT_PRICE = 299;
const DISCOUNT_PCT = Math.round(((ORIGINAL_PRICE - CURRENT_PRICE) / ORIGINAL_PRICE) * 100);

function SallaLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 54 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M27.3 0C20.1 0 14 4.5 11.3 11H5.4C2.4 11 0 13.4 0 16.4v13.2C0 32.6 2.4 35 5.4 35h5.9c2.7 6.5 8.8 11 16 11 9.6 0 17.4-7.8 17.4-17.4v-11.2C44.7 7.8 36.9 0 27.3 0zm0 40.3c-5.7 0-10.7-3.3-13.1-8.1 1.4.5 2.9.8 4.5.8h17.2c1.6 0 3.1-.3 4.5-.8-2.4 4.8-7.4 8.1-13.1 8.1zm13.1-13.1c0 2.8-2.3 5.1-5.1 5.1H18.7c-2.8 0-5.1-2.3-5.1-5.1v-8.4c0-2.8 2.3-5.1 5.1-5.1h16.6c2.8 0 5.1 2.3 5.1 5.1v8.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function SarSymbol({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1124 1256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M699.5 1087.5c0 31.6-10.5 58-31.6 79.3-20.9 21.1-46.4 31.6-76.4 31.6H197.3c-31 0-57.4-10.5-79.3-31.6-20.1-21.3-30.2-47.7-30.2-79.3V916.9h124.6v137.4c0 10.5 3.7 19.5 11.1 27 7.4 7.4 16.4 11.1 27 11.1h351.4c10.5 0 19.5-3.7 27-11.1 7.4-7.5 11.1-16.5 11.1-27V916.9h59.5v170.6zm0-422.9v213.3H87.8V664.6h124.6v180.1h351.4V664.6h135.7zM87.8 0h124.6v553.5H87.8V0zm236 0h124.6v553.5H323.8V0zm236 0h139.7v553.5H559.8V0zm254.5 0H939v553.5H814.3V0zm185.6 0h124.6v553.5H999.9V0z" />
    </svg>
  );
}

const BOOST_FEATURES = [
  {
    icon: UserCheck,
    title: "Priority Review",
    desc: "Your ads get top priority in the approval queue for faster launching.",
  },
  {
    icon: SlidersHorizontal,
    title: "Smart Bid Adjustment",
    desc: "AI reviews bids regularly, with expert approval for all adjustments.",
  },
  {
    icon: Users,
    title: "3-Day Human + AI Monitoring",
    desc: "Experts and Salla AI monitor your campaign for the first 72 hours.",
  },
  {
    icon: RefreshCw,
    title: "Refund on Rejection",
    desc: `Full ${CURRENT_PRICE} SAR refund if the platform rejects your advertisement.`,
  },
  {
    icon: TrendingUp,
    title: "Audience Insights Report",
    desc: "View detailed reports on which audiences are performing best.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Creative Boost",
    desc: "Performance-tested AI suggestions for headlines and ad copy.",
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
        "relative overflow-hidden rounded-xl p-6 transition-all duration-300",
        enabled
          ? "shadow-md"
          : "opacity-80"
      )}
      style={{
        backgroundImage: enabled
          ? "linear-gradient(125deg, rgb(255, 255, 255) 78%, rgb(164, 255, 229) 98%)"
          : undefined,
        backgroundColor: enabled ? undefined : "hsl(var(--card))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Salla logo */}
          <div
            className={cn(
              "flex size-[51px] shrink-0 items-center justify-center rounded-full border-[3px] border-white shadow-md transition-colors",
              enabled
                ? "bg-emerald-50"
                : "bg-muted/60"
            )}
          >
            <SallaLogo
              className={cn(
                "size-8 transition-colors",
                enabled ? "text-[#004956]" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Campaign Performance Boost by Salla
              </h3>
              <Badge
                className={cn(
                  "rounded-full border-0 px-1.5 py-0.5 text-[10px]",
                  enabled
                    ? "bg-[#a4ffe5] text-[#004956]"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                {DISCOUNT_PCT}% Off
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Salla&apos;s ads team will optimize your campaign using best
              practices for superior results.
            </p>
          </div>
        </div>

        {/* Price + toggle */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">
              One-time payment
            </p>
            <div className="mt-0.5 flex items-center justify-end gap-1.5">
              <span className="text-sm font-medium text-muted-foreground line-through">
                {ORIGINAL_PRICE}
              </span>
              <span className="text-[10px] text-muted-foreground">&bull;</span>
              <SarSymbol className="size-3.5 text-foreground" />
              <span
                className={cn(
                  "text-xl font-bold tabular-nums tracking-tight",
                  enabled ? "text-foreground" : "text-foreground"
                )}
              >
                {CURRENT_PRICE}
              </span>
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </div>

      {/* Feature grid */}
      <div
        className={cn(
          "mt-6 grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-3 transition-all",
          enabled ? "opacity-100" : "opacity-60"
        )}
      >
        {BOOST_FEATURES.map((feat) => (
          <div
            key={feat.title}
            className="flex flex-col gap-2 px-4 py-4"
          >
            <div className="flex items-center gap-2">
              <feat.icon
                className={cn(
                  "size-5 shrink-0",
                  enabled ? "text-[#004956]" : "text-muted-foreground"
                )}
              />
              <p className="text-xs font-bold text-foreground">
                {feat.title}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
