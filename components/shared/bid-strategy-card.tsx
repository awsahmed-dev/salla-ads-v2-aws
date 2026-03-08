"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Info, Sparkles, AlertTriangle } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
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

  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="size-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">
          Bid Strategy
        </Label>
        <InfoTip text={infoTipText} />
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
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {ctx.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {layout === "buttons" ? (
        <>
          <div className="flex gap-2">
            {strategies.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onStrategyChange(s.value)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  selectedStrategy === s.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/40"
                )}
              >
                <span>{s.label}</span>
                {s.recommended && selectedStrategy !== s.value && (
                  <Badge
                    variant="secondary"
                    className="ml-1 rounded-full px-1 py-0 text-[8px]"
                  >
                    Best
                  </Badge>
                )}
              </button>
            ))}
          </div>
          {activeStrategy && (
            <div className="mt-2.5">
              <p className="text-xs text-muted-foreground">
                {activeStrategy.desc}
              </p>
              {activeStrategy.bestFor && (
                <p className="mt-1 text-xs font-medium text-primary/80">
                  {activeStrategy.bestFor}
                </p>
              )}
            </div>
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
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                {s.icon && (
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      selected
                        ? "bg-primary text-primary-foreground"
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
                        selected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {s.label}
                    </span>
                    {s.recommended && (
                      <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                        Recommended
                      </Badge>
                    )}
                    {s.apiLabel && (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {s.apiLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.desc}
                  </p>
                  {selected && s.bestFor && (
                    <p className="mt-1 text-xs font-medium text-primary/80">
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

      {bidInputs &&
        bidInputs.map((input) => (
          <div
            key={input.label}
            className="mt-4 rounded-xl border border-border bg-muted/20 p-4"
          >
            <Label className="mb-1 block text-xs font-semibold text-foreground">
              {input.label}
            </Label>
            {input.desc && (
              <p className="mb-3 text-[11px] text-muted-foreground">
                {input.desc}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                {input.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    {input.prefix}
                  </span>
                )}
                <Input
                  type="number"
                  min={input.min ?? 0}
                  step={input.step ?? 0.01}
                  value={input.value ?? ""}
                  onChange={(e) => input.onChange(Number(e.target.value))}
                  className={cn(
                    "h-10 text-base font-semibold",
                    input.prefix && "pl-12",
                    input.suffix && !input.suggestedRange && "pr-24"
                  )}
                />
                {input.suffix && !input.suggestedRange && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {input.suffix}
                  </span>
                )}
              </div>
              {input.suggestedRange && (
                <div className="shrink-0 rounded-lg bg-muted px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Suggested range
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {input.prefix ?? ""} {input.suggestedRange.min.toFixed(input.step && input.step < 0.01 ? 3 : input.step && input.step < 1 ? 2 : 0)}{" "}
                    - {input.suggestedRange.max.toFixed(input.step && input.step < 0.01 ? 3 : input.step && input.step < 1 ? 2 : 0)}
                  </p>
                </div>
              )}
            </div>
            {input.warning && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <p className="text-[11px] leading-relaxed text-amber-700">
                  {input.warning}
                </p>
              </div>
            )}
            {input.tip && !input.warning && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <p className="text-[11px] leading-relaxed text-emerald-700">
                  <span className="font-semibold">Salla Tip:</span> {input.tip}
                </p>
              </div>
            )}
          </div>
        ))}

      {children}
    </SectionCard>
  );
}
