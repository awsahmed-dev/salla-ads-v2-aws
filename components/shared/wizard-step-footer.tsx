"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export type WizardStepFooterAccent = "primary" | "meta" | "dv360";
export type WizardStepFooterMessageType = "error" | "warning" | "info";

export interface WizardStepFooterProps {
  onPrevious: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextIcon?: React.ReactNode;
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  previousLabel?: string;
  hidePrevious?: boolean;
  accent?: WizardStepFooterAccent;
  className?: string;
  message?: { type: WizardStepFooterMessageType; text: string };
  /** Auto-save status: "saved" | "saving" | "idle" */
  saveStatus?: "saved" | "saving" | "idle";
}

export function WizardStepFooter({
  onPrevious,
  onNext,
  nextLabel,
  nextDisabled = false,
  nextLoading = false,
  previousLabel = "Back",
  hidePrevious = false,
  className,
  message,
  saveStatus = "saved",
}: WizardStepFooterProps) {
  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]",
        className
      )}
      role="navigation"
      aria-label="Step navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-4 sm:gap-4 sm:px-6">
        {/* Left: Back button */}
        {!hidePrevious && (
          <button
            type="button"
            onClick={onPrevious}
            className="flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
          >
            {previousLabel}
          </button>
        )}

        {/* Center: validation message */}
        <div className="flex flex-1 items-center justify-center">
          {message && (
            <span
              className={cn(
                "flex items-center gap-1.5 text-sm",
                message.type === "error" && "text-red-600",
                message.type === "warning" && "text-amber-600",
                message.type === "info" && "text-muted-foreground"
              )}
              role={message.type === "error" ? "alert" : undefined}
            >
              <AlertCircle className="size-4 shrink-0" />
              {message.text}
            </span>
          )}
        </div>

        {/* Right: Auto-save + Next */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-1 text-sm font-medium text-foreground sm:flex">
            Auto save
            {saveStatus === "saving" ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <CheckCircle2 className="size-4 text-[#004956]" />
            )}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            className={cn(
              "flex h-10 w-[100px] items-center justify-center rounded-lg border-2 text-sm font-medium transition-colors sm:w-[120px]",
              nextDisabled
                ? "border-[#e6fff9] bg-[#e6fff9] text-[#95c8d0] cursor-not-allowed"
                : "border-[#a4ffe5] bg-[#a4ffe5] text-[#004956] hover:bg-[#8af5d5]"
            )}
          >
            {nextLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              nextLabel
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}

/** Bottom padding to add to step content so it isn't hidden behind the fixed footer. */
export const WIZARD_FOOTER_PADDING_BOTTOM = "pb-40";
