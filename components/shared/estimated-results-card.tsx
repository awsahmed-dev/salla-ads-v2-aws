"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle } from "lucide-react";

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
  bidRange,
  dailyBudget,
  disclaimer,
}: EstimatedResultsCardProps) {
  const bidPosition =
    bidRange && bidRange.current && bidRange.current > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((bidRange.current - bidRange.min) /
              (bidRange.max - bidRange.min)) *
              100
          )
        )
      : -1;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">
          Estimated Results
        </Label>
        {badge && (
          <Badge variant="outline" className="text-[8px]">
            {badge}
          </Badge>
        )}
      </div>

      {bidRange && (
        <div className="mb-3 rounded-lg border border-border p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Suggested bid per {bidRange.goalName}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tabular-nums text-foreground">
              SAR {bidRange.min.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">to</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              SAR {bidRange.max.toFixed(2)}
            </span>
          </div>
          <div className="relative mt-2 h-2 w-full rounded-full bg-muted">
            <div className="absolute inset-y-0 left-[10%] right-[10%] rounded-full bg-primary/20" />
            <div className="absolute inset-y-0 left-[30%] right-[30%] rounded-full bg-primary/40" />
            {bidPosition >= 0 && (
              <div
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white shadow-sm"
                style={{
                  left: `${Math.max(5, Math.min(95, bidPosition))}%`,
                }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
            <span>Low</span>
            <span>Competitive</span>
            <span>High</span>
          </div>
        </div>
      )}

      {dailyBudget != null && bidRange && (
        <div className="mb-3 rounded-lg bg-muted/30 p-3">
          <p className="mb-1 text-xs font-medium text-foreground">
            Daily Budget Analysis
          </p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Your daily budget</span>
              <span className="font-medium tabular-nums text-foreground">
                SAR {dailyBudget}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Est. {bidRange.goalName.toLowerCase()}s per day
              </span>
              <span className="font-medium tabular-nums text-foreground">
                {bidRange.min > 0
                  ? `${Math.floor(dailyBudget / bidRange.max)}-${Math.floor(dailyBudget / bidRange.min)}`
                  : "--"}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Est. cost per {bidRange.goalName.toLowerCase()}
              </span>
              <span className="font-medium tabular-nums text-foreground">
                SAR {bidRange.min.toFixed(2)} - {bidRange.max.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {bidRange &&
        bidRange.current != null &&
        bidRange.current > 0 && (
          <div
            className={cn(
              "mb-3 flex items-start gap-2 rounded-lg border px-2.5 py-2",
              bidRange.current < bidRange.min
                ? "border-amber-200 bg-amber-50"
                : bidRange.current > bidRange.max
                  ? "border-blue-200 bg-blue-50"
                  : "border-emerald-200 bg-emerald-50"
            )}
          >
            <AlertCircle
              className={cn(
                "mt-0.5 size-3 shrink-0",
                bidRange.current < bidRange.min
                  ? "text-amber-600"
                  : bidRange.current > bidRange.max
                    ? "text-blue-600"
                    : "text-emerald-600"
              )}
            />
            <p
              className={cn(
                "text-xs",
                bidRange.current < bidRange.min
                  ? "text-amber-700"
                  : bidRange.current > bidRange.max
                    ? "text-blue-700"
                    : "text-emerald-700"
              )}
            >
              {bidRange.current < bidRange.min
                ? "Your bid is below the suggested range. Your ads may not win enough auctions."
                : bidRange.current > bidRange.max
                  ? "Your bid is above the suggested range. You may overpay per conversion."
                  : "Your bid is within the suggested range."}
            </p>
          </div>
        )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  row.highlight
                    ? "font-semibold text-primary"
                    : "text-foreground"
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {disclaimer && (
        <p className="mt-3 text-[8px] leading-relaxed text-muted-foreground">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
