"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Info, AlertTriangle } from "lucide-react";
import { SectionCard } from "@/components/shared/section-card";

export interface BidStrategyOption {
  value: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
  apiLabel?: string;
  bestFor?: string;
  recommended?: boolean;
}

export interface BidInput {
  label: string;
  desc?: string;
  value: number | undefined;
  onChange: (v: number) => void;
  suggestedRange?: { min: number; max: number };
  prefix?: string;
  suffix?: string;
  min?: number;
  step?: number;
  tip?: string;
  warning?: string;
}

interface BidStrategyCardProps {
  strategies: BidStrategyOption[];
  selectedStrategy: string;
  onStrategyChange: (value: string) => void;
  bidInputs?: BidInput[];
  billingContext?: { label: string; value: string; desc?: string }[];
  contextNote?: React.ReactNode;
  layout?: "buttons" | "cards";
  infoTipText?: string;
  children?: React.ReactNode;
}

export function BidStrategyCard({
  strategies,
  selectedStrategy,
  onStrategyChange,
  bidInputs,
  billingContext,
  contextNote,
  layout = "cards",
  infoTipText = "Choose how your budget competes for ad placements. Auto-bidding is recommended for most advertisers.",
  children,
}: BidStrategyCardProps) {
  const activeStrategy = strategies.find((s) => s.value === selectedStrategy);

  return (
    <SectionCard>
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-base font-bold text-foreground">
          Bidding Strategy
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {infoTipText}
        </p>
      </div>

      {billingContext && billingContext.length > 0 && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {billingContext.map((ctx) => (
            <div
              key={ctx.label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2.5"
            >
              <p className="text-[11px] text-muted-foreground">{ctx.label}</p>
              <p className="text-xs font-semibold text-foreground">
                {ctx.value}
              </p>
              {ctx.desc && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ctx.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {layout === "buttons" ? (
        <>
          {/* Button group */}
          <div className="flex gap-2">
            {strategies.map((s) => {
              const selected = selectedStrategy === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onStrategyChange(s.value)}
                  className={cn(
                    "flex-1 rounded-lg border px-5 py-2.5 text-xs font-medium transition-all",
                    selected
                      ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956]"
                      : "border-border bg-card text-foreground hover:border-border/80"
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Description */}
          {activeStrategy && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {activeStrategy.desc}
            </p>
          )}
        </>
      ) : (
        <div className="grid gap-2.5">
          {strategies.map((s) => {
            const selected = selectedStrategy === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onStrategyChange(s.value)}
                className={cn(
                  "relative flex items-start gap-3.5 rounded-xl border px-4 py-4 text-left transition-all",
                  selected
                    ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                    : "border-border bg-background hover:border-border/80"
                )}
              >
                {s.icon && (
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      selected
                        ? "bg-[#004956] text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        selected ? "text-[#004956]" : "text-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                    {s.recommended && (
                      <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-xs font-medium text-emerald-700">
                        Recommended
                      </Badge>
                    )}
                    {s.apiLabel && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {s.apiLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.desc}
                  </p>
                  {selected && s.bestFor && (
                    <p className="mt-1 text-xs font-medium text-[#004956]/80">
                      {s.bestFor}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {contextNote}

      {/* Bid inputs */}
      {bidInputs &&
        bidInputs.map((input) => (
          <div
            key={input.label}
            className="mt-6 rounded-xl border border-border p-4"
          >
            <div className="flex flex-col gap-4">
              {/* Label and description */}
              <div>
                <Label className="text-sm font-medium text-foreground">
                  {input.label}
                </Label>
                {input.desc && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {input.desc}
                  </p>
                )}
              </div>

              {/* Input field */}
              <div>
                <div className="relative">
                  <Input
                    type="number"
                    min={input.min ?? 0}
                    step={input.step ?? 0.01}
                    value={input.value ?? ""}
                    onChange={(e) => input.onChange(Number(e.target.value))}
                    className="h-10 pr-10 text-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {input.prefix ?? "SAR"}
                  </span>
                </div>

                {/* Suggested range */}
                {input.suggestedRange && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Suggested range{" "}
                    {input.suggestedRange.min.toFixed(
                      input.step && input.step < 0.01 ? 3 : input.step && input.step < 1 ? 2 : 0
                    )}
                    -
                    {input.suggestedRange.max.toFixed(
                      input.step && input.step < 0.01 ? 3 : input.step && input.step < 1 ? 2 : 0
                    )}
                  </p>
                )}
              </div>

              {/* Salla Tip (green alert) */}
              {input.tip && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
                  <Star className="size-4 shrink-0 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-700">
                    Salla Tip: {input.tip}
                  </p>
                </div>
              )}

              {/* Warning (yellow alert) */}
              {input.warning && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                  <Info className="size-4 shrink-0 text-amber-600" />
                  <p className="text-xs font-medium text-amber-700">
                    {input.warning}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

      {children}
    </SectionCard>
  );
}
