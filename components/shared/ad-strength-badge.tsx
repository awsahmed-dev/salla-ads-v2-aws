"use client";

import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AdStrengthResult {
  /** 0-100 score */
  score: number;
  /** Human label, e.g. "Excellent", "Good", "Average", "Poor" */
  label: string;
  /** Tailwind text-color class, e.g. "text-emerald-600" */
  color: string;
}

interface AdStrengthBadgeProps {
  strength: AdStrengthResult;
  /** Compact = inline pill. Full = card with progress bar. Default: "full" */
  variant?: "full" | "compact";
  /** Optional title override. Default: "Ad Strength" */
  title?: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: score → bar color                                          */
/* ------------------------------------------------------------------ */

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdStrengthBadge({
  strength,
  variant = "full",
  title = "Ad Strength",
}: AdStrengthBadgeProps) {
  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          strength.score >= 80
            ? "bg-emerald-100 text-emerald-700"
            : strength.score >= 60
              ? "bg-blue-100 text-blue-700"
              : strength.score >= 40
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
        )}
      >
        <Gauge className="size-3" />
        {strength.label}
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground">
          {title}
        </span>
        <span className={cn("text-xs font-bold", strength.color)}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor(strength.score))}
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  );
}
