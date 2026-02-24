"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

export type ReadinessChecklistAccent = "primary" | "meta" | "dv360";

export interface ReadinessCheckItem {
  label: string;
  done: boolean;
}

const ACCENT = {
  primary: {
    icon: "text-primary",
    iconBg: "bg-primary/10",
    barIncomplete: "bg-primary",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    barIncomplete: "bg-[#1877F2]",
  },
  dv360: {
    icon: "text-red-600",
    iconBg: "bg-red-600/10",
    barIncomplete: "bg-red-600",
  },
} as const;

export interface AudienceReadinessChecklistProps {
  /** List of checks; each has label and whether it's done. Sorted so incomplete show first. */
  checks: ReadinessCheckItem[];
  /** Card title. Default: "Checklist" */
  title?: string;
  /** Success message when all checks pass. Default: "All checks passed. Ready to proceed." */
  successMessage?: string;
  /** Visual accent for icon and progress bar (when incomplete). */
  accent?: ReadinessChecklistAccent;
  className?: string;
}

/**
 * Shared campaign readiness checklist for Step 1 (Audience) across all platforms.
 * Shows progress (X/Y), a progress bar, and a list of requirements with checkmarks.
 * Incomplete items are shown first; when all pass, shows a success message.
 */
export function AudienceReadinessChecklist({
  checks,
  title = "Checklist",
  successMessage = "All checks passed. Ready to proceed.",
  accent = "primary",
  className,
}: AudienceReadinessChecklistProps) {
  const passed = checks.filter((c) => c.done).length;
  const total = checks.length;
  const allPassed = total > 0 && passed === total;
  const style = ACCENT[accent];

  const sortedChecks = [...checks].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className
      )}
      role="region"
      aria-label={title}
      aria-live="polite"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", style.iconBg)}>
            <CheckCircle2 className={cn("size-4", style.icon)} />
          </div>
          <Label className="text-sm font-semibold text-foreground truncate">{title}</Label>
        </div>
        <span
          className={cn(
            "shrink-0 text-xs font-semibold tabular-nums",
            allPassed ? "text-emerald-600" : "text-muted-foreground"
          )}
        >
          {passed}/{total}
        </span>
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            allPassed ? "bg-emerald-500" : style.barIncomplete
          )}
          style={{ width: total === 0 ? "0%" : `${(passed / total) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-1">
        {sortedChecks.map((c, i) => (
          <div key={`${c.label}-${i}`} className="flex items-center gap-2 py-0.5">
            {c.done ? (
              <CheckCircle2 className="size-3 shrink-0 text-emerald-500" aria-hidden />
            ) : (
              <div
                className="size-3 shrink-0 rounded-full border border-muted-foreground/30"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "text-xs",
                c.done ? "text-muted-foreground line-through" : "font-medium text-foreground"
              )}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {allPassed && (
        <div
          className="mt-2.5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/40 dark:bg-emerald-950/30"
          role="status"
        >
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
