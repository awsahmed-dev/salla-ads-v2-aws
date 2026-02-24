"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, ChevronRight, Info } from "lucide-react";

export type WizardStepFooterAccent = "primary" | "meta" | "dv360";

export type WizardStepFooterMessageType = "error" | "warning" | "info";

const ACCENT = {
  primary: {
    next: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  meta: {
    next: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
  },
  dv360: {
    next: "bg-red-600 text-white hover:bg-red-700",
  },
} as const;

const MESSAGE_STYLES: Record<WizardStepFooterMessageType, string> = {
  error: "text-destructive",
  warning: "text-amber-600 dark:text-amber-500",
  info: "text-muted-foreground",
};

export interface WizardStepFooterProps {
  onPrevious: () => void;
  onNext: () => void;
  /** Label for the Next button, e.g. "Next: Budget & Schedule" */
  nextLabel: string;
  /** Disable the Next button when requirements aren't met */
  nextDisabled?: boolean;
  /** Show loading spinner on Next button (e.g. "Launch Campaign" submitting) */
  nextLoading?: boolean;
  /** Optional icon to show in Next button instead of ChevronRight (e.g. Rocket for Launch) */
  nextIcon?: React.ReactNode;
  /** Optional secondary action between Previous and Next (e.g. "Save Draft") */
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  /** Label for the Previous button. Default: "Previous" */
  previousLabel?: string;
  /** Hide the Previous button (e.g. on first step). Default: false */
  hidePrevious?: boolean;
  /** Visual accent for the Next button. Default: "primary" */
  accent?: WizardStepFooterAccent;
  /** Optional class for the outer fixed container */
  className?: string;
  /**
   * Optional message shown in the center of the footer (e.g. validation error when user clicks Next).
   * Use when Next is clicked but step cannot proceed — message appears right in the footer so the user sees it without scrolling.
   */
  message?: { type: WizardStepFooterMessageType; text: string };
}

/**
 * Shared sticky footer for campaign wizard steps. Fixed to the bottom of the viewport
 * so users can move to the next or previous step without scrolling. Use with step
 * content that has bottom padding (e.g. pb-24) so content isn't hidden behind the footer.
 */
export function WizardStepFooter({
  onPrevious,
  onNext,
  nextLabel,
  nextDisabled = false,
  nextLoading = false,
  nextIcon,
  secondaryAction,
  previousLabel = "Previous",
  hidePrevious = false,
  accent = "primary",
  className,
  message,
}: WizardStepFooterProps) {
  const style = ACCENT[accent];

  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className
      )}
      role="navigation"
      aria-label="Step navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Left: Previous */}
        <div className="flex min-w-0 shrink-0 basis-[120px] justify-start">
          {hidePrevious ? null : (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="gap-1.5 shrink-0 min-w-[100px]"
              aria-label={previousLabel}
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{previousLabel}</span>
            </Button>
          )}
        </div>

        {/* Center: message (validation error, warning, or info) — big space so errors appear here when user clicks Next */}
        <div
          className={cn(
            "flex min-h-[44px] flex-1 items-center justify-center px-4 text-center text-sm",
            message && MESSAGE_STYLES[message.type]
          )}
          role={message?.type === "error" ? "alert" : undefined}
        >
          {message && (
            <span className="flex items-center gap-2">
              {message.type === "error" && <AlertCircle className="size-4 shrink-0" aria-hidden />}
              {message.type === "warning" && <AlertCircle className="size-4 shrink-0" aria-hidden />}
              {message.type === "info" && <Info className="size-4 shrink-0" aria-hidden />}
              <span className="truncate">{message.text}</span>
            </span>
          )}
        </div>

        {/* Right: secondary action + Next */}
        <div className="flex min-w-0 shrink-0 basis-[240px] justify-end">
          <div className="flex items-center gap-4">
            {secondaryAction && (
              <Button
                type="button"
                variant="ghost"
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="shrink-0 gap-1.5 text-muted-foreground"
              >
                {secondaryAction.label}
              </Button>
            )}
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || nextLoading}
              className={cn("gap-1.5 shrink-0 min-w-[120px] px-6", style.next)}
              aria-label={nextLabel}
            >
              {nextLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                  Submitting...
                </>
              ) : (
                <>
                  <span className="truncate">{nextLabel}</span>
                  {nextIcon ?? <ChevronRight className="size-4 shrink-0" aria-hidden />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Bottom padding to add to step content so it isn't hidden behind the fixed footer. */
export const WIZARD_FOOTER_PADDING_BOTTOM = "pb-24";
