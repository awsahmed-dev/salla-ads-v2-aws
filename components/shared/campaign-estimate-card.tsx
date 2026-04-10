"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { DollarSign, Zap } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  VAT                                                                */
/* ------------------------------------------------------------------ */

const VAT_RATE = 0.15;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface CampaignEstimateCardProps {
  /* Cost data */
  dailyBudget: number;
  durationDays: number;
  isOngoing: boolean;
  totalBudget: number;
  boostEnabled: boolean;
  boostAmount: number;
  startDate?: string;
  endDate?: string;

  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CampaignEstimateCard({
  dailyBudget,
  durationDays,
  isOngoing,
  totalBudget,
  boostEnabled,
  boostAmount,
  startDate,
  endDate,
  className,
}: CampaignEstimateCardProps) {
  /* ---- Cost calculations ---- */
  const totalWithBoost = totalBudget + (boostEnabled ? boostAmount : 0);
  const vat = Math.round(totalWithBoost * VAT_RATE);
  const grandTotal = Math.round(totalWithBoost * (1 + VAT_RATE));

  /* ---- Date display ---- */
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-SA", { month: "short", day: "numeric" });

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm overflow-hidden", className)}>

      {/* ============================================================ */}
      {/* SECTION: Budget Summary                                      */}
      {/* ============================================================ */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="size-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Budget Summary</Label>
        </div>

        <div className="space-y-1.5 text-xs">
          <Row label="Daily budget" value={`SAR ${dailyBudget.toLocaleString()}`} />
          <Row label="Duration" value={isOngoing ? "Ongoing" : `${durationDays} days`} />
          {totalBudget !== dailyBudget && !isOngoing && (
            <Row label="Ad spend" value={`SAR ${totalBudget.toLocaleString()}`} />
          )}
          {boostEnabled && (
            <Row label="Boost" value={`SAR ${boostAmount}`} icon={<Zap className="size-2.5" />} />
          )}
          <Row label={`VAT (${(VAT_RATE * 100).toFixed(0)}%)`} value={`SAR ${vat.toLocaleString()}`} />
          <div className="h-px bg-border my-1" />
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Total (incl. VAT)</span>
            <span className="text-base font-bold tabular-nums text-primary">
              SAR {grandTotal.toLocaleString()}
            </span>
          </div>
          {startDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {fmtDate(startDate)}
              {isOngoing ? " → Ongoing" : endDate ? ` → ${fmtDate(endDate)}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon}{label}
      </span>
      <span className="font-medium tabular-nums text-foreground">{value}</span>
    </div>
  );
}
