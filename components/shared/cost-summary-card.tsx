"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { DollarSign, Zap, Info } from "lucide-react";

const VAT_RATE = 0.15;

interface CostSummaryCardProps {
  budgetLabel: string;
  budgetAmount: number;
  durationDays?: number;
  isOngoing?: boolean;
  totalBudget: number;
  autoIncreaseEnabled?: boolean;
  boostEnabled?: boolean;
  boostAmount?: number;
  startDate?: string;
  endDate?: string;
  accent?: string;
}

export function CostSummaryCard({
  budgetLabel,
  budgetAmount,
  durationDays,
  isOngoing,
  totalBudget,
  autoIncreaseEnabled,
  boostEnabled,
  boostAmount = 149,
  startDate,
  endDate,
  accent,
}: CostSummaryCardProps) {
  const totalWithBoost = totalBudget + (boostEnabled ? boostAmount : 0);
  const vat = Math.round(totalWithBoost * VAT_RATE);
  const grandTotal = Math.round(totalWithBoost * (1 + VAT_RATE));
  const accentColor = accent ?? "primary";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <DollarSign className={cn("size-4", `text-${accentColor}`)} />
        <Label className="text-sm font-semibold text-foreground">Cost Summary</Label>
      </div>
      <div className="flex flex-col gap-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{budgetLabel}</span>
          <span className="font-semibold tabular-nums text-foreground">
            {budgetAmount.toLocaleString()} SAR
          </span>
        </div>

        {durationDays != null && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium text-foreground">
              {isOngoing ? "Ongoing" : `${durationDays} days`}
            </span>
          </div>
        )}

        {totalBudget !== budgetAmount && (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Ad spend</span>
              <span className="font-medium tabular-nums text-foreground">
                {totalBudget.toLocaleString()} SAR
              </span>
            </div>
            {autoIncreaseEnabled && (
              <p className={cn("text-right text-[10px]", `text-${accentColor}`)}>
                incl. auto-increase
              </p>
            )}
          </div>
        )}

        {boostEnabled && (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap className="size-3" /> Boost
            </span>
            <span className="font-medium text-foreground">
              {boostAmount} SAR
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-muted-foreground">
            VAT (15%)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-2.5 cursor-help text-muted-foreground/60" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Saudi Arabia VAT at 15% applied to total ad spend per ZATCA
                regulations.
              </TooltipContent>
            </Tooltip>
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {vat.toLocaleString()} SAR
          </span>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">
            Total (incl. VAT)
          </span>
          <span className={cn("text-lg font-bold tabular-nums", `text-${accentColor}`)}>
            {grandTotal.toLocaleString()} SAR
          </span>
        </div>

        {startDate && (
          <p className="text-xs text-muted-foreground">
            {startDate}
            {isOngoing ? " (ongoing)" : endDate ? ` to ${endDate}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
