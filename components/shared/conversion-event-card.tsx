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
import { Zap, Sparkles, ChevronRight, ArrowDown, CheckCircle2 } from "lucide-react";
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

        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <Select value={selectedEvent} onValueChange={onEventChange}>
              <SelectTrigger className="h-10">
                <SelectValue>
                  {selectedOption && (
                    <span className="flex items-center gap-2">
                      {selectedOption.icon && <span className="shrink-0 [&>svg]:size-3.5">{selectedOption.icon}</span>}
                      <span className="font-medium">{selectedOption.label}</span>
                      {selectedOption.recommended && (
                        <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                          Best
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
                        <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                          Best
                        </Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">{ev.funnelStage}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
          >
            Learn about events
            <ChevronRight className="size-3.5" />
          </button>
        </div>

        {/* Description of selected event */}
        {selectedOption && (
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {selectedOption.desc}
          </p>
        )}

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

        {/* ── Learn More Sheet ── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold">
              <Zap className="size-5 text-primary" />
              Conversion Events
            </SheetTitle>

            <p className="mt-2 text-sm text-muted-foreground">
              Conversion events tell the platform which customer action to optimize for.
              Choose the event that best matches your campaign goal.
            </p>

            {/* Visual Funnel */}
            <div className="mt-6 flex flex-col items-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-Commerce Funnel
              </p>

              <div className="flex w-full flex-col gap-0">
                {[...events].reverse().map((ev, idx, arr) => {
                  const isSelected = ev.value === selectedEvent;
                  const isTop = idx === 0;
                  const isBottom = idx === arr.length - 1;
                  const widthPct = 60 + ((arr.length - 1 - idx) / (arr.length - 1)) * 40;

                  return (
                    <div key={ev.value} className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => {
                          onEventChange(ev.value);
                          setSheetOpen(false);
                        }}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                        style={{ width: `${widthPct}%` }}
                      >
                        {ev.icon && (
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg",
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {ev.icon}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{ev.label}</span>
                            {ev.recommended && (
                              <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0 text-[10px] font-medium text-emerald-700">
                                Best
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{ev.desc}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                            {ev.funnelStage}
                          </span>
                          {isSelected && <CheckCircle2 className="size-4 text-primary" />}
                        </div>
                      </button>

                      {/* Arrow between items */}
                      {idx < arr.length - 1 && (
                        <ArrowDown className="my-1 size-4 text-muted-foreground/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips section */}
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">How to Choose</h3>

              <div className="space-y-2">
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">New store or new pixel?</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Start with <span className="font-semibold">Add to Cart</span> or <span className="font-semibold">View Product</span>. Your pixel needs data to optimize — these events fire more often, giving the algorithm more signal.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">Established store (50+ weekly purchases)?</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Use <span className="font-semibold">Purchase</span> for maximum ROI. The platform has enough conversion data to find high-intent buyers.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground">High-ticket products?</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Consider <span className="font-semibold">Initiate Checkout</span> — it fires more frequently than Purchase, giving the algorithm more data while still targeting high-intent users.
                  </p>
                </div>
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
