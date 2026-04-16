"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Zap, Sparkles, CircleHelp, ArrowDown, CheckCircle2, TrendingUp, ShoppingCart, Eye } from "lucide-react";
import { InfoTip } from "@/components/shared/info-tip";
import { SectionCard } from "@/components/shared/section-card";

export interface ConversionEventOption {
  value: string;
  label: string;
  desc: string;
  icon?: React.ReactNode;
  funnelStage?: string;
  recommended?: boolean;
}

interface RoasConfig {
  value: number | undefined;
  onChange: (v: number) => void;
  label?: string;
  apiBadge?: string;
}

interface ConversionEventCardProps {
  title?: string;
  events: ConversionEventOption[];
  selectedEvent: string;
  onEventChange: (value: string) => void;
  roas?: RoasConfig;
  accent?: string;
  apiBadge?: string;
  infoTipText?: string;
  tip?: string;
  layout?: "grid" | "dropdown";
  children?: React.ReactNode;
}

export function ConversionEventCard({
  title = "Conversion Event",
  events,
  selectedEvent,
  onEventChange,
  roas,
  accent = "primary",
  apiBadge,
  infoTipText = "The specific action the platform will optimize for.",
  tip,
  layout = "grid",
  children,
}: ConversionEventCardProps) {
  const isCustomAccent = accent.startsWith("#");
  const accentStyle = isCustomAccent ? { color: accent } : undefined;
  const selectedBorder = isCustomAccent
    ? { borderColor: accent }
    : undefined;
  const selectedBg = isCustomAccent
    ? { backgroundColor: `${accent}08` }
    : undefined;
  const iconBg = isCustomAccent
    ? { backgroundColor: accent, color: "#fff" }
    : undefined;

  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedOption = events.find((e) => e.value === selectedEvent);

  /* ── Dropdown layout ── */
  if (layout === "dropdown") {
    return (
      <SectionCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap
              className={cn("size-4", !isCustomAccent && "text-primary")}
              style={accentStyle}
            />
            <Label className="text-sm font-semibold text-foreground">{title}</Label>
            {apiBadge && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
                {apiBadge}
              </Badge>
            )}
            <InfoTip text={infoTipText} />
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-[#a4ffe5] hover:text-[#004956]"
          >
            <CircleHelp className="size-3" />
            How does this work?
          </button>
        </div>

        <div className="mt-3">
          <Select value={selectedEvent} onValueChange={onEventChange}>
            <SelectTrigger className="h-10">
              <SelectValue>
                {selectedOption && (
                  <span className="flex items-center gap-2">
                    {selectedOption.icon && <span className="shrink-0 [&>svg]:size-3.5">{selectedOption.icon}</span>}
                    <span className="font-medium">{selectedOption.label}</span>
                    {selectedOption.recommended && (
                      <Badge className="rounded-full border-0 bg-[#a4ffe5] px-1.5 py-0 text-[10px] font-medium text-[#004956]">
                        Recommended
                      </Badge>
                    )}
                    {selectedOption.funnelStage && (
                      <span className="text-xs text-muted-foreground">{selectedOption.funnelStage}</span>
                    )}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {events.map((ev) => (
                <SelectItem key={ev.value} value={ev.value}>
                  <span className="flex items-center gap-2">
                    {ev.icon && <span className="shrink-0 [&>svg]:size-3.5">{ev.icon}</span>}
                    <span className="font-medium">{ev.label}</span>
                    {ev.recommended && (
                      <Badge className="rounded-full border-0 bg-[#a4ffe5] px-1.5 py-0 text-[10px] font-medium text-[#004956]">
                        Recommended
                      </Badge>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">{ev.funnelStage}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description of selected event */}
        {selectedOption && (
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {selectedOption.desc}
          </p>
        )}

        {tip && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#a4ffe5] bg-[#e6fff9] px-3 py-2">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
            <p className="text-[11px] leading-relaxed text-[#004956]/80">
              <span className="font-semibold text-[#004956]">Salla Tip:</span> {tip}
            </p>
          </div>
        )}

        {roas && (
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Label className="text-xs font-semibold text-foreground">
                {roas.label ?? "Minimum ROAS Target"}
              </Label>
              {roas.apiBadge && (
                <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
                  {roas.apiBadge}
                </Badge>
              )}
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Set the minimum return on ad spend you want. The platform will
              optimize delivery to meet this target.
            </p>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min={0.01}
                  max={1000}
                  step={0.1}
                  value={roas.value ?? ""}
                  onChange={(e) => roas.onChange(Number(e.target.value))}
                  className="h-10 text-base font-semibold"
                  placeholder="e.g. 3.0"
                />
              </div>
              <div className="shrink-0 text-center">
                <p className="text-xs text-muted-foreground">
                  SAR 1 spent → SAR {(roas.value || 0).toFixed(1)}
                </p>
                <p className="text-xs font-medium text-[#004956]">
                  Recommended: 2.0x - 5.0x
                </p>
              </div>
            </div>
          </div>
        )}

        {children}

        {/* ── Learn More Sheet ── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto border-l-0 p-0 sm:max-w-[420px]">
            {/* ── Header ── */}
            <div className="bg-[#004956] px-6 pb-6 pt-8">
              <SheetTitle className="flex items-center gap-2.5 text-lg font-bold text-white">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#a4ffe5]">
                  <Zap className="size-4 text-[#004956]" />
                </div>
                Conversion Events
              </SheetTitle>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                Choose which customer action the ad platform optimizes for. This determines who sees your ads.
              </p>
            </div>

            {/* ── Funnel Visualization ── */}
            <div className="px-6 py-6">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="size-4 text-[#004956]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#004956]">
                  E-Commerce Funnel
                </p>
              </div>

              <div className="flex flex-col gap-0">
                {[...events].reverse().map((ev, idx, arr) => {
                  const isSelected = ev.value === selectedEvent;
                  const widthPct = 55 + ((arr.length - 1 - idx) / (arr.length - 1)) * 45;

                  return (
                    <div key={ev.value} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          onEventChange(ev.value);
                          setSheetOpen(false);
                        }}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                          isSelected
                            ? "border-[#a4ffe5] bg-[#e6fff9] shadow-sm"
                            : "border-border bg-white hover:border-[#a4ffe5] hover:bg-[#e6fff9]/40"
                        )}
                        style={{ width: `${widthPct}%` }}
                      >
                        {ev.icon && (
                          <div
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-lg",
                              isSelected
                                ? "bg-[#004956] text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {ev.icon}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs font-bold", isSelected ? "text-[#004956]" : "text-foreground")}>
                              {ev.label}
                            </span>
                            {ev.recommended && (
                              <Badge className="rounded-full border-0 bg-[#a4ffe5] px-1.5 py-0 text-[9px] font-bold text-[#004956]">
                                Best
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                            {ev.funnelStage}
                          </span>
                          {isSelected && <CheckCircle2 className="size-4 text-[#004956]" />}
                        </div>
                      </button>

                      {idx < arr.length - 1 && (
                        <ArrowDown className="my-0.5 size-3.5 text-muted-foreground/30" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Funnel labels */}
              <div className="mt-3 flex items-center justify-between px-2">
                <div className="flex items-center gap-1">
                  <Eye className="size-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">More volume, lower intent</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="size-3 text-[#004956]" />
                  <span className="text-[10px] font-medium text-[#004956]">Fewer results, higher value</span>
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-border" />

            {/* ── How to Choose ── */}
            <div className="px-6 py-6">
              <div className="mb-4 flex items-center gap-2">
                <CircleHelp className="size-4 text-[#004956]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#004956]">
                  How to Choose
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl border border-[#a4ffe5] bg-[#e6fff9] px-4 py-3">
                  <p className="text-xs font-bold text-[#004956]">New store or new pixel?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#004956]/70">
                    Start with <span className="font-semibold text-[#004956]">Add to Cart</span> or <span className="font-semibold text-[#004956]">View Product</span>. Your pixel needs data to optimize — these events fire more often, giving the algorithm more signal.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white px-4 py-3">
                  <p className="text-xs font-bold text-foreground">Established store (50+ weekly purchases)?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Use <span className="font-semibold text-foreground">Purchase</span> for maximum ROI. The platform has enough conversion data to find high-intent buyers.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-white px-4 py-3">
                  <p className="text-xs font-bold text-foreground">High-ticket products?</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Consider <span className="font-semibold text-foreground">Initiate Checkout</span> — it fires more frequently than Purchase while still targeting high-intent users.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Salla Tip Footer ── */}
            <div className="border-t border-border bg-muted/30 px-6 py-4">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#004956]" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-[#004956]">Pro tip:</span> Start with a higher-funnel event (Add to Cart) for 2-4 weeks, then switch to Purchase once you have enough conversion data. This gives the algorithm time to learn.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </SectionCard>
    );
  }

  /* ── Grid layout (original) ── */
  return (
    <SectionCard>
      <div className="mb-4 flex items-center gap-2">
        <Zap
          className={cn("size-4", !isCustomAccent && "text-primary")}
          style={accentStyle}
        />
        <Label className="text-sm font-semibold text-foreground">{title}</Label>
        {apiBadge && (
          <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
            {apiBadge}
          </Badge>
        )}
        <InfoTip text={infoTipText} />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {events.map((ev) => {
          const selected = selectedEvent === ev.value;
          return (
            <button
              key={ev.value}
              type="button"
              onClick={() => onEventChange(ev.value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                selected
                  ? isCustomAccent
                    ? "border-2 shadow-sm"
                    : "border-primary bg-primary/5 shadow-sm"
                  : isCustomAccent
                    ? "border-2 border-border bg-background hover:border-primary/40"
                    : "border-border bg-background hover:border-primary/40"
              )}
              style={selected ? { ...selectedBorder, ...selectedBg } : undefined}
            >
              {ev.icon && (
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? !isCustomAccent && "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                  style={selected && isCustomAccent ? iconBg : undefined}
                >
                  {ev.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {ev.label}
                  </span>
                  {ev.recommended && (
                    <Badge className="rounded-full border-0 bg-emerald-100 px-1 py-0 text-[11px] font-medium text-emerald-700">
                      Best
                    </Badge>
                  )}
                  {ev.funnelStage && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {ev.funnelStage}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {ev.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {tip && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
          <p className="text-[11px] leading-relaxed text-emerald-700">
            <span className="font-semibold">Salla Tip:</span> {tip}
          </p>
        </div>
      )}

      {roas && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Label className="text-xs font-semibold text-foreground">
              {roas.label ?? "Minimum ROAS Target"}
            </Label>
            {roas.apiBadge && (
              <Badge variant="secondary" className="rounded-full px-1.5 py-0 text-xs font-normal">
                {roas.apiBadge}
              </Badge>
            )}
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Set the minimum return on ad spend you want. The platform will
            optimize delivery to meet this target.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0.01}
                max={1000}
                step={0.1}
                value={roas.value ?? ""}
                onChange={(e) => roas.onChange(Number(e.target.value))}
                className="h-10 text-base font-semibold"
                placeholder="e.g. 3.0"
              />
            </div>
            <div className="shrink-0 text-center">
              <p className="text-xs text-muted-foreground">
                SAR 1 spent → SAR {(roas.value || 0).toFixed(1)}
              </p>
              <p className="text-xs font-medium text-emerald-600">
                Recommended: 2.0x - 5.0x
              </p>
            </div>
          </div>
        </div>
      )}

      {children}
    </SectionCard>
  );
}
