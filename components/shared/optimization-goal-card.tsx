"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared/section-card";
import { ArrowRight, Sparkles, AlertCircle } from "lucide-react";

export interface GoalOption {
  value: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
  recommended?: boolean;
  billingLabel?: string;
  bestFor?: string;
  costHint?: string;
  requiresPixel?: boolean;
  requiresMMP?: boolean;
  locked?: boolean;
}

export type PixelReadiness = "none" | "new" | "established";

interface OptimizationGoalCardProps {
  goals: GoalOption[];
  selectedGoal: string;
  onGoalChange: (value: string) => void;
  layout?: "grid" | "list";
  subtitle?: string;
  accent?: string;
  apiBadge?: string;
  warnings?: React.ReactNode;
  infoTipText?: string;
  pixelReadiness?: PixelReadiness;
  children?: React.ReactNode;
  learnMoreTrigger?: React.ReactNode;
}

export function OptimizationGoalCard({
  goals,
  selectedGoal,
  onGoalChange,
  layout = "list",
  subtitle,
  warnings,
  infoTipText = "Choose the action you want to optimize. This determines how your budget is spent.",
  pixelReadiness,
  children,
  learnMoreTrigger,
}: OptimizationGoalCardProps) {
  const isNewPixel = pixelReadiness === "new";
  const selectedGoalObj = goals.find((g) => g.value === selectedGoal);
  const isAdvancedGoalWithNewPixel = isNewPixel && selectedGoalObj?.requiresPixel && selectedGoal !== "PIXEL_PAGE_VIEW" && selectedGoal !== "LANDING_PAGE_VIEW";

  return (
    <SectionCard>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Optimization Strategy
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {infoTipText}
          </p>
        </div>
        {learnMoreTrigger}
      </div>

      {subtitle && (
        <p className="mb-4 text-xs text-muted-foreground">{subtitle}</p>
      )}

      {/* Pixel readiness — progression path for new pixels */}
      {isNewPixel && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#a4ffe5]/40 bg-[#e6fff9]/30 px-4 py-3">
          <Sparkles className="size-4 shrink-0 text-[#004956]" />
          <p className="text-[11px] text-[#004956]/80">
            <span className="font-semibold text-[#004956]">New pixel?</span> Start with Page Views to build data, then scale up.
          </p>
        </div>
      )}

      {layout === "grid" ? (
        <div
          className={cn(
            "grid gap-6",
            goals.length <= 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
          )}
        >
          {goals.map((g) => {
            const selected = selectedGoal === g.value;
            const isLocked = g.locked;

            return (
              <button
                key={g.value}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && onGoalChange(g.value)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border px-5 py-4 text-center transition-all",
                  selected
                    ? "border-[#a4ffe5] bg-[#e6fff9]"
                    : "border-border bg-card hover:border-border/80",
                  isLocked && "cursor-not-allowed opacity-50"
                )}
              >
                {/* Icon */}
                {g.icon && (
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full",
                      selected
                        ? "bg-[#a4ffe5] text-[#004956]"
                        : isLocked
                          ? "bg-muted/40 text-muted-foreground/50"
                          : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    {g.icon}
                  </div>
                )}

                {/* Title + badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {g.recommended && !isLocked && (
                    <Badge className="rounded-full border-0 bg-[#a4ffe5] px-1.5 py-0.5 text-xs font-normal text-[#004956]">
                      Best
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "text-xs font-bold",
                      selected ? "text-[#004956]" : isLocked ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {g.label}
                  </span>
                  {isLocked && g.requiresPixel && (
                    <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-1 py-0 text-[11px] text-amber-600">
                      Pixel needed
                    </Badge>
                  )}
                  {isLocked && g.requiresMMP && (
                    <Badge variant="outline" className="rounded-full border-orange-300 bg-orange-50 px-1 py-0 text-[11px] text-orange-600">
                      MMP needed
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs leading-snug text-muted-foreground">
                  {isLocked && g.requiresPixel
                    ? "Set up your Snap Pixel first to unlock this goal."
                    : g.desc}
                </p>

                {/* Cost hint */}
                {selected && g.costHint && (
                  <p className="text-xs font-normal text-foreground">
                    {g.costHint}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* List layout */
        <div className="grid gap-2.5">
          {goals.map((g) => {
            const selected = selectedGoal === g.value;
            const isLocked = g.locked;

            return (
              <button
                key={g.value}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && onGoalChange(g.value)}
                className={cn(
                  "relative flex items-start gap-3.5 rounded-xl border px-4 py-4 text-left transition-all",
                  selected
                    ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                    : "border-border bg-background hover:border-border/80",
                  isLocked && "cursor-not-allowed opacity-50"
                )}
              >
                {g.icon && (
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      selected
                        ? "bg-[#a4ffe5] text-[#004956]"
                        : isLocked
                          ? "bg-muted/40 text-muted-foreground/50"
                          : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    {g.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        selected ? "text-[#004956]" : isLocked ? "text-muted-foreground" : "text-foreground"
                      )}
                    >
                      {g.label}
                    </span>
                    {g.recommended && !isLocked && (
                      <Badge className="rounded-full border-0 bg-[#a4ffe5] px-1.5 py-0.5 text-xs font-normal text-[#004956]">
                        Best
                      </Badge>
                    )}
                    {g.billingLabel && (
                      <Badge variant="outline" className="rounded-full px-1.5 py-0 text-xs font-normal">
                        {g.billingLabel}
                      </Badge>
                    )}
                    {isLocked && g.requiresPixel && (
                      <Badge variant="outline" className="rounded-full border-amber-300 bg-amber-50 px-1.5 py-0 text-xs text-amber-600">
                        Pixel needed
                      </Badge>
                    )}
                    {isLocked && g.requiresMMP && (
                      <Badge variant="outline" className="rounded-full border-orange-300 bg-orange-50 px-1.5 py-0 text-xs text-orange-600">
                        MMP needed
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isLocked && g.requiresPixel
                      ? "Set up your Snap Pixel in the Objective step to unlock this goal."
                      : g.desc}
                  </p>
                  {selected && g.bestFor && (
                    <p className="mt-1 text-xs font-medium text-[#004956]/80">
                      {g.bestFor}
                    </p>
                  )}
                  {selected && g.costHint && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                      {g.costHint}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {warnings}

      {/* Warning when selecting advanced goal with new pixel */}
      {isAdvancedGoalWithNewPixel && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
          <p className="text-[11px] text-amber-700">
            Consider starting with <span className="font-semibold">Page Views</span> first — your pixel needs data to optimize for {selectedGoalObj?.label?.toLowerCase()}.
          </p>
        </div>
      )}

      {children}
    </SectionCard>
  );
}
