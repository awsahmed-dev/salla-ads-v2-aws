"use client";

import { cn } from "@/lib/utils";
import { BarChart3, Info } from "lucide-react";

export interface EstimatedResultRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface BidRangeData {
  min: number;
  max: number;
  current?: number;
  goalName: string;
}

interface EstimatedResultsCardProps {
  rows: EstimatedResultRow[];
  badge?: string;
  bidRange?: BidRangeData;
  dailyBudget?: number;
  disclaimer?: string;
}

export function EstimatedResultsCard({
  rows,
  badge = "Estimate",
  disclaimer,
}: EstimatedResultsCardProps) {
  return (
    <div className="rounded-lg bg-card p-4 sm:p-6">
      {/* Title */}
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="size-4 text-[#004956]" />
        <h3 className="text-sm font-bold text-[#004956]">
          Estimated Results
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {badge}
        </span>
      </div>

      {/* Rows */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {rows.map((row, i) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {row.label}
              </span>
              <span
                className={cn(
                  "text-right text-xs font-bold tabular-nums",
                  i === 0 ? "text-[#004956]" : "text-foreground"
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {disclaimer && (
        <div className="mt-3 flex items-start gap-1.5">
          <Info className="mt-0.5 size-3 shrink-0 text-muted-foreground/50" />
          <p className="text-[10px] leading-relaxed text-muted-foreground/70">
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
