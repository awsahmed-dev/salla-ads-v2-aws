"use client";

const VAT_RATE = 0.15;

interface CostSummaryCardProps {
  budgetLabel: string;
  budgetAmount: number;
  durationDays?: number;
  isOngoing?: boolean;
  totalBudget: number;
  totalBudgetLabel?: string;
  autoIncreaseEnabled?: boolean;
  boostEnabled?: boolean;
  boostAmount?: number;
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
  boostEnabled,
  boostAmount = 299,
  startDate,
  endDate,
}: CostSummaryCardProps) {
  const adSpend = totalBudget;
  const totalWithBoost = adSpend + (boostEnabled ? boostAmount : 0);
  const vat = Math.round(totalWithBoost * VAT_RATE);
  const grandTotal = totalWithBoost + vat;
  const showAdSpendRow = adSpend !== budgetAmount;

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

        {/* Ad spend total (only if different from daily) */}
        {showAdSpendRow && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Ad spend{autoIncreaseEnabled ? " (incl. auto-increase)" : ""}
            </span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              SAR {adSpend.toLocaleString()}
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

        {/* VAT */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">VAT (15%)</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            SAR {vat.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Divider + Total */}
      <div className="my-4 h-px bg-border" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">Total (incl. VAT)</span>
        <span className="text-base font-bold tabular-nums text-[#004d5a]">
          SAR {grandTotal.toLocaleString()}
        </span>
      </div>

      {/* Date range */}
      {startDate && (
        <p className="mt-2 text-xs text-muted-foreground">
          {formatDate(startDate)}
          {isOngoing ? " → Ongoing" : endDate ? ` → ${formatDate(endDate)}` : ""}
        </p>
      )}
    </div>
  );
}
