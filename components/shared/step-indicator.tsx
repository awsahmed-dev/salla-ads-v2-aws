"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepConfig {
  label: string;
  step: number;
}

/** Unified step names for all platforms: Audience -> Budget -> Ad Design -> Launch */
export const UNIFIED_WIZARD_STEPS: StepConfig[] = [
  { label: "Audience", step: 1 },
  { label: "Budget", step: 2 },
  { label: "Ad Design", step: 3 },
  { label: "Launch", step: 4 },
];

export type StepIndicatorAccent = "primary" | "meta" | "dv360";

const ACCENT_CLASSES: Record<
  StepIndicatorAccent,
  { dot: string; label: string; bar: string; ring: string }
> = {
  primary: {
    dot: "bg-primary",
    label: "text-primary",
    bar: "bg-primary",
    ring: "ring-primary/30",
  },
  meta: {
    dot: "bg-[#1877F2]",
    label: "text-[#1877F2]",
    bar: "bg-[#1877F2]",
    ring: "ring-[#1877F2]/30",
  },
  dv360: {
    dot: "bg-red-600",
    label: "text-red-600",
    bar: "bg-red-600",
    ring: "ring-red-600/30",
  },
};

interface StepIndicatorProps {
  steps: StepConfig[];
  current: number;
  accent?: StepIndicatorAccent;
}

export function StepIndicator({
  steps,
  current,
  accent = "primary",
}: StepIndicatorProps) {
  const styles = ACCENT_CLASSES[accent];
  const total = steps.length;
  const fillPct = ((Math.min(current, total) - 1) / (total - 1)) * 100;

  return (
    <nav aria-label="Campaign progress" className="w-full">
      {/* Step labels */}
      <div className="flex justify-between mb-3">
        {steps.map((s) => {
          const done = current > s.step;
          const active = current === s.step;
          return (
            <span
              key={s.step}
              className={cn(
                "flex items-center gap-1 text-xs font-medium transition-colors",
                active ? cn(styles.label, "font-semibold") : done ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {done && <Check className="size-3" />}
              {s.label}
            </span>
          );
        })}
      </div>

      {/* Progress track */}
      <div className="relative h-1 w-full rounded-full bg-border/60">
        {/* Filled bar */}
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out", styles.bar)}
          style={{ width: `${fillPct}%` }}
        />

        {/* Step dots */}
        {steps.map((s, i) => {
          const done = current > s.step;
          const active = current === s.step;
          const left = (i / (total - 1)) * 100;
          return (
            <div
              key={s.step}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%` }}
            >
              <div
                className={cn(
                  "size-2.5 rounded-full transition-all",
                  done
                    ? styles.dot
                    : active
                      ? cn(styles.dot, "ring-4", styles.ring)
                      : "bg-border"
                )}
              />
            </div>
          );
        })}
      </div>
    </nav>
  );
}
