"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepConfig {
  label: string;
  step: number;
}

/** Unified step names for all platforms: Audience -> Budget -> Ad Design -> Review */
export const UNIFIED_WIZARD_STEPS: StepConfig[] = [
  { label: "Audience", step: 1 },
  { label: "Budget", step: 2 },
  { label: "Ad Design", step: 3 },
  { label: "Review", step: 4 },
];

export type StepIndicatorAccent = "primary" | "meta" | "dv360";

interface StepIndicatorProps {
  steps: StepConfig[];
  current: number;
  accent?: StepIndicatorAccent;
}

export function StepIndicator({
  steps,
  current,
}: StepIndicatorProps) {
  return (
    <nav
      aria-label="Campaign progress"
      className="flex items-center gap-4 rounded-xl bg-card p-6"
    >
      {steps.map((s, i) => {
        const done = current > s.step;
        const active = current === s.step;
        const isLast = i === steps.length - 1;

        return (
          <div
            key={s.step}
            className={cn("flex items-center gap-2", !isLast && "flex-1")}
          >
            {/* Step number / checkmark */}
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg text-base font-bold",
                done
                  ? "bg-[#a4ffe5] text-[#004956]"
                  : active
                    ? "border-2 border-[#a4ffe5] bg-white text-[#003c47]"
                    : "border border-border bg-white text-muted-foreground"
              )}
            >
              {done ? (
                <Check className="size-5 stroke-[2.5]" />
              ) : (
                s.step
              )}
            </div>

            {/* Label */}
            <span
              className={cn(
                "shrink-0 text-sm font-medium whitespace-nowrap",
                done || active ? "text-[#004956]" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "ml-2 h-0 flex-1 border-t-2",
                  done
                    ? "border-[#a4ffe5]"
                    : "border-dashed border-border"
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
