"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Info, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
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
  infoTipText = "Choose how your budget competes for ad placements.",
  children,
}: BidStrategyCardProps) {
  const activeStrategy = strategies.find((s) => s.value === selectedStrategy);
  const isAuto = selectedStrategy === "AUTO_BID";

  return (
    <SectionCard>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-foreground">
          Bidding Strategy
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {infoTipText}
        </p>
      </div>

      {billingContext && billingContext.length > 0 && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {billingContext.map((ctx) => (
            <div key={ctx.label} className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">{ctx.label}</p>
              <p className="text-xs font-semibold text-foreground">{ctx.value}</p>
              {ctx.desc && <p className="mt-0.5 text-xs text-muted-foreground">{ctx.desc}</p>}
            </div>
          ))}
        </div>
      )}

      {layout === "buttons" ? (
        <>
          {/* Compact button row */}
          <div className="flex gap-2">
            {strategies.map((s) => {
              const selected = selectedStrategy === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onStrategyChange(s.value)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all",
                    selected
                      ? "border-[#a4ffe5] bg-[#e6fff9] text-[#004956]"
                      : "border-border bg-card text-muted-foreground hover:border-[#a4ffe5]/60 hover:text-foreground"
                  )}
                >
                  {selected && s.recommended && <CheckCircle2 className="size-3" />}
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Strategy description */}
          {activeStrategy && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/20 px-3 py-2.5">
              {isAuto ? (
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
              ) : (
                <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              )}
              <p className={cn("text-[11px] leading-relaxed", isAuto ? "text-[#004956]/80" : "text-muted-foreground")}>
                {activeStrategy.desc}
              </p>
            </div>
          )}
        </>
      ) : (
        /* Card layout */
        <div className="grid gap-2.5">
          {strategies.map((s) => {
            const selected = selectedStrategy === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onStrategyChange(s.value)}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all",
                  selected
                    ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                    : "border-border bg-background hover:border-[#a4ffe5]/60"
                )}
              >
                {s.icon && (
                  <div className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-[#004956] text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {s.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-bold", selected ? "text-[#004956]" : "text-foreground")}>
                      {s.label}
                    </span>
                    {s.recommended && (
                      <Badge className="rounded-full border-0 bg-[#004956] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {contextNote}

      {/* Bid inputs — show when non-auto strategy is selected */}
      {bidInputs && bidInputs.map((input) => (
        <div key={input.label} className="mt-4 rounded-xl border border-border bg-muted/10 p-4">
          <Label className="text-xs font-semibold text-foreground">{input.label}</Label>
          {input.desc && <p className="mt-0.5 text-[11px] text-muted-foreground">{input.desc}</p>}

          <div className="mt-3 relative">
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

          {/* Suggested range — prominent display */}
          {input.suggestedRange && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Suggested:</span>
              <span className="rounded-full bg-[#e6fff9] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#004956]">
                SAR {input.suggestedRange.min.toFixed(input.step && input.step < 1 ? 2 : 0)} – {input.suggestedRange.max.toFixed(input.step && input.step < 1 ? 2 : 0)}
              </span>
            </div>
          )}

          {/* Tip */}
          {input.tip && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
              <p className="text-[11px] text-emerald-700">{input.tip}</p>
            </div>
          )}

          {/* Warning */}
          {input.warning && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
              <p className="text-[11px] text-amber-700">{input.warning}</p>
            </div>
          )}
        </div>
      ))}

      {children}
    </SectionCard>
  );
}
