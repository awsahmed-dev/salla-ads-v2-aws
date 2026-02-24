"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShieldCheck, AlertCircle, CheckCircle2, Info } from "lucide-react";

export type DeliveryCheckAccent = "primary" | "meta" | "dv360";

const ACCENT: Record<DeliveryCheckAccent, { icon: string; iconBg: string }> = {
  primary: { icon: "text-primary", iconBg: "bg-primary/10" },
  meta: { icon: "text-[#1877F2]", iconBg: "bg-[#1877F2]/10" },
  dv360: { icon: "text-red-600", iconBg: "bg-red-600/10" },
};

export interface DeliveryIssue {
  message: string;
}

export interface DeliveryCheckCardProps {
  /** Validation issues. Empty array = all clear. */
  issues: DeliveryIssue[];
  /** Number of selected cities — used for a narrowing hint. */
  cityCount?: number;
  accent?: DeliveryCheckAccent;
  className?: string;
}

/**
 * Shared delivery eligibility check card for Step 1 (Audience).
 * Accepts pre-computed issues from each platform and shows pass/fail status.
 */
export function DeliveryCheckCard({
  issues,
  cityCount = 0,
  accent = "primary",
  className,
}: DeliveryCheckCardProps) {
  const style = ACCENT[accent];
  const isEligible = issues.length === 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm",
          className
        )}
        role="region"
        aria-label="Delivery Check"
      >
        <div className="mb-3 flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              style.iconBg
            )}
          >
            <ShieldCheck className={cn("size-4", style.icon)} />
          </div>
          <Label className="text-sm font-semibold text-foreground">
            Delivery Check
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3.5 cursor-help text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Checks if your targeting settings are ready for your campaign to
              start delivering.
            </TooltipContent>
          </Tooltip>
        </div>

        {isEligible ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 dark:border-emerald-800/40 dark:bg-emerald-950/30">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Eligible for delivery
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  Your targeting is set up correctly and ready to go.
                </p>
              </div>
            </div>
            {cityCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Narrowed to {cityCount} {cityCount === 1 ? "city" : "cities"}.
                Actual reach may be lower than country-level estimates.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {issues.map((issue, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 dark:border-amber-900/50 dark:bg-amber-950/30"
              >
                <AlertCircle className="size-3 shrink-0 text-amber-600" />
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  {issue.message}
                </span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Fix these issues for your campaign to be eligible for delivery.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
