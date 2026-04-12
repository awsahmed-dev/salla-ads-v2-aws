"use client";

import { TrendingUp, CalendarDays, Sparkles } from "lucide-react";

const VAT_RATE = 0.15;

interface CostSummaryCardProps {
  budgetLabel: string;
  budgetAmount: number;
  durationDays?: number;
  isOngoing?: boolean;
  totalBudget: number;
  totalBudgetLabel?: string;
  autoIncreaseEnabled?: boolean;
  autoIncreaseMode?: "schedule" | "performance";
  salaryBoostEnabled?: boolean;
  boostEnabled?: boolean;
  boostAmount?: number;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  accent?: string;
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CostSummaryCard({
  budgetLabel,
  budgetAmount,
  durationDays,
  isOngoing,
  totalBudget,
  autoIncreaseEnabled,
  autoIncreaseMode = "schedule",
  salaryBoostEnabled,
  boostEnabled,
  boostAmount = 299,
  paymentMethod,
  startDate,
  endDate,
}: CostSummaryCardProps) {
  const adSpend = totalBudget;
  const dailyVat = Math.round(budgetAmount * VAT_RATE);
  const dailyTotal = budgetAmount + dailyVat;
  const totalWithBoost = adSpend + (boostEnabled ? boostAmount : 0);
  const vat = Math.round(totalWithBoost * VAT_RATE);
  const grandTotal = totalWithBoost + vat;
  const showAdSpendRow = !isOngoing && (adSpend !== budgetAmount || autoIncreaseEnabled);

  return (
    <div className="rounded-lg bg-card p-6">
      <h3 className="mb-4 text-lg font-medium text-[#004d5a]">
        Campaign Budget Summary
      </h3>

      <div className="flex flex-col gap-2.5">
        {/* Daily/Lifetime budget */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{budgetLabel}</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            SAR {budgetAmount.toLocaleString()}
          </span>
        </div>

        {/* Duration */}
        {durationDays != null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duration</span>
            <span className="text-sm font-bold text-foreground">
              {isOngoing ? "Ongoing" : `${durationDays} days`}
            </span>
          </div>
        )}

        {/* Payment method */}
        {paymentMethod && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Payment</span>
            <span className="text-sm font-bold text-foreground">
              {paymentMethod === "prepaid" ? "Prepaid (Fixed)" : "Pay as You Go"}
            </span>
          </div>
        )}

        {/* ── Fixed-end campaigns: show total ad spend ── */}
        {showAdSpendRow && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Ad spend{autoIncreaseEnabled ? ` (incl. ${autoIncreaseMode === "performance" ? "ROAS scaling" : "auto-increase"})` : ""}
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              SAR {adSpend.toLocaleString()}
            </span>
          </div>
        )}

        {/* ── Ongoing campaigns: show daily cost breakdown ── */}
        {isOngoing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">VAT (15%)</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              SAR {dailyVat.toLocaleString()}/day
            </span>
          </div>
        )}

        {/* Boost */}
        {boostEnabled && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Performance Boost</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              SAR {boostAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* ── Fixed-end: VAT on total ── */}
        {!isOngoing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">VAT (15%)</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              SAR {vat.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Divider + Total */}
      <div className="my-4 h-px bg-border" />

      {isOngoing ? (
        /* ── Ongoing: daily total ── */
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Daily total (incl. VAT)</span>
            <span className="text-base font-bold tabular-nums text-[#004d5a]">
              SAR {dailyTotal.toLocaleString()}/day
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Charged daily. You can pause or stop anytime — no commitment.
          </p>
        </div>
      ) : (
        /* ── Fixed-end: grand total ── */
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Total (incl. VAT)</span>
          <span className="text-base font-bold tabular-nums text-[#004d5a]">
            SAR {grandTotal.toLocaleString()}
          </span>
        </div>
      )}

      {/* Date range */}
      {startDate && (
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(startDate)}
          {isOngoing ? " → Ongoing" : endDate ? ` → ${formatDate(endDate)}` : ""}
        </p>
      )}

      {/* Active features */}
      {(autoIncreaseEnabled || salaryBoostEnabled) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {salaryBoostEnabled && (
            <span className="flex items-center gap-1 rounded-full bg-[#e6fff9] px-2.5 py-1 text-[10px] font-semibold text-[#004956]">
              <TrendingUp className="size-2.5" />
              Salary Boost
            </span>
          )}
          {autoIncreaseEnabled && (
            <span className="flex items-center gap-1 rounded-full bg-[#e6fff9] px-2.5 py-1 text-[10px] font-semibold text-[#004956]">
              {autoIncreaseMode === "performance" ? <Sparkles className="size-2.5" /> : <CalendarDays className="size-2.5" />}
              {autoIncreaseMode === "performance" ? "ROAS Scaling" : "Auto-Increase"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
