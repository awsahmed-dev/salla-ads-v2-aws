"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Users, ClipboardList } from "lucide-react";

export type TargetingSummaryAccent = "primary" | "meta" | "dv360";

export interface TargetingSummaryRow {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

const ACCENT = {
  primary: {
    icon: "text-primary",
    iconBg: "bg-primary/10",
    highlight: "text-primary",
  },
  meta: {
    icon: "text-[#1877F2]",
    iconBg: "bg-[#1877F2]/10",
    highlight: "text-[#1877F2]",
  },
  dv360: {
    icon: "text-red-600",
    iconBg: "bg-red-600/10",
    highlight: "text-red-600",
  },
} as const;

const EMPTY_VALUES = new Set(["None", "0", "Not set", "—", "N/A", ""]);

function isEmptyValue(v: React.ReactNode): boolean {
  if (typeof v === "string") return EMPTY_VALUES.has(v.trim());
  return v === null || v === undefined;
}

export interface TargetingSummaryCardProps {
  rows: TargetingSummaryRow[];
  title?: string;
  accent?: TargetingSummaryAccent;
  className?: string;
}

export function TargetingSummaryCard({
  rows,
  title = "Targeting Summary",
  accent = "primary",
  className,
}: TargetingSummaryCardProps) {
  const style = ACCENT[accent];

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm",
          className
        )}
        role="region"
        aria-label="Targeting Summary"
      >
        <div className="mb-3 flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              style.iconBg
            )}
          >
            <Users className={cn("size-4", style.icon)} />
          </div>
          <Label className="text-sm font-semibold text-foreground">{title}</Label>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <ClipboardList className="size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Configure your audience to see a targeting summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 shadow-sm",
          className
        )}
        role="region"
        aria-labelledby="targeting-summary-title"
      >
        <div className="mb-3 flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              style.iconBg
            )}
          >
            <Users className={cn("size-4", style.icon)} />
          </div>
          <Label
            id="targeting-summary-title"
            className="text-sm font-semibold text-foreground"
          >
            {title}
          </Label>
        </div>
        <div className="flex flex-col gap-2 text-xs">
          {rows.map((row, i) => {
            const empty = isEmptyValue(row.value);
            const displayValue = empty ? "Not set" : row.value;
            const stringValue =
              typeof row.value === "string" ? row.value : undefined;
            const isTruncatable = stringValue && stringValue.length > 22;

            const valueEl = (
              <span
                className={cn(
                  "max-w-[180px] truncate text-right font-medium",
                  empty
                    ? "text-muted-foreground font-normal italic"
                    : row.highlight
                      ? style.highlight
                      : "text-foreground"
                )}
                title={stringValue}
              >
                {displayValue}
              </span>
            );

            return (
              <div key={i} className="flex justify-between gap-2">
                <span className="shrink-0 text-muted-foreground">{row.label}</span>
                {isTruncatable ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{valueEl}</TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {stringValue}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  valueEl
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
