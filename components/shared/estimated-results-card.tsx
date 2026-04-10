"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  badge = "Predicted",
  disclaimer,
}: EstimatedResultsCardProps) {
  return (
    <div className="rounded-lg bg-card p-6">
      {/* Title */}
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-lg font-medium text-[#004d5a]">
          Estimated Results
        </h3>
        {badge && (
          <Badge variant="outline" className="text-[10px]">
            {badge}
          </Badge>
        )}
      </div>

      {/* Rows */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {row.label}
              </span>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  row.highlight ? "text-[#004d5a]" : "text-foreground"
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {disclaimer && (
        <p className="mt-4 text-[10px] leading-relaxed text-muted-foreground">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
