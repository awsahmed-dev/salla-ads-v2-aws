"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface StepConfig {
  label: string;
  step: number;
}

/** Unified step names for all platforms: Audience → Budget → Ad Design → Launch */
export const UNIFIED_WIZARD_STEPS: StepConfig[] = [
  { label: "Audience", step: 1 },
  { label: "Budget", step: 2 },
  { label: "Ad Design", step: 3 },
  { label: "Launch", step: 4 },
];

export type StepIndicatorAccent = "primary" | "meta" | "dv360";

const ACCENT_CLASSES: Record<
  StepIndicatorAccent,
  { circle: string; label: string; line: string }
> = {
  primary: {
    circle: "bg-primary text-primary-foreground",
    label: "text-primary",
    line: "bg-primary",
  },
  meta: {
    circle: "bg-[#1877F2] text-white",
    label: "text-[#1877F2]",
    line: "bg-[#1877F2]",
  },
  dv360: {
    circle: "bg-red-600 text-white",
    label: "text-red-600",
    line: "bg-red-600",
  },
};

interface StepIndicatorProps {
  steps: StepConfig[];
  current: number;
  /** Platform accent for active/done state. Default: primary (Snapchat, TikTok, Google). */
  accent?: StepIndicatorAccent;
}

/**
 * Reusable step progress indicator for campaign wizards.
 * Unified across all platforms: same layout, naming (Audience, Budget, Ad Design, Launch), and behaviour.
 * Connector line fills only when current step is past that segment (current > step number).
 */
export function StepIndicator({
  steps,
  current,
  accent = "primary",
}: StepIndicatorProps) {
  const styles = ACCENT_CLASSES[accent];
  return (
    <nav aria-label="Campaign progress" className="w-full">
      <ol className="flex items-center gap-0">
        {steps.map((s, i) => {
          const done = current > s.step;
          const active = current === s.step;
          return (
            <li key={s.step} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    done ? styles.circle : active ? styles.circle : "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    active ? styles.label : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    current > s.step ? styles.line : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
