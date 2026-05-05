"use client";

import { cn } from "@/lib/utils";
import { Lightbulb, Info } from "lucide-react";

interface Props {
  /** "tip" = actionable hint (Salla mint accent). "note" = neutral context (gray). */
  kind?: "tip" | "note";
  /** Override default title ("Salla Tip" / "Note") */
  title?: string;
  children: React.ReactNode;
  className?: string;
  /** Smaller padding */
  compact?: boolean;
}

/**
 * Inline contextual help — tiny, plain-language hint placed where users get
 * lost. Quality over quantity: only used in places where a number, badge,
 * or chart benefits from one sentence of guidance.
 *
 * Two variants:
 *   - "tip"  → green/mint, lightbulb, prefixed "Salla Tip:"  (action advice)
 *   - "note" → muted gray, info icon, prefixed "Note:"        (just context)
 */
export function SallaTip({ kind = "tip", title, children, className, compact }: Props) {
  const isTip = kind === "tip";
  const Icon = isTip ? Lightbulb : Info;
  const defaultTitle = isTip ? "Salla Tip" : "Note";

  return (
    <div
      className={cn(
        "rounded-xl border",
        compact ? "p-2" : "p-3",
        isTip
          ? "border-[#a4ffe5] bg-[#e6fff9]/70"
          : "border-border bg-muted/20",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={cn(
            "mt-0.5 shrink-0",
            compact ? "size-3" : "size-3.5",
            isTip ? "text-[#004956]" : "text-muted-foreground"
          )}
        />
        <div className={cn("leading-snug", compact ? "text-[10px]" : "text-[11px]")}>
          <span
            className={cn(
              "font-bold",
              isTip ? "text-[#004956]" : "text-foreground"
            )}
          >
            {title ?? defaultTitle}:
          </span>{" "}
          <span className="text-foreground/80">{children}</span>
        </div>
      </div>
    </div>
  );
}
