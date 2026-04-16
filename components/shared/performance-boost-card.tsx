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
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M29.0842 20.41L27.7611 9.38021C27.4052 6.41059 24.881 4.17041 21.8896 4.17041H9.25265C6.26126 4.17041 3.73699 6.41059 3.38105 9.38021L2.05932 20.41C1.85825 22.0877 2.38552 23.7749 3.50755 25.0387C4.62821 26.3033 6.24079 27.0276 7.93092 27.0276H23.2127C24.9013 27.0276 26.514 26.3033 27.636 25.0387C28.7566 23.7753 29.2853 22.088 29.0842 20.41ZM25.4598 23.1218C24.8592 23.7985 24.0306 24.1707 23.1273 24.1707H8.01659C7.11199 24.1707 6.28299 23.7985 5.68412 23.1218C5.08354 22.4453 4.81338 21.5787 4.92044 20.6806L6.22729 9.77448C6.41498 8.20951 7.74598 7.02739 9.32345 7.02739H21.8191C23.3961 7.02739 24.7276 8.20915 24.9152 9.77448L26.2234 20.6806C26.3306 21.5787 26.0586 22.4453 25.4598 23.1218Z"
        fill="currentColor"
      />
      <path
        d="M23.1637 17.0236C22.9557 16.7047 22.6361 16.4859 22.2636 16.4076C21.8904 16.3291 21.5103 16.4006 21.1913 16.6083C17.3865 19.0897 13.6837 19.0893 9.87166 16.608C9.55266 16.4003 9.17156 16.3288 8.79938 16.4079C8.42686 16.4866 8.10764 16.7058 7.89993 17.0246C7.69222 17.3436 7.62108 17.7244 7.69989 18.0969C7.77858 18.4694 7.99772 18.7887 8.3166 18.9964C10.6988 20.5472 13.1274 21.3333 15.5347 21.3333C17.9426 21.3333 20.3693 20.5468 22.7481 18.9957C23.067 18.7876 23.2857 18.4681 23.3641 18.0955C23.4429 17.7234 23.3718 17.3426 23.1637 17.0236Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SarSymbol({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 13 14"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.79601 12.4024C7.57248 12.8981 7.42472 13.4359 7.36812 14L12.0984 12.9944C12.322 12.4989 12.4696 11.9609 12.5263 11.3969L7.79601 12.4024Z" />
      <path d="M12.0984 9.98193C12.322 9.4864 12.4697 8.94842 12.5263 8.38436L8.84156 9.16805V7.66151L12.0983 6.96941C12.3219 6.47388 12.4696 5.9359 12.5262 5.37184L8.84144 6.15486V0.736889C8.27683 1.05391 7.77539 1.4759 7.36778 1.97365V6.4682L5.89411 6.78143V0C5.32949 0.316908 4.82806 0.739006 4.42044 1.23677V7.09455L1.12311 7.79522C0.899577 8.29075 0.751709 8.82874 0.694991 9.3928L4.42044 8.60109V10.4983L0.427893 11.3467C0.204363 11.8423 0.0566066 12.3802 0 12.9443L4.17909 12.0562C4.51928 11.9854 4.81168 11.7843 5.00178 11.5075L5.76819 10.3713C5.84775 10.2537 5.89411 10.1117 5.89411 9.95909V8.28786L7.36778 7.97463V10.9877L12.0984 9.98193Z" />
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
  learnMoreTrigger?: React.ReactNode;
}

export function PerformanceBoostCard({
  enabled,
  onToggle,
  learnMoreTrigger,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Left: icon + title + description */}
        <div className="flex items-start gap-4">
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
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Campaign Performance Boost by Salla
              </h3>
              <Badge
                className={cn(
                  "rounded-full border-0 px-1.5 py-0.5 text-xs",
                  enabled
                    ? "bg-[#a4ffe5] text-[#004956]"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}
              >
                {DISCOUNT_PCT}% Off
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Salla&apos;s ads team will optimize your campaign using best
                practices for superior results.
              </p>
              {learnMoreTrigger}
            </div>
          </div>
        </div>

        {/* Price + toggle — own row on mobile, right-side on desktop */}
        <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
          <div className="sm:text-right">
            <p className="text-xs text-muted-foreground">One-time payment</p>
            <div className="mt-0.5 flex items-center gap-1.5 sm:justify-end">
              <span className="text-sm font-medium text-muted-foreground line-through">
                {ORIGINAL_PRICE}
              </span>
              <span className="text-xs text-muted-foreground">&bull;</span>
              <SarSymbol className="size-3.5 text-foreground" />
              <span className="text-xl font-bold tabular-nums tracking-tight text-foreground">
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
