"use client";

import { useState } from "react";
import { CircleHelp, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------------ */
/*  LearnMoreTrigger — "How does this work?" pill button               */
/* ------------------------------------------------------------------ */

interface LearnMoreTriggerProps {
  onClick: () => void;
  label?: string;
}

export function LearnMoreTrigger({ onClick, label = "How does this work?" }: LearnMoreTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
    >
      <CircleHelp className="size-3" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  LearnMoreSheet — right-side educational Sheet                      */
/* ------------------------------------------------------------------ */

interface LearnMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  proTip?: string;
}

export function LearnMoreSheet({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  proTip,
}: LearnMoreSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-l-0 p-0 sm:max-w-[420px]">
        {/* Header */}
        <div className="bg-[#004956] px-6 pb-6 pt-8">
          <SheetTitle className="flex items-center gap-2.5 text-lg font-bold text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#a4ffe5]">
              <span className="[&>svg]:size-4 [&>svg]:text-[#004956]">{icon}</span>
            </div>
            {title}
          </SheetTitle>
          <p className="mt-2 text-[13px] leading-relaxed text-white/70">
            {description}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {children}
        </div>

        {/* Pro Tip Footer */}
        {proTip && (
          <>
            <div className="border-t border-border" />
            <div className="bg-muted/30 px-6 py-4">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-[#004956]">Pro tip:</span> {proTip}
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper sub-components for sheet body content                       */
/* ------------------------------------------------------------------ */

interface SheetSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export function SheetSection({ icon, title, children }: SheetSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3 flex items-center gap-2">
        <span className="[&>svg]:size-4 [&>svg]:text-[#004956]">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-wider text-[#004956]">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

interface SheetDecisionCardProps {
  title: string;
  description: string;
  highlighted?: boolean;
}

export function SheetDecisionCard({ title, description, highlighted }: SheetDecisionCardProps) {
  return (
    <div className={
      highlighted
        ? "rounded-xl border border-[#a4ffe5] bg-[#e6fff9] px-4 py-3"
        : "rounded-xl border border-border bg-white px-4 py-3"
    }>
      <p className={highlighted ? "text-xs font-bold text-[#004956]" : "text-xs font-bold text-foreground"}>
        {title}
      </p>
      <p className={
        highlighted
          ? "mt-1 text-[11px] leading-relaxed text-[#004956]/70"
          : "mt-1 text-[11px] leading-relaxed text-muted-foreground"
      }>
        {description}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  useLearnMore — convenience hook                                    */
/* ------------------------------------------------------------------ */

export function useLearnMore() {
  const [open, setOpen] = useState(false);
  return { open, setOpen, triggerProps: { onClick: () => setOpen(true) } };
}
