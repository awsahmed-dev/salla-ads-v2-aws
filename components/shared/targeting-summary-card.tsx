"use client";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export type TargetingSummaryAccent = "primary" | "meta" | "dv360";

export interface TargetingSummaryRow {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
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
  className,
}: TargetingSummaryCardProps) {
  if (rows.length === 0) return null;

  return (
    <div className={cn("rounded-xl bg-card p-6", className)}>
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#e6fff9]">
          <Users className="size-5 text-[#004956]" />
        </div>
        <p className="text-sm font-bold text-foreground">{title}</p>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2.5">
        {rows.map((row, i) => {
          const empty = row.value === "None" || row.value === "Not set" || row.value === "" || row.value === null;
          return (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span
                className={cn(
                  "max-w-[55%] truncate text-right text-sm font-bold",
                  empty ? "text-muted-foreground italic" : "text-foreground"
                )}
                title={typeof row.value === "string" ? row.value : undefined}
              >
                {empty ? "Not set" : row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
